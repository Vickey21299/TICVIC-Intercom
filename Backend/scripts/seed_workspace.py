from utils import build_workspace_data, print_seed_summary, write_node


def main() -> None:
    payload = build_workspace_data()
    write_node('workspaces', payload)
    print_seed_summary('Workspace', payload)


if __name__ == '__main__':
    main()
