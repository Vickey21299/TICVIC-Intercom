"""
Background Email Poller Scheduler.

Uses ``threading.Timer`` (no third-party deps) to periodically poll
Gmail via IMAP, process inbound emails, and persist them to Firebase.
"""

from __future__ import annotations

import logging
import os
import threading
from typing import Optional

from app.services.email.imap_service import IMAPService, IMAPError
from app.services.email.email_firebase_service import process_inbound_email

logger = logging.getLogger(__name__)

DEFAULT_POLL_INTERVAL = 60  # seconds


class EmailPollerScheduler:
    """
    Recurring background poller that fetches unread Gmail messages
    and feeds them into the Firebase conversation pipeline.

    Usage::

        poller = EmailPollerScheduler(interval_seconds=60)
        poller.start()   # non-blocking
        ...
        poller.stop()    # graceful shutdown
    """

    def __init__(self, interval_seconds: Optional[int] = None) -> None:
        raw = os.getenv("EMAIL_POLL_INTERVAL_SECONDS", "")
        self._interval: int = interval_seconds or (
            int(raw) if raw.isdigit() else DEFAULT_POLL_INTERVAL
        )
        self._timer: Optional[threading.Timer] = None
        self._running: bool = False
        self._lock = threading.Lock()

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def interval(self) -> int:
        return self._interval

    def start(self) -> None:
        """Start the recurring poll loop (non-blocking)."""
        with self._lock:
            if self._running:
                logger.warning("[POLLER] Already running.")
                return
            self._running = True

        logger.info(
            "[POLLER] Started. Polling every %d seconds.", self._interval
        )
        self._schedule_next()

    def stop(self) -> None:
        """Stop the poller gracefully."""
        with self._lock:
            self._running = False
            if self._timer is not None:
                self._timer.cancel()
                self._timer = None

        logger.info("[POLLER] Stopped.")

    def poll_once(self) -> int:
        """
        Run a single poll cycle synchronously.

        Returns:
            The number of emails processed.
        """
        processed = 0
        try:
            imap = IMAPService()
            imap.connect()

            emails = imap.fetch_all_unread()
            if not emails:
                logger.debug("[POLLER] No new emails.")
                imap.disconnect()
                return 0

            subject_tag = os.getenv("EMAIL_SUBJECT_TAG", "").strip().lower()

            for parsed in emails:
                if subject_tag and subject_tag not in (parsed.subject or "").lower():
                    logger.info(
                        "[POLLER] Skipping email UID %s: subject does not contain '%s'",
                        parsed.uid,
                        subject_tag,
                    )
                    imap.mark_as_read(parsed.uid)
                    continue

                try:
                    result = process_inbound_email(parsed)
                    imap.mark_as_read(parsed.uid)
                    processed += 1
                    logger.info(
                        "[POLLER] Processed email -> conv=%s, msg=%s",
                        result["conversation_id"],
                        result["message_id"],
                    )
                except Exception as exc:
                    logger.exception(
                        "[POLLER] Error processing email UID %s: %s",
                        parsed.uid,
                        exc,
                    )

            imap.disconnect()

        except IMAPError as exc:
            logger.error("[POLLER] IMAP error during poll: %s", exc)
        except Exception as exc:
            logger.exception("[POLLER] Unexpected error during poll: %s", exc)

        return processed

    # -- Private ------------------------------------------------------------

    def _schedule_next(self) -> None:
        """Schedule the next poll tick."""
        with self._lock:
            if not self._running:
                return
            self._timer = threading.Timer(self._interval, self._tick)
            self._timer.daemon = True
            self._timer.start()

    def _tick(self) -> None:
        """Execute one poll cycle and schedule the next."""
        try:
            self.poll_once()
        except Exception as exc:
            logger.exception("[POLLER] Tick failed: %s", exc)
        finally:
            self._schedule_next()
