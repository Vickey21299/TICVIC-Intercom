from utils import (
    build_agents_data,
    build_conversations_data,
    build_customers_data,
    print_seed_summary,
    write_node,
)


def main() -> None:
    customers = build_customers_data()
    agents = build_agents_data()
    payload = build_conversations_data(customers, agents)
    write_node('conversations', payload)
    print_seed_summary('Conversations', payload)


if __name__ == '__main__':
    main()
