"""
Email <-> Firebase Bridge Service.

Handles the two main flows:
  1. Inbound: parsed email -> customer lookup/creation -> conversation -> message
  2. Outbound: agent reply from dashboard -> SMTP send -> message storage
"""

from __future__ import annotations

import hashlib
import logging
import re
from datetime import datetime, timezone

from app.firebase import database
from app.services.email.parser import ParsedEmail
from app.services.email.smtp_service import SMTPService

logger = logging.getLogger(__name__)

UTC = timezone.utc
WORKSPACE_ID = "ws_demo"
DEFAULT_ASSIGNED_AGENT = "admin_acme"  # Option A: admin triages inbound email


def _now_iso() -> str:
    """Current UTC timestamp in ISO format (Z suffix)."""
    return (
        datetime.now(UTC)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def _slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return cleaned or "item"


def _initials(name: str) -> str:
    parts = [p for p in re.split(r"\s+", name.strip()) if p]
    return "".join(p[0] for p in parts[:2]).upper() or "?"


def _customer_id_from_email(email_addr: str) -> str:
    """
    Deterministic customer ID derived from email address.

    Uses a short hash so the same sender always maps to the same customer.
    """
    digest = hashlib.md5(email_addr.lower().encode()).hexdigest()[:8]
    return f"customer_email_{digest}"


# ---------------------------------------------------------------------------
# Inbound email processing
# ---------------------------------------------------------------------------

def process_inbound_email(parsed: ParsedEmail) -> dict:
    """
    Process a single inbound email and persist to Firebase.

    Steps:
      1. Find or create the customer by sender email
      2. Determine if this is a reply (thread continuation) or new conversation
      3. Create the conversation (if new) or update the existing one
      4. Store the message

    Args:
        parsed: The parsed email data from the parser.

    Returns:
        A dict with ``conversation_id`` and ``message_id``.
    """
    now = _now_iso()
    sender_email = parsed.sender_email
    sender_name = parsed.sender_name or sender_email

    # 1. Find or create customer
    customer_id = _find_or_create_customer(sender_email, sender_name, now)

    # 2. Try to find existing conversation (threading)
    conversation_id = _find_existing_conversation(parsed)

    if conversation_id:
        # Thread continuation
        logger.info(
            "[EMAIL->FB] Threading into existing conversation %s", conversation_id
        )
        conv_data = database.child("conversations").child(conversation_id).get()
        if not isinstance(conv_data, dict):
            # Conversation was deleted between lookup and now; create new
            conversation_id = None

    if not conversation_id:
        # New conversation
        conversation_id = _create_email_conversation(
            customer_id=customer_id,
            subject=parsed.subject or "(No Subject)",
            email_message_id=parsed.message_id,
            email_references=parsed.references,
            now=now,
        )
        conv_data = database.child("conversations").child(conversation_id).get()
        logger.info(
            "[EMAIL->FB] Created new email conversation %s from %s",
            conversation_id,
            sender_email,
        )

    # 3. Store the message
    message_id = _store_message(
        conversation_id=conversation_id,
        conv_data=conv_data,
        sender_type="customer",
        sender_id=customer_id,
        sender_name=sender_name,
        content=parsed.body or "(empty body)",
        channel="email",
        email_message_id=parsed.message_id,
        now=now,
    )

    # 4. Update conversation threading fields with the latest Message-ID
    _update_conversation_threading(
        conversation_id, parsed.message_id, parsed.references
    )

    return {"conversation_id": conversation_id, "message_id": message_id}


# ---------------------------------------------------------------------------
# Outbound reply processing
# ---------------------------------------------------------------------------

def process_outbound_reply(
    conversation_id: str,
    sender_id: str,
    sender_name: str,
    content: str,
) -> dict:
    """
    Send an email reply from the agent dashboard and store it.

    Steps:
      1. Look up conversation to get customer email + threading headers
      2. Send via SMTP with proper In-Reply-To / References
      3. Store the agent message in Firebase
      4. Update conversation threading

    Args:
        conversation_id: The Firebase conversation ID.
        sender_id: The agent's user ID.
        sender_name: The agent's display name.
        content: The reply text.

    Returns:
        A dict with ``message_id`` and ``smtp_message_id``.
    """
    now = _now_iso()

    conv_data = database.child("conversations").child(conversation_id).get()
    if not isinstance(conv_data, dict):
        raise ValueError(f"Conversation {conversation_id} not found.")

    customer_id = conv_data.get("customer_id", "")
    subject = conv_data.get("subject", "")
    email_message_id = conv_data.get("email_message_id", "")
    email_references: list[str] = conv_data.get("email_references", [])

    # Find customer email
    customer_data = database.child("customers").child(customer_id).get()
    if not isinstance(customer_data, dict):
        raise ValueError(f"Customer {customer_id} not found.")

    customer_email = customer_data.get("email", "")
    if not customer_email:
        raise ValueError(f"Customer {customer_id} has no email address.")

    # Build references chain for SMTP
    smtp_references = list(email_references)
    if email_message_id and email_message_id not in smtp_references:
        smtp_references.append(email_message_id)

    # Send via SMTP
    smtp = SMTPService()
    new_message_id = smtp.send_reply(
        to=customer_email,
        subject=subject,
        body=content,
        in_reply_to=email_message_id,
        references=smtp_references if smtp_references else None,
    )

    # Store the message
    message_id = _store_message(
        conversation_id=conversation_id,
        conv_data=conv_data,
        sender_type="agent",
        sender_id=sender_id,
        sender_name=sender_name,
        content=content,
        channel="email",
        email_message_id=new_message_id,
        now=now,
    )

    # Update threading with the new outbound Message-ID
    new_refs = list(smtp_references)
    if new_message_id not in new_refs:
        new_refs.append(new_message_id)

    _update_conversation_threading(conversation_id, new_message_id, new_refs)

    logger.info(
        "[EMAIL->FB] Outbound reply sent for %s to %s",
        conversation_id,
        customer_email,
    )

    return {"message_id": message_id, "smtp_message_id": new_message_id}


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _find_or_create_customer(
    email_addr: str, name: str, now: str
) -> str:
    """Look up customer by email; create if not found. Returns customer_id."""
    all_customers = database.child("customers").get()

    if isinstance(all_customers, dict):
        for cust_id, cust_data in all_customers.items():
            if isinstance(cust_data, dict):
                if cust_data.get("email", "").lower() == email_addr.lower():
                    return cust_data.get("customer_id", cust_id)

    # Auto-create customer
    customer_id = _customer_id_from_email(email_addr)
    customer_record = {
        "customer_id": customer_id,
        "name": name,
        "email": email_addr.lower(),
        "avatar": _initials(name),
        "created_at": now,
    }
    database.child("customers").child(customer_id).set(customer_record)
    logger.info("[EMAIL->FB] Auto-created customer %s (%s)", customer_id, email_addr)
    return customer_id


def _find_existing_conversation(parsed: ParsedEmail) -> str | None:
    """
    Find an existing conversation that this email is a reply to.

    Checks In-Reply-To and References headers against stored
    ``email_message_id`` and ``email_references`` on conversations.
    """
    # Collect all Message-IDs we can search for
    search_ids: set[str] = set()
    if parsed.in_reply_to:
        search_ids.add(parsed.in_reply_to)
    for ref in parsed.references:
        search_ids.add(ref)

    if not search_ids:
        return None

    all_conversations = database.child("conversations").get()
    if not isinstance(all_conversations, dict):
        return None

    for conv_id, conv_data in all_conversations.items():
        if not isinstance(conv_data, dict):
            continue
        if conv_data.get("channel") != "email":
            continue

        conv_msg_id = conv_data.get("email_message_id", "")
        conv_refs: list[str] = conv_data.get("email_references", [])

        # Check if any of our search IDs match the conversation's threading data
        if conv_msg_id in search_ids:
            return conv_id
        if any(ref in search_ids for ref in conv_refs):
            return conv_id

    return None


def _create_email_conversation(
    customer_id: str,
    subject: str,
    email_message_id: str,
    email_references: list[str],
    now: str,
) -> str:
    """Create a new email-channel conversation in Firebase."""
    # Generate a unique conversation ID
    digest = hashlib.md5(
        f"{email_message_id}{now}".encode()
    ).hexdigest()[:10]
    conversation_id = f"conv_email_{digest}"

    conversation_record = {
        "conversation_id": conversation_id,
        "workspace_id": WORKSPACE_ID,
        "customer_id": customer_id,
        "assigned_agent": DEFAULT_ASSIGNED_AGENT,
        "status": "Open",
        "channel": "email",
        "priority": "medium",
        "created_at": now,
        "last_message_at": now,
        "summary": f"Email: {subject}",
        "subject": subject,
        "message_count": 0,
        "message_ids": [],
        "email_message_id": email_message_id,
        "email_references": email_references if email_references else [email_message_id],
    }

    database.child("conversations").child(conversation_id).set(conversation_record)
    return conversation_id


def _store_message(
    conversation_id: str,
    conv_data: dict,
    sender_type: str,
    sender_id: str,
    sender_name: str,
    content: str,
    channel: str,
    email_message_id: str,
    now: str,
) -> str:
    """Create a message record and update conversation metadata."""
    message_count = conv_data.get("message_count", 0) + 1
    message_id = f"msg_{conversation_id}_{message_count:02d}"

    message_record = {
        "message_id": message_id,
        "conversation_id": conversation_id,
        "workspace_id": conv_data.get("workspace_id", WORKSPACE_ID),
        "sender_type": sender_type,
        "sender_id": sender_id,
        "sender_name": sender_name,
        "content": content,
        "created_at": now,
        "channel": channel,
        "email_message_id": email_message_id,
    }

    database.child("messages").child(message_id).set(message_record)

    # Update conversation metadata
    message_ids: list[str] = conv_data.get("message_ids", [])
    message_ids.append(message_id)

    database.child("conversations").child(conversation_id).update(
        {
            "message_count": message_count,
            "message_ids": message_ids,
            "last_message_at": now,
        }
    )

    return message_id


def _update_conversation_threading(
    conversation_id: str,
    latest_message_id: str,
    references: list[str],
) -> None:
    """Update the threading fields on a conversation."""
    updates: dict = {"email_message_id": latest_message_id}

    if references:
        # Deduplicate while preserving order
        seen: set[str] = set()
        unique_refs: list[str] = []
        for ref in references:
            if ref not in seen:
                seen.add(ref)
                unique_refs.append(ref)
        # Ensure the latest message ID is included
        if latest_message_id not in seen:
            unique_refs.append(latest_message_id)
        updates["email_references"] = unique_refs

    database.child("conversations").child(conversation_id).update(updates)
