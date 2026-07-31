from dotenv import load_dotenv
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / '.env')

APP_NAME = os.getenv("APP_NAME")
DEBUG = os.getenv("DEBUG")
FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY") or os.getenv("FIREBASE_API_KEY")

def _resolve_firebase_credential() -> str:
    configured_value = os.getenv('FIREBASE_CREDENTIAL')
    candidate_names = [
        configured_value,
        'serviceAccount.json',
        'serviceAccountKey.json',
        'serviceAccountkey.json',
    ]

    seen: set[str] = set()
    for candidate_name in candidate_names:
        if not candidate_name or candidate_name in seen:
            continue

        seen.add(candidate_name)
        candidate_path = Path(candidate_name)
        if not candidate_path.is_absolute():
            candidate_path = BASE_DIR / candidate_path

        if candidate_path.exists():
            return str(candidate_path)

    raise FileNotFoundError(
        'Firebase credential file not found. Set FIREBASE_CREDENTIAL or place a service account JSON in the backend root.'
    )


FIREBASE_CREDENTIAL = _resolve_firebase_credential()
FIREBASE_DATABASE_URL = os.getenv('FIREBASE_DATABASE_URL')

# Email / IMAP / SMTP
EMAIL_ADDRESS = os.getenv('EMAIL_ADDRESS', '')
EMAIL_APP_PASSWORD = os.getenv('EMAIL_APP_PASSWORD', '')
EMAIL_POLL_INTERVAL_SECONDS = int(os.getenv('EMAIL_POLL_INTERVAL_SECONDS', '60'))
EMAIL_SUBJECT_TAG = os.getenv('EMAIL_SUBJECT_TAG', '').strip().lower()
