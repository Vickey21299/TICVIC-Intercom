from utils import ADMIN_PROFILE, print_seed_summary, sanitize_user_record, seed_auth_users, write_node


def main() -> None:
    seed_auth_users({ADMIN_PROFILE['user_id']: ADMIN_PROFILE})
    write_node('users', {ADMIN_PROFILE['user_id']: sanitize_user_record(ADMIN_PROFILE)})
    print_seed_summary('Admin', {ADMIN_PROFILE['user_id']: ADMIN_PROFILE})


if __name__ == '__main__':
    main()
