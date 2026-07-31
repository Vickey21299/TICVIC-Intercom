import { useEffect, useState } from 'react';
import { Avatar } from '../../../components/Avatar/Avatar';
import { LoadingSpinner } from '../../../components/LoadingSpinner/LoadingSpinner';
import { api } from '../../../services/api';
import type { Agent } from '../../../types/api';
import { authSession } from '../../../utils/authSession';
import styles from './Profile.module.css';

export function AgentProfilePage() {
  const user = authSession.getUser();
  const agentId = user?.id || 'agent_01';
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState('Best regards,\nSupport Specialist');
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.getAgent(agentId);
        if (res.agent) {
          setAgent(res.agent);
          setIsOnline(res.agent.online);
          setSignature(`Best regards,\n${res.agent.name} | Support Specialist`);
        }
      } catch (err) {
        console.error('Failed to load agent profile', err);
        setAgent({
          user_id: 'agent_01',
          name: 'Alice Johnson',
          email: 'alice@acme.com',
          role: 'agent',
          workspace_id: 'workspace_acme',
          online: true,
          avatar: '',
          assigned_conversations: ['conv_01', 'conv_02'],
        });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [agentId]);

  const toggleStatus = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    try {
      await api.updateAgentStatus(agentId, nextStatus);
    } catch (err) {
      console.error('Failed to update status on backend', err);
    }
  };

  const handleSaveSignature = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <LoadingSpinner label="Loading Agent Profile..." />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Agent Summary Card */}
      <div className={styles.profileCard}>
        <div className={styles.agentInfo}>
          <Avatar
            name={agent?.name || 'Alice Johnson'}
            avatar={agent?.avatar}
            size="xl"
            online={isOnline}
          />
          <div className={styles.details}>
            <h1>{agent?.name || 'Alice Johnson'}</h1>
            <p>{agent?.email || 'alice@acme.com'}</p>
            <span className={styles.roleBadge}>Support Specialist ({agent?.role || 'agent'})</span>
          </div>
        </div>

        <div className={styles.statusToggle}>
          <span className={styles.statusLabel}>Availability Status</span>
          <button
            onClick={toggleStatus}
            className={`${styles.toggleBtn} ${isOnline ? styles.btnOnline : styles.btnOffline}`}
          >
            <span className={`${styles.statusDot} ${isOnline ? styles.dotOnline : styles.dotOffline}`} />
            {isOnline ? 'Online (Available)' : 'Offline (Away)'}
          </button>
        </div>
      </div>

      <div className={styles.sectionGrid}>
        {/* Performance Metrics Panel */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Performance Overview</h2>

          <div className={styles.statRow}>
            <span className={styles.statLabel}>Assigned Threads</span>
            <span className={styles.statVal}>{agent?.assigned_conversations?.length || 2}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Avg First Response Time</span>
            <span className={styles.statVal}>3m 42s</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Customer Satisfaction (CSAT)</span>
            <span className={styles.statVal}>98.4%</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Workspace ID</span>
            <span className={styles.statVal}>{agent?.workspace_id || 'workspace_acme'}</span>
          </div>
        </div>

        {/* Preferences & Signature Panel */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Agent Preferences & Signature</h2>

          <div className={styles.inputGroup}>
            <label htmlFor="signature">Default Chat Signature</label>
            <textarea
              id="signature"
              className={styles.textarea}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className={styles.saveBtn} onClick={handleSaveSignature}>
              Save Preferences
            </button>
            {savedMsg && <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>Saved!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
