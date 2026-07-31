import type { Customer } from '../../types';
import './CustomerSelector.css';

/**
 * 5 test customers matching the backend seed data (customer_01 to customer_05).
 */
const TEST_CUSTOMERS: Customer[] = [
  { customer_id: 'customer_01', name: 'John Doe', email: 'john.doe@acme.com', avatar: 'JD' },
  { customer_id: 'customer_02', name: 'Emma Wilson', email: 'emma.wilson@acme.com', avatar: 'EW' },
  { customer_id: 'customer_03', name: 'Lucas Martin', email: 'lucas.martin@acme.com', avatar: 'LM' },
  { customer_id: 'customer_04', name: 'Sophia Lee', email: 'sophia.lee@acme.com', avatar: 'SL' },
  { customer_id: 'customer_05', name: 'Michael Scott', email: 'michael.scott@acme.com', avatar: 'MS' },
];

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
}

export default function CustomerSelector({ selectedCustomer, onSelect }: CustomerSelectorProps) {
  return (
    <div className="customer-selector">
      <span className="customer-selector-label">Test as:</span>
      {TEST_CUSTOMERS.map((customer) => (
        <button
          key={customer.customer_id}
          className={`customer-btn${selectedCustomer?.customer_id === customer.customer_id ? ' active' : ''}`}
          onClick={() => onSelect(customer)}
        >
          <span className="customer-btn-avatar">{customer.avatar}</span>
          {customer.name}
        </button>
      ))}
    </div>
  );
}
