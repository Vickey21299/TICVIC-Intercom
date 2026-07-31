"""
Test script for the full email pipeline.

Usage:
    1. Ensure EMAIL_ADDRESS and EMAIL_APP_PASSWORD are set in Backend/.env
    2. Run:  python scripts/test_imap.py

Tests:
    - IMAP connection + fetch unread
    - Email parsing (with threading headers)
    - Firebase inbound processing
    - SMTP reply sending
"""

import sys
import os

# ---------------------------------------------------------------------------
# Ensure the project root is on sys.path so we can import app.*
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)  # Backend/
sys.path.insert(0, PROJECT_ROOT)

# ---------------------------------------------------------------------------
# Load .env manually (no third-party dependency needed)
# ---------------------------------------------------------------------------
def load_dotenv(path: str) -> None:
    """Minimal .env loader -- handles KEY=VALUE and KEY=\"VALUE\" lines."""
    if not os.path.isfile(path):
        return
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


env_path = os.path.join(PROJECT_ROOT, ".env")
load_dotenv(env_path)

# ---------------------------------------------------------------------------
# Imports (after env is loaded)
# ---------------------------------------------------------------------------
from app.services.email.imap_service import (
    IMAPService,
    IMAPCredentialsError,
    IMAPConnectionError,
    IMAPLoginError,
    IMAPFetchError,
    IMAPParseError,
)
from app.services.email.email_firebase_service import process_inbound_email


def main() -> None:
    """Connect to Gmail via IMAP, fetch unread emails, and process them."""
    print("=" * 50)
    print("  Email Pipeline Test - Gmail -> Firebase")
    print("=" * 50)
    print()

    try:
        service = IMAPService()
    except IMAPCredentialsError as exc:
        print(f"[ERROR] Credentials error: {exc}")
        sys.exit(1)

    try:
        # 1. Connect
        service.connect()
        print("[OK] Connected successfully.")
        print()

        # 2. Fetch latest unread emails
        emails = service.fetch_unread_emails(limit=5)
        print()

        if not emails:
            print("No unread emails to display.")
        else:
            print(f"Processing {len(emails)} email(s)...")
            print()

            subject_tag = os.environ.get("EMAIL_SUBJECT_TAG", "").strip().lower()

            for em in emails:
                print(em)

                if subject_tag and subject_tag not in (em.subject or "").lower():
                    print(f"[SKIP] Email subject does not contain '{subject_tag}'. Skipping storage.")
                    service.mark_as_read(em.uid)
                    print(f"[OK] Email {em.uid} marked as read.")
                    print()
                    continue

                # 3. Process into Firebase
                try:
                    result = process_inbound_email(em)
                    print(f"[OK] Saved to Firebase:")
                    print(f"     Conversation: {result['conversation_id']}")
                    print(f"     Message:      {result['message_id']}")
                except Exception as exc:
                    print(f"[ERROR] Firebase processing failed: {exc}")

                # 4. Mark as read
                service.mark_as_read(em.uid)
                print(f"[OK] Email {em.uid} marked as read.")
                print()

    except IMAPConnectionError as exc:
        print(f"[ERROR] Connection error: {exc}")
        sys.exit(1)
    except IMAPLoginError as exc:
        print(f"[ERROR] Login error: {exc}")
        sys.exit(1)
    except IMAPFetchError as exc:
        print(f"[ERROR] Fetch error: {exc}")
        sys.exit(1)
    except IMAPParseError as exc:
        print(f"[ERROR] Parse error: {exc}")
        sys.exit(1)
    except Exception as exc:
        print(f"[ERROR] Unexpected error: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        # 5. Always disconnect
        service.disconnect()
        print("[OK] Disconnected.")


if __name__ == "__main__":
    main()
