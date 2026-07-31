from utils import build_knowledge_base_data, print_seed_summary, write_node


def main() -> None:
    payload = build_knowledge_base_data()
    write_node('knowledge_base', payload)
    print_seed_summary('Knowledge base', payload)


if __name__ == '__main__':
    main()
