from __future__ import annotations

from datetime import datetime, timedelta, timezone
import copy
from pathlib import Path
import random
import re
import sys
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.firebase import database, firebase_auth

UTC = timezone.utc
WORKSPACE_ID = 'ws_demo'
ADMIN_ID = 'admin_acme'

ADMIN_PROFILE = {
    'user_id': ADMIN_ID,
    'name': 'Super Admin',
    'email': 'admin@acme.com',
    'password': 'admin123',
    'role': 'admin',
    'workspace_id': WORKSPACE_ID,
    'workspace_name': 'Acme Support',
    'avatar': 'SA',
    'online': True,
    'assigned_conversations': [],
}

AGENT_NAMES = [
    'Alice Johnson',
    'Bob Smith',
    'Charlie Brown',
    'Diana Prince',
]

CUSTOMER_NAMES = [
    'John Doe',
    'Emma Wilson',
    'Lucas Martin',
    'Sophia Lee',
    'Michael Scott',
    'Olivia Davis',
    'James Taylor',
    'Ava Thomas',
    'Noah Harris',
    'Mia Clark',
    'Ethan Walker',
    'Isabella Young',
    'Liam King',
    'Charlotte Wright',
    'Benjamin Hall',
]

STATUSES = ['Open', 'Closed', 'Pending', 'Snoozed']
CHANNELS = ['chat', 'email']
PRIORITIES = ['low', 'medium', 'high']

CUSTOMER_OPENERS = [
    'Hi, I need help with my order.',
    'My subscription is not working.',
    'I have a billing question.',
    'Can you check my refund status?',
    'I am having trouble logging in.',
    'The app keeps crashing on my device.',
    'I need to update my account details.',
    'Where can I find my invoice?',
]

AGENT_REPLIES = [
    'Thanks for reaching out. I am looking into that now.',
    'Sure, I can help with that right away.',
    'I have checked the details and here is what I found.',
    'Thanks for the update. I am reviewing the case now.',
    'I have escalated this and will keep you posted.',
    'I can confirm the next step for you.',
]

CUSTOMER_FOLLOWUPS = [
    'Thanks, that helps.',
    'Do you need anything else from me?',
    'Is there an update yet?',
    'That still looks unresolved on my end.',
    'I appreciate the quick reply.',
    'Let me know if you need a screenshot.',
]

AGENT_WRAPUPS = [
    'Everything is set from my side.',
    'You should see the change shortly.',
    'The issue is now resolved.',
    'I have shared the next steps with you.',
    'Please let us know if anything else comes up.',
    'Your request has been completed.',
]

SUMMARY_TEXTS = [
    'Customer requested refund.',
    'Issue resolved by agent.',
    'Order dispatched.',
    'Customer satisfied.',
    'Billing clarification provided.',
    'Account access restored.',
    'Subscription issue fixed.',
    'Follow-up scheduled with customer.',
]

KNOWLEDGE_ARTICLES = [
    ('Reset Password', 'Steps to reset your account password safely.'),
    ('Track Order', 'How to follow shipment progress in the portal.'),
    ('Refund Policy', 'When refunds are available and how they work.'),
    ('Subscription Plans', 'Overview of plan tiers and billing cycles.'),
    ('Shipping Times', 'Estimated delivery windows by region.'),
    ('Account Verification', 'How to verify your email and profile.'),
    ('Delete Account', 'What happens when a user removes an account.'),
    ('API Documentation', 'Reference for platform endpoints and objects.'),
    ('Contact Support', 'How customers can reach the support team.'),
    ('Billing Issues', 'Common billing problems and how to resolve them.'),
]

def slugify(value: str) -> str:
    cleaned = re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')
    return cleaned or 'item'


def initials(value: str) -> str:
    parts = [part for part in re.split(r'\s+', value.strip()) if part]
    return ''.join(part[0] for part in parts[:2]).upper()


def email_for_name(name: str, domain: str = 'acme.com') -> str:
    return f"{slugify(name).replace('-', '.')}@{domain}"


def iso_at(moment: datetime) -> str:
    return moment.astimezone(UTC).replace(microsecond=0).isoformat().replace('+00:00', 'Z')


def hours_ago(hours: int) -> str:
    return iso_at(datetime.now(UTC) - timedelta(hours=hours))


def days_ago(days: int) -> str:
    return iso_at(datetime.now(UTC) - timedelta(days=days))


def minutes_ago(minutes: int) -> str:
    return iso_at(datetime.now(UTC) - timedelta(minutes=minutes))


def build_workspace_data() -> dict[str, Any]:
    created_at = days_ago(120)
    return {
        WORKSPACE_ID: {
            'workspace_id': WORKSPACE_ID,
            'name': 'Acme Support',
            'slug': 'acme-support',
            'email': 'support@acme.com',
            'plan': 'Free',
            'status': 'Active',
            'created_by': ADMIN_PROFILE['name'],
            'created_by_id': ADMIN_ID,
            'created_at': created_at,
            'updated_at': created_at,
        }
    }


def build_admin_data() -> dict[str, Any]:
    return {ADMIN_ID: ADMIN_PROFILE}


def build_agents_data() -> dict[str, Any]:
    agents: dict[str, Any] = {}
    for index, name in enumerate(AGENT_NAMES, start=1):
        user_id = f"agent_{index:02d}"
        agents[user_id] = {
            'user_id': user_id,
            'name': name,
            'email': email_for_name(name),
            'password': 'agent123',
            'role': 'agent',
            'workspace_id': WORKSPACE_ID,
            'online': True,
            'avatar': initials(name),
            'assigned_conversations': [],
            'created_at': days_ago(90 - index * 5),
        }
    return agents


def build_customers_data() -> dict[str, Any]:
    customers: dict[str, Any] = {}
    for index, name in enumerate(CUSTOMER_NAMES, start=1):
        customer_id = f"customer_{index:02d}"
        customers[customer_id] = {
            'customer_id': customer_id,
            'name': name,
            'email': email_for_name(name),
            'avatar': initials(name),
            'created_at': days_ago(70 - index * 2),
        }
    return customers


def _conversation_message_count(index: int) -> int:
    return 10 + (index % 16)


def build_conversations_data(
    customers: dict[str, Any],
    agents: dict[str, Any],
) -> dict[str, Any]:
    agent_ids = list(agents.keys())
    customer_ids = list(customers.keys())
    conversations: dict[str, Any] = {}

    base_time = datetime.now(UTC) - timedelta(days=21)

    for index in range(25):
        conversation_id = f"conv_{index + 1:03d}"
        message_count = _conversation_message_count(index)
        first_message_at = base_time + timedelta(days=index, hours=index % 6)
        last_message_at = first_message_at + timedelta(minutes=message_count * 7)
        assigned_agent = agent_ids[index % len(agent_ids)]
        customer_id = customer_ids[index % len(customer_ids)]
        status = STATUSES[index % len(STATUSES)]
        channel = CHANNELS[index % len(CHANNELS)]
        priority = PRIORITIES[index % len(PRIORITIES)]

        conversations[conversation_id] = {
            'conversation_id': conversation_id,
            'workspace_id': WORKSPACE_ID,
            'customer_id': customer_id,
            'assigned_agent': assigned_agent,
            'status': status,
            'channel': channel,
            'priority': priority,
            'created_at': iso_at(first_message_at),
            'last_message_at': iso_at(last_message_at),
            'summary': SUMMARY_TEXTS[index % len(SUMMARY_TEXTS)],
            'subject': f'{customers[customer_id]["name"]} conversation',
            'message_count': message_count,
            'message_ids': [f"msg_{conversation_id}_{message_index:02d}" for message_index in range(1, message_count + 1)],
        }

    return conversations


def build_messages_data(
    conversations: dict[str, Any],
    customers: dict[str, Any],
    agents: dict[str, Any],
) -> dict[str, Any]:
    messages: dict[str, Any] = {}
    agent_ids = list(agents.keys())
    agent_names = {agent_id: agent_data['name'] for agent_id, agent_data in agents.items()}
    customer_names = {customer_id: customer_data['name'] for customer_id, customer_data in customers.items()}
    rng = random.Random(42)

    for conversation_index, (conversation_id, conversation) in enumerate(conversations.items()):
        customer_id = conversation['customer_id']
        agent_id = conversation['assigned_agent']
        customer_name = customer_names[customer_id]
        agent_name = agent_names[agent_id]
        count = conversation['message_count']
        start_time = datetime.fromisoformat(conversation['created_at'].replace('Z', '+00:00'))

        for message_index in range(count):
            sender_type = 'customer' if message_index % 2 == 0 else 'agent'
            sender_id = customer_id if sender_type == 'customer' else agent_id
            sender_name = customer_name if sender_type == 'customer' else agent_name
            content_pool = CUSTOMER_OPENERS if message_index == 0 else (
                CUSTOMER_FOLLOWUPS if sender_type == 'customer' else AGENT_REPLIES + AGENT_WRAPUPS
            )
            content = content_pool[(conversation_index + message_index) % len(content_pool)]
            message_id = f"msg_{conversation_id}_{message_index + 1:02d}"
            created_at = start_time + timedelta(minutes=(message_index * 7) + rng.randint(0, 2))

            messages[message_id] = {
                'message_id': message_id,
                'conversation_id': conversation_id,
                'workspace_id': WORKSPACE_ID,
                'sender_type': sender_type,
                'sender_id': sender_id,
                'sender_name': sender_name,
                'content': content,
                'created_at': iso_at(created_at),
            }

    return messages


def build_knowledge_base_data() -> dict[str, Any]:
    articles: dict[str, Any] = {}
    base_time = datetime.now(UTC) - timedelta(days=45)

    for index, (title, excerpt) in enumerate(KNOWLEDGE_ARTICLES, start=1):
        article_id = f"article_{index:02d}"
        created_at = base_time + timedelta(days=index)
        articles[article_id] = {
            'article_id': article_id,
            'title': title,
            'slug': slugify(title),
            'excerpt': excerpt,
            'body': (
                f"{title} helps customers and agents handle common support tasks. "
                f"{excerpt} This placeholder article is ready to be replaced by editorial content later."
            ),
            'category': 'Support',
            'status': 'Published',
            'created_at': iso_at(created_at),
            'updated_at': iso_at(created_at + timedelta(days=1)),
        }

    return articles


def build_seed_payload() -> dict[str, Any]:
    workspace = build_workspace_data()
    admin = build_admin_data()
    agents = build_agents_data()
    customers = build_customers_data()
    conversations = build_conversations_data(customers, agents)
    messages = build_messages_data(conversations, customers, agents)
    knowledge_base = build_knowledge_base_data()

    agent_conversation_map: dict[str, list[str]] = {agent_id: [] for agent_id in agents}
    for conversation_id, conversation in conversations.items():
        agent_conversation_map[conversation['assigned_agent']].append(conversation_id)

    for agent_id, assigned_conversations in agent_conversation_map.items():
        agents[agent_id]['assigned_conversations'] = assigned_conversations

    return {
        'workspaces': workspace,
        'admins': admin,
        'agents': agents,
        'users': {
            **admin,
            **agents,
        },
        'customers': customers,
        'conversations': conversations,
        'messages': messages,
        'knowledge_base': knowledge_base,
    }


def build_auth_seed_users() -> dict[str, Any]:
    auth_users: dict[str, Any] = {}

    for user_id, user_data in build_admin_data().items():
        auth_users[user_id] = user_data

    for user_id, user_data in build_agents_data().items():
        auth_users[user_id] = user_data

    return auth_users


def write_node(node_name: str, payload: dict[str, Any]) -> None:
    database.child(node_name).set(payload)


def write_root(payload: dict[str, Any]) -> None:
    database.set(payload)


def _ensure_auth_user(user_id: str, payload: dict[str, Any]) -> None:
    password = payload.get('password')
    if not password:
        return

    try:
        firebase_auth.get_user(user_id)
        firebase_auth.update_user(
            user_id,
            email=payload['email'].lower(),
            display_name=payload['name'],
            password=password,
            disabled=False,
        )
    except firebase_auth.UserNotFoundError:
        firebase_auth.create_user(
            uid=user_id,
            email=payload['email'].lower(),
            display_name=payload['name'],
            password=password,
            disabled=False,
        )

    firebase_auth.set_custom_user_claims(
        user_id,
        {
            'role': payload['role'],
            'workspace_id': payload['workspace_id'],
        },
    )


def seed_auth_users(users: dict[str, Any]) -> None:
    for user_id, user_data in users.items():
        _ensure_auth_user(user_id, user_data)


def sanitize_user_record(user_data: dict[str, Any]) -> dict[str, Any]:
    sanitized_data = copy.deepcopy(user_data)
    sanitized_data.pop('password', None)
    return sanitized_data


def print_seed_summary(title: str, payload: dict[str, Any]) -> None:
    print(f"{title}: {len(payload)} records seeded")
