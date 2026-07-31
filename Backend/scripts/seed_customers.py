from utils import build_customers_data, print_seed_summary, write_node


def main() -> None:
    payload = build_customers_data()
    write_node('customers', payload)
    print_seed_summary('Customers', payload)


if __name__ == '__main__':
    main()
