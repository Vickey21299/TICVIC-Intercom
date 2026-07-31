"""
IMAP Service for Gmail Integration.

Connects to a Gmail account via IMAP SSL, fetches unread emails,
and marks them as read after processing.

Delegates parsing to ``parser.py``.
Uses only Python standard libraries: imaplib, ssl.
"""

from __future__ import annotations

import imaplib
import logging
import os
import ssl
from typing import Optional

from app.services.email.parser import ParsedEmail, parse_raw_email

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Custom Exceptions
# ---------------------------------------------------------------------------

class IMAPError(Exception):
    """Base exception for all IMAP-related errors."""


class IMAPCredentialsError(IMAPError):
    """Raised when email credentials are missing or invalid."""


class IMAPConnectionError(IMAPError):
    """Raised when the IMAP connection cannot be established."""


class IMAPLoginError(IMAPError):
    """Raised when authentication with the mail server fails."""


class IMAPFetchError(IMAPError):
    """Raised when fetching emails from the server fails."""


class IMAPParseError(IMAPError):
    """Raised when an email message cannot be parsed."""


# ---------------------------------------------------------------------------
# IMAP Service
# ---------------------------------------------------------------------------

class IMAPService:
    """
    Production-ready IMAP client for Gmail.

    Usage::

        service = IMAPService()
        service.connect()
        emails = service.fetch_unread_emails()
        for em in emails:
            print(em)
            service.mark_as_read(em.uid)
        service.disconnect()

    Or as a context manager::

        with IMAPService() as service:
            emails = service.fetch_unread_emails()
            ...
    """

    IMAP_HOST: str = "imap.gmail.com"
    IMAP_PORT: int = 993
    TIMEOUT_SECONDS: int = 30

    def __init__(
        self,
        email_address: Optional[str] = None,
        app_password: Optional[str] = None,
    ) -> None:
        """
        Initialise the IMAP service.

        Args:
            email_address: Gmail address.  Falls back to ``EMAIL_ADDRESS`` env var.
            app_password:  Gmail App Password.  Falls back to ``EMAIL_APP_PASSWORD`` env var.

        Raises:
            IMAPCredentialsError: If credentials are not provided and not
                found in environment variables.
        """
        self._email_address: str = email_address or os.getenv("EMAIL_ADDRESS", "")
        self._app_password: str = app_password or os.getenv("EMAIL_APP_PASSWORD", "")

        if not self._email_address or not self._app_password:
            raise IMAPCredentialsError(
                "Email credentials are missing. "
                "Set EMAIL_ADDRESS and EMAIL_APP_PASSWORD environment variables "
                "or pass them directly to IMAPService()."
            )

        self._connection: Optional[imaplib.IMAP4_SSL] = None

    # -- Context manager support --------------------------------------------

    def __enter__(self) -> "IMAPService":
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:  # noqa: ANN001
        self.disconnect()

    # -- Public API ---------------------------------------------------------

    def connect(self) -> None:
        """
        Establish a secure IMAP connection and authenticate.

        Raises:
            IMAPConnectionError: On network / TLS errors.
            IMAPLoginError: On invalid credentials.
        """
        try:
            ctx = ssl.create_default_context()
            self._connection = imaplib.IMAP4_SSL(
                host=self.IMAP_HOST,
                port=self.IMAP_PORT,
                ssl_context=ctx,
                timeout=self.TIMEOUT_SECONDS,
            )
        except (OSError, imaplib.IMAP4.error, ssl.SSLError) as exc:
            raise IMAPConnectionError(
                f"Failed to connect to {self.IMAP_HOST}:{self.IMAP_PORT} -- {exc}"
            ) from exc

        try:
            self._connection.login(self._email_address, self._app_password)
        except imaplib.IMAP4.error as exc:
            # Clean up the socket on login failure
            try:
                self._connection.logout()
            except Exception:
                pass
            self._connection = None
            raise IMAPLoginError(
                f"Login failed for {self._email_address}. "
                "Verify the App Password is correct and IMAP is enabled in Gmail settings. "
                f"Server response: {exc}"
            ) from exc

        logger.info("[IMAP] Connected successfully as %s", self._email_address)

    def disconnect(self) -> None:
        """Close the mailbox and log out gracefully."""
        if self._connection is None:
            return
        try:
            self._connection.close()
        except Exception:
            pass  # mailbox may not be selected
        try:
            self._connection.logout()
        except Exception:
            pass
        self._connection = None
        logger.info("[IMAP] Disconnected.")

    def fetch_unread_emails(self, limit: int = 1) -> list[ParsedEmail]:
        """
        Fetch the latest *limit* unread emails from the Inbox.

        Args:
            limit: Maximum number of unread emails to retrieve. Defaults to 1.

        Returns:
            A list of :class:`ParsedEmail` instances (newest first).

        Raises:
            IMAPConnectionError: If not connected.
            IMAPFetchError: If selecting the inbox or searching fails.
        """
        self._ensure_connected()
        assert self._connection is not None  # for type-checker

        # Select INBOX
        try:
            resp_status, _ = self._connection.select("INBOX")
            if resp_status != "OK":
                raise IMAPFetchError("Could not select INBOX.")
        except imaplib.IMAP4.error as exc:
            raise IMAPFetchError(f"Error selecting INBOX: {exc}") from exc

        # Search for UNSEEN emails
        try:
            resp_status, data = self._connection.search(None, "UNSEEN")
            if resp_status != "OK":
                raise IMAPFetchError("IMAP SEARCH command failed.")
        except imaplib.IMAP4.error as exc:
            raise IMAPFetchError(f"Error searching emails: {exc}") from exc

        email_ids: list[bytes] = data[0].split()

        if not email_ids:
            logger.info("[IMAP] No unread emails found.")
            return []

        logger.info("[IMAP] Unread emails: %d", len(email_ids))

        # Take the *latest* N emails (highest UIDs = most recent)
        selected_ids = email_ids[-limit:][::-1]

        return self._fetch_and_parse(selected_ids)

    def fetch_all_unread(self) -> list[ParsedEmail]:
        """
        Fetch ALL unread emails from the Inbox (used by the background poller).

        Returns:
            A list of :class:`ParsedEmail` instances (newest first).
        """
        self._ensure_connected()
        assert self._connection is not None

        try:
            resp_status, _ = self._connection.select("INBOX")
            if resp_status != "OK":
                raise IMAPFetchError("Could not select INBOX.")
        except imaplib.IMAP4.error as exc:
            raise IMAPFetchError(f"Error selecting INBOX: {exc}") from exc

        try:
            resp_status, data = self._connection.search(None, "UNSEEN")
            if resp_status != "OK":
                raise IMAPFetchError("IMAP SEARCH command failed.")
        except imaplib.IMAP4.error as exc:
            raise IMAPFetchError(f"Error searching emails: {exc}") from exc

        email_ids: list[bytes] = data[0].split()

        if not email_ids:
            logger.debug("[IMAP] No unread emails found.")
            return []

        logger.info("[IMAP] Fetching all %d unread emails.", len(email_ids))

        # Newest first
        return self._fetch_and_parse(email_ids[::-1])

    def parse_email(self, raw_bytes: bytes, uid: str = "") -> ParsedEmail:
        """
        Parse raw email bytes into a :class:`ParsedEmail`.

        Delegates to ``parser.parse_raw_email``.
        """
        try:
            return parse_raw_email(raw_bytes, uid=uid)
        except ValueError as exc:
            raise IMAPParseError(str(exc)) from exc

    def mark_as_read(self, uid: str) -> None:
        """
        Mark an email as read (add the ``\\Seen`` flag).

        Args:
            uid: The IMAP sequence number / UID of the email.

        Raises:
            IMAPConnectionError: If not connected.
            IMAPFetchError: If the store command fails.
        """
        self._ensure_connected()
        assert self._connection is not None

        try:
            resp_status, _ = self._connection.store(uid.encode(), "+FLAGS", "\\Seen")
            if resp_status != "OK":
                raise IMAPFetchError(f"Failed to mark email {uid} as read.")
            logger.debug("[IMAP] Email %s marked as read.", uid)
        except imaplib.IMAP4.error as exc:
            raise IMAPFetchError(
                f"Error marking email {uid} as read: {exc}"
            ) from exc

    # -- Private helpers ----------------------------------------------------

    def _ensure_connected(self) -> None:
        """Raise if the IMAP connection is not active."""
        if self._connection is None:
            raise IMAPConnectionError(
                "Not connected. Call connect() first."
            )

    def _fetch_and_parse(self, email_ids: list[bytes]) -> list[ParsedEmail]:
        """Fetch raw email data for given IDs and parse each one."""
        assert self._connection is not None
        parsed_emails: list[ParsedEmail] = []

        for eid in email_ids:
            try:
                resp_status, msg_data = self._connection.fetch(eid, "(RFC822)")
                if resp_status != "OK" or msg_data is None:
                    logger.warning("[IMAP] Could not fetch email ID %s, skipping.", eid.decode())
                    continue

                raw_email = msg_data[0]
                if isinstance(raw_email, tuple):
                    raw_bytes: bytes = raw_email[1]
                else:
                    continue

                parsed = self.parse_email(raw_bytes, uid=eid.decode())
                parsed_emails.append(parsed)

            except IMAPParseError as exc:
                logger.warning("[IMAP] Parse error for email ID %s: %s", eid.decode(), exc)
            except Exception as exc:
                logger.warning("[IMAP] Unexpected error for email ID %s: %s", eid.decode(), exc)

        return parsed_emails
