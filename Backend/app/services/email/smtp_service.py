"""
SMTP Service for sending email replies via Gmail.

Uses Python standard libraries: smtplib, email.mime.
Constructs properly threaded replies using In-Reply-To and References headers.
"""

from __future__ import annotations

import logging
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.utils import formataddr, make_msgid
from typing import Optional

logger = logging.getLogger(__name__)


class SMTPError(Exception):
    """Base exception for SMTP-related errors."""


class SMTPCredentialsError(SMTPError):
    """Raised when SMTP credentials are missing."""


class SMTPConnectionError(SMTPError):
    """Raised when the SMTP connection fails."""


class SMTPSendError(SMTPError):
    """Raised when sending an email fails."""


class SMTPService:
    """
    Production-ready SMTP client for Gmail.

    Sends plain-text email replies with proper threading headers
    (In-Reply-To, References) so replies appear in the same thread
    in the customer's email client.

    Usage::

        smtp = SMTPService()
        message_id = smtp.send_reply(
            to="customer@example.com",
            subject="Re: Refund Request",
            body="Hello, we've processed your refund.",
            in_reply_to="<original-msg-id@gmail.com>",
            references=["<original-msg-id@gmail.com>"],
        )
    """

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    TIMEOUT_SECONDS: int = 30

    def __init__(
        self,
        email_address: Optional[str] = None,
        app_password: Optional[str] = None,
        sender_name: str = "Acme Support",
    ) -> None:
        """
        Initialise the SMTP service.

        Args:
            email_address: Gmail address. Falls back to ``EMAIL_ADDRESS`` env var.
            app_password: Gmail App Password. Falls back to ``EMAIL_APP_PASSWORD`` env var.
            sender_name: Display name shown in the From header.

        Raises:
            SMTPCredentialsError: If credentials are missing.
        """
        self._email_address: str = email_address or os.getenv("EMAIL_ADDRESS", "")
        self._app_password: str = app_password or os.getenv("EMAIL_APP_PASSWORD", "")
        self._sender_name: str = sender_name

        if not self._email_address or not self._app_password:
            raise SMTPCredentialsError(
                "SMTP credentials are missing. "
                "Set EMAIL_ADDRESS and EMAIL_APP_PASSWORD environment variables."
            )

    def send_reply(
        self,
        to: str,
        subject: str,
        body: str,
        in_reply_to: str = "",
        references: Optional[list[str]] = None,
    ) -> str:
        """
        Send an email reply with proper threading headers.

        Args:
            to: Recipient email address.
            subject: Email subject. ``Re:`` is prepended if not present.
            body: Plain-text body content.
            in_reply_to: The Message-ID of the email being replied to.
            references: List of Message-IDs in the thread chain.

        Returns:
            The Message-ID of the sent email (for storage / future threading).

        Raises:
            SMTPConnectionError: If connection to Gmail SMTP fails.
            SMTPSendError: If the email cannot be sent.
        """
        # Ensure subject has Re: prefix
        if subject and not subject.lower().startswith("re:"):
            subject = f"Re: {subject}"

        # Build the MIME message
        msg = MIMEText(body, "plain", "utf-8")
        msg["From"] = formataddr((self._sender_name, self._email_address))
        msg["To"] = to
        msg["Subject"] = subject

        # Generate a unique Message-ID for this reply
        new_message_id = make_msgid(domain=self._email_address.split("@")[-1])
        msg["Message-ID"] = new_message_id

        # Threading headers
        if in_reply_to:
            msg["In-Reply-To"] = in_reply_to

        if references:
            msg["References"] = " ".join(references)
        elif in_reply_to:
            # If no references chain provided, at least reference the original
            msg["References"] = in_reply_to

        # Send via SMTP
        try:
            ctx = ssl.create_default_context()
            with smtplib.SMTP(
                self.SMTP_HOST, self.SMTP_PORT, timeout=self.TIMEOUT_SECONDS
            ) as server:
                server.starttls(context=ctx)
                server.login(self._email_address, self._app_password)
                server.send_message(msg)
        except smtplib.SMTPAuthenticationError as exc:
            raise SMTPConnectionError(
                f"SMTP authentication failed for {self._email_address}: {exc}"
            ) from exc
        except (OSError, smtplib.SMTPException) as exc:
            raise SMTPSendError(
                f"Failed to send email to {to}: {exc}"
            ) from exc

        logger.info("[SMTP] Reply sent to %s | Message-ID: %s", to, new_message_id)
        return new_message_id
