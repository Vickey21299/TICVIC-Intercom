"""Check only email conversations created from real Gmail (have email_message_id)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / '.env')

from app.firebase import database

convs = database.child('conversations').get()
if not isinstance(convs, dict):
    print("No conversations.")
    sys.exit(0)

real_email = {
    k: v for k, v in convs.items()
    if isinstance(v, dict) and v.get('channel') == 'email' and v.get('email_message_id')
}

print(f"Real email conversations (from Gmail): {len(real_email)}")
for k, v in list(real_email.items()):
    print(f"  {k}:")
    print(f"    subject:     {v.get('subject')}")
    print(f"    customer:    {v.get('customer_id')}")
    print(f"    messages:    {v.get('message_count')}")
    print(f"    email_msgid: {v.get('email_message_id', '')[:70]}")
    print(f"    refs:        {len(v.get('email_references', []))} refs")
    print()
