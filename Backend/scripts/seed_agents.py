from utils import build_agents_data, print_seed_summary, sanitize_user_record, seed_auth_users, write_node


def main() -> None:
    payload = build_agents_data()
    seed_auth_users(payload)
    write_node('users', {user_id: sanitize_user_record(user_data) for user_id, user_data in payload.items()})
    print_seed_summary('Agents', payload)


if __name__ == '__main__':
    main()
