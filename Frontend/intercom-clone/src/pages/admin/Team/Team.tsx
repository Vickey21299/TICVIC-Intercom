import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import type { Agent } from '../../../types/api';
import styles from './Team.module.css';

/* ── Gradient sets per agent index for visual variety ──────────────── */
const AGENT_GRADIENTS = [
  'linear-gradient(135deg, #0ea5e9, #2563eb)',
  'linear-gradient(135deg, #10b981, #0284c7)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #8b5cf6, #3b82f6)',
  'linear-gradient(135deg, #06b6d4, #6366f1)',
];

const ADMIN_GRADIENT = 'linear-gradient(135deg, #7c3aed, #db2777)';

/* ── Agent Card ──────────────────────────────────────────────────────── */
interface CardProps {
  member: Agent;
  gradientIndex: number;
  onToggleStatus: (id: string, current: boolean) => void;
}

function MemberCard({ member, gradientIndex, onToggleStatus }: CardProps) {
  const isAdmin = member.role === 'admin';
  const gradient = isAdmin ? ADMIN_GRADIENT : AGENT_GRADIENTS[gradientIndex % AGENT_GRADIENTS.length];
  const convCount = member.assigned_conversations?.length ?? 0;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar} style={{ background: gradient }}>
            {member.avatar || member.name.slice(0, 2).toUpperCase()}
          </div>
          <span
            className={`${styles.onlineDot} ${member.online ? styles.dotOnline : styles.dotOffline}`}
            title={member.online ? 'Online' : 'Offline'}
          />
        </div>

        <div className={styles.cardInfo}>
          <div className={styles.cardName}>{member.name}</div>
          <div className={styles.cardEmail}>{member.email}</div>
        </div>

        <span className={`${styles.roleBadge} ${isAdmin ? styles.roleAdmin : styles.roleAgent}`}>
          {member.role}
        </span>
      </div>

      {/* Stats */}
      <div className={styles.cardStats}>
        <div className={styles.cardStat}>
          <span className={styles.cardStatNum}>{convCount}</span>
          <span className={styles.cardStatLabel}>Assigned Convs</span>
        </div>
        <div className={styles.cardStat}>
          <span className={styles.cardStatNum} style={{ color: member.online ? '#16a34a' : '#94a3b8' }}>
            {member.online ? '●' : '○'}
          </span>
          <span className={styles.cardStatLabel}>Status</span>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        <div className={styles.onlineStatus}>
          <span className={`${styles.onlineDot} ${member.online ? styles.dotOnline : styles.dotOffline}`} />
          <span className={member.online ? styles.onlineText : styles.offlineText}>
            {member.online ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Admins don't need a status toggle */}
        {!isAdmin && (
          <button
            className={`${styles.toggleBtn} ${member.online ? styles.toggleOnline : styles.toggleOffline}`}
            onClick={() => onToggleStatus(member.user_id, member.online)}
          >
            {member.online ? 'Set Offline' : 'Set Online'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Team Page ──────────────────────────────────────────────────── */
export function TeamPage() {
  const [members,  setMembers]  = useState<Agent[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  /* Fetch agents (agents endpoint) + admin separately */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Agents
        const agentsRes = await api.getAgents();
        const agents = agentsRes.agents;

        // Admin — fetch from users node via /api/auth/me
        const adminRes = await fetch('http://localhost:8000/api/auth/me?user_id=admin_acme');
        const adminData = await adminRes.json();

        // Build admin-shaped member from auth response
        const admin: Agent = {
          user_id:                 adminData.user?.id      ?? 'admin_acme',
          name:                    adminData.user?.name    ?? 'Super Admin',
          email:                   adminData.user?.email   ?? 'admin@acme.com',
          role:                    'admin',
          workspace_id:            adminData.user?.workspace_id ?? 'ws_demo',
          online:                  true,
          avatar:                  'SA',
          assigned_conversations:  [],
        };

        setMembers([admin, ...agents]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* Toggle online status optimistically */
  const handleToggleStatus = async (agentId: string, currentOnline: boolean) => {
    setMembers(prev =>
      prev.map(m => m.user_id === agentId ? { ...m, online: !currentOnline } : m)
    );
    try {
      await api.updateAgentStatus(agentId, !currentOnline);
    } catch (err) {
      console.error(err);
      // Roll back on failure
      setMembers(prev =>
        prev.map(m => m.user_id === agentId ? { ...m, online: currentOnline } : m)
      );
    }
  };

  /* Derived */
  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    const matchRole   = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const onlineCount = members.filter(m => m.online).length;
  const agentCount  = members.filter(m => m.role === 'agent').length;
  const adminCount  = members.filter(m => m.role === 'admin').length;

  let agentIndex = 0;

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h1>Team</h1>
          <p>Manage agents, admins, and their online status</p>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className={styles.roleFilter}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="agent">Agents</option>
          </select>
        </div>

        <span className={styles.countBadge}>
          {filtered.length} member{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            { icon: '👥', label: 'Total Members',  value: members.length,  bg: '#eff6ff', iconBg: '#dbeafe' },
            { icon: '🟢', label: 'Online Now',      value: onlineCount,     bg: '#f0fdf4', iconBg: '#bbf7d0' },
            { icon: '🛡️', label: 'Admins',          value: adminCount,      bg: '#f5f3ff', iconBg: '#ede9fe' },
            { icon: '🎧', label: 'Support Agents',  value: agentCount,      bg: '#fefce8', iconBg: '#fef08a' },
          ].map(s => (
            <div key={s.label} className={styles.stat} style={{ background: s.bg }}>
              <div className={styles.statIcon} style={{ background: s.iconBg }}>{s.icon}</div>
              <div>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={styles.statValue}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className={styles.loader}>
            <div className={styles.spinner} />
            <span>Loading team…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👤</div>
            <h3>No team members found</h3>
            <p>Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(member => {
              const idx = member.role === 'agent' ? agentIndex++ : 0;
              return (
                <MemberCard
                  key={member.user_id}
                  member={member}
                  gradientIndex={idx}
                  onToggleStatus={handleToggleStatus}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
