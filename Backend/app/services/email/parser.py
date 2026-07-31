"""
Email Parser — extracts structured data from raw RFC-822 email bytes.

Handles MIME multipart, RFC-2047 encoded headers, and threading headers
(Message-ID, In-Reply-To, References) used for conversation threading.

Uses only Python standard libraries.
"""

from __future__ import annotations

import email
import email.message
import logging
import re
from dataclasses import dataclass, field
from email.header import decode_header
from email.utils import parseaddr

logger = logging.getLogger(__name__)


@dataclass
class ParsedEmail:
    """Structured representation of a parsed email message."""

    sender: str = ""
    sender_email: str = ""
    sender_name: str = ""
    to: str = ""
    subject: str = ""
    date: str = ""
    message_id: str = ""
    in_reply_to: str = ""
    references: list[str] = field(default_factory=list)
    body: str = ""
    uid: str = ""

    def __str__(self) -> str:
        separator = "-" * 40
        return (
            f"{separator}\n"
            f"From:        {self.sender}\n"
            f"To:          {self.to}\n"
            f"Subject:     {self.subject}\n"
            f"Date:        {self.date}\n"
            f"Message-ID:  {self.message_id}\n"
            f"In-Reply-To: {self.in_reply_to}\n"
            f"References:  {', '.join(self.references) if self.references else '(none)'}\n"
            f"\nBody:\n{self.body}\n"
            f"{separator}"
        )


def parse_raw_email(raw_bytes: bytes, uid: str = "") -> ParsedEmail:
    """
    Parse raw RFC-822 email bytes into a :class:`ParsedEmail`.

    Args:
        raw_bytes: The raw email content from IMAP FETCH.
        uid: The IMAP sequence number / UID string.

    Returns:
        A populated :class:`ParsedEmail` instance.

    Raises:
        ValueError: If the raw bytes cannot be parsed at all.
    """
    try:
        msg = email.message_from_bytes(raw_bytes)
    except Exception as exc:
        raise ValueError(f"Failed to parse raw email bytes: {exc}") from exc

    parsed = ParsedEmail(uid=uid)

    # -- Headers ------------------------------------------------------------
    raw_from = msg.get("From", "")
    parsed.sender = _decode_header_value(raw_from)
    parsed.sender_name = extract_sender_name(raw_from)
    parsed.sender_email = extract_sender_email(raw_from)

    parsed.to = _decode_header_value(msg.get("To", ""))
    parsed.subject = _decode_header_value(msg.get("Subject", ""))
    parsed.date = msg.get("Date", "")
    parsed.message_id = msg.get("Message-ID", "").strip()

    # Threading headers
    in_reply_to = msg.get("In-Reply-To", "").strip()
    parsed.in_reply_to = in_reply_to

    raw_references = msg.get("References", "").strip()
    if raw_references:
        # References is a whitespace-separated list of Message-IDs
        parsed.references = raw_references.split()

    # -- Body (prefer plain text) -------------------------------------------
    parsed.body = _extract_body(msg)

    return parsed


def extract_sender_email(from_header: str) -> str:
    """
    Extract the bare email address from a From header.

    Examples::

        "John Doe <john@gmail.com>"  ->  "john@gmail.com"
        "john@gmail.com"             ->  "john@gmail.com"
    """
    decoded = _decode_header_value(from_header)
    _, addr = parseaddr(decoded)
    return addr.lower().strip()


def extract_sender_name(from_header: str) -> str:
    """
    Extract the display name from a From header.

    Examples::

        "John Doe <john@gmail.com>"  ->  "John Doe"
        "john@gmail.com"             ->  "john@gmail.com"
    """
    decoded = _decode_header_value(from_header)
    name, addr = parseaddr(decoded)
    return name.strip() if name.strip() else addr.lower().strip()


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _decode_header_value(raw: str) -> str:
    """Decode an RFC-2047 encoded header into a plain string."""
    try:
        parts = decode_header(raw)
        decoded_parts: list[str] = []
        for content, charset in parts:
            if isinstance(content, bytes):
                decoded_parts.append(
                    content.decode(charset or "utf-8", errors="replace")
                )
            else:
                decoded_parts.append(content)
        return " ".join(decoded_parts)
    except Exception:
        return raw


def _extract_body(msg: email.message.Message) -> str:
    """
    Walk a MIME message and return the first ``text/plain`` part.

    Falls back to an empty string if no plain-text part is found.
    """
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))

            if content_type == "text/plain" and "attachment" not in content_disposition:
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    return payload.decode(charset, errors="replace").strip()
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            return payload.decode(charset, errors="replace").strip()

    return ""
