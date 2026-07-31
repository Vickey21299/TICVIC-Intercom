from utils import (
    build_auth_seed_users,
    build_seed_payload,
    print_seed_summary,
    sanitize_user_record,
    seed_auth_users,
    write_node,
    write_root,
)


def main() -> None:
    payload = build_seed_payload()
    seed_auth_users(build_auth_seed_users())
    sanitized_root_payload = {
        **payload,
        'admins': {user_id: sanitize_user_record(user_data) for user_id, user_data in payload['admins'].items()},
        'agents': {user_id: sanitize_user_record(user_data) for user_id, user_data in payload['agents'].items()},
        'users': {user_id: sanitize_user_record(user_data) for user_id, user_data in payload['users'].items()},
    }
    write_root(sanitized_root_payload)
    write_node('workspaces', payload['workspaces'])
    write_node('users', {user_id: sanitize_user_record(user_data) for user_id, user_data in payload['users'].items()})
    for section_name in (
        'workspaces',
        'admins',
        'agents',
        'users',
        'customers',
        'conversations',
        'messages',
        'knowledge_base',
    ):
        section = payload[section_name]
        print_seed_summary(section_name.title().replace('_', ' '), section)


if __name__ == '__main__':
    main()
