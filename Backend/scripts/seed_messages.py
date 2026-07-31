from utils import (
    build_agents_data,
    build_conversations_data,
    build_customers_data,
    build_messages_data,
    print_seed_summary,
    write_node,
)


def main() -> None:
    customers = build_customers_data()
    agents = build_agents_data()
    conversations = build_conversations_data(customers, agents)
    payload = build_messages_data(conversations, customers, agents)
    write_node('messages', payload)
    print_seed_summary('Messages', payload)


if __name__ == '__main__':
    main()
