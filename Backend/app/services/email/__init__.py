"""Email services package for IMAP, SMTP, Firebase bridge, and scheduling."""

from app.services.email.imap_service import IMAPService
from app.services.email.smtp_service import SMTPService
from app.services.email.email_firebase_service import (
    process_inbound_email,
    process_outbound_reply,
)
from app.services.email.scheduler import EmailPollerScheduler
from app.services.email.parser import ParsedEmail, parse_raw_email

__all__ = [
    "IMAPService",
    "SMTPService",
    "EmailPollerScheduler",
    "ParsedEmail",
    "parse_raw_email",
    "process_inbound_email",
    "process_outbound_reply",
]
