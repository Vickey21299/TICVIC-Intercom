import { useEffect, useState } from 'react';
import { Avatar } from '../../../components/Avatar/Avatar';
import { LoadingSpinner } from '../../../components/LoadingSpinner/LoadingSpinner';
import { api } from '../../../services/api';
import type { Conversation, Customer } from '../../../types/api';
import { authSession } from '../../../utils/authSession';
import styles from './Customers.module.css';

export function AgentCustomersPage() {
  const user = authSession.getUser();
  const agentId = user?.id || 'agent_01';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [convLoading, setConvLoading] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await api.getCustomers(agentId);
        const list = res.customers || [];
        setCustomers(list);
        if (list.length > 0) {
          setSelectedCustomer(list[0]);
        }
      } catch (err) {
        console.error('Failed to fetch customers', err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, [agentId]);

  useEffect(() => {
    if (!selectedCustomer) {
      setConversations([]);
      return;
    }
    async function loadConversations() {
      setConvLoading(true);
      try {
        const res = await api.getCustomerConversations(selectedCustomer!.customer_id, agentId);
        setConversations(res.conversations || []);
      } catch (err) {
        console.error('Failed to load customer conversations', err);
      } finally {
        setConvLoading(false);
      }
    }
    loadConversations();
  }, [selectedCustomer, agentId]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>My Customers</h1>
          <p>View customer profiles and their conversation history with you.</p>
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchBox}
        />
      </div>

      <div className={styles.layout}>
        {/* Customer Directory */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span>Directory ({filteredCustomers.length})</span>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading directory..." padding="2rem 1rem" />
          ) : filteredCustomers.length === 0 ? (
            <div className={styles.emptyState}>No customers found matching search.</div>
          ) : (
            <div className={styles.customerList}>
              {filteredCustomers.map((cust) => {
                const isActive = selectedCustomer?.customer_id === cust.customer_id;
                return (
                  <div
                    key={cust.customer_id}
                    className={`${styles.customerItem} ${isActive ? styles.activeCustomer : ''}`}
                    onClick={() => setSelectedCustomer(cust)}
                  >
                    <Avatar name={cust.name} avatar={cust.avatar} size="md" />
                    <div className={styles.custInfo}>
                      <span className={styles.custName}>{cust.name}</span>
                      <span className={styles.custEmail}>{cust.email}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Customer Details & History */}
        <div className={styles.card}>
          {selectedCustomer ? (
            <div className={styles.detailCard}>
              <div className={styles.profileHeader}>
                <Avatar name={selectedCustomer.name} avatar={selectedCustomer.avatar} size="xl" />
                <div className={styles.profileMeta}>
                  <h2>{selectedCustomer.name}</h2>
                  <p>{selectedCustomer.email}</p>
                  <p style={{ marginTop: '0.2rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                    Customer ID: {selectedCustomer.customer_id}
                  </p>
                </div>
              </div>

              <div>
                <h3 className={styles.historyTitle}>
                  Support History ({conversations.length} Threads)
                </h3>

                {convLoading ? (
                  <LoadingSpinner label="Loading history..." padding="2rem 1rem" />
                ) : conversations.length === 0 ? (
                  <div className={styles.emptyState}>
                    No past conversations recorded with this customer.
                  </div>
                ) : (
                  <div className={styles.historyList}>
                    {conversations.map((conv) => (
                      <div key={conv.conversation_id} className={styles.historyCard}>
                        <div>
                          <div className={styles.historySubject}>
                            {conv.subject || conv.summary || 'Support Ticket'}
                          </div>
                          <div className={styles.historySummary}>
                            {conv.summary ? `Summary: ${conv.summary}` : `Channel: ${conv.channel}`}
                          </div>
                        </div>
                        <span
                          className={`${styles.tag} ${
                            conv.status === 'open' ? styles.tagOpen : styles.tagClosed
                          }`}
                        >
                          {conv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>Select a customer to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}
