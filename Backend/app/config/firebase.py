import firebase_admin

from firebase_admin import credentials
from firebase_admin import db
from firebase_admin import auth

from app.config.settings import (
    FIREBASE_CREDENTIAL,
    FIREBASE_DATABASE_URL,
)

if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CREDENTIAL)

    firebase_admin.initialize_app(
        cred,
        {
            "databaseURL": FIREBASE_DATABASE_URL
        }
    )

database = db.reference("/")
firebase_auth = auth
