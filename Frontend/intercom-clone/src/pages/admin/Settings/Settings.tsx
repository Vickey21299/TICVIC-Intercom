import { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { api } from '../../../services/api';
import type { Workspace } from '../../../types/api';
import { authSession } from '../../../utils/authSession';
import styles from './Settings.module.css';

export function SettingsPage() {
  const user = authSession.getUser();
  const workspaceId = user?.workspace_id || 'workspace_acme';

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainInput, setDomainInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const res = await api.getWorkspace(workspaceId);
        if (res.workspace) {
          setWorkspace(res.workspace);
          setDomainInput(res.workspace.custom_domain || '');
        }
      } catch (err) {
        console.error('Failed to load workspace details', err);
        // Load fallback workspace mock if not found in db yet
        setWorkspace({
          workspace_id: workspaceId,
          name: 'ACME Corp Support',
          slug: 'acme-corp',
          email: 'support@acme.com',
          plan: 'Enterprise Pro',
          status: 'active',
          created_by: 'Super Admin',
          created_by_id: 'admin_acme',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, [workspaceId]);

  const handleConnectDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.addCustomDomain(workspaceId, domainInput.trim());
      if (res.workspace) {
        setWorkspace(res.workspace);
        setFeedback({
          type: 'info',
          text: 'Custom domain connected! Please add CNAME & TXT records to your DNS provider.',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyDomain = async () => {
    setVerifying(true);
    setFeedback(null);
    try {
      const res = await api.verifyCustomDomain(workspaceId);
      if (res.workspace) {
        setWorkspace(res.workspace);
        setFeedback({
          type: 'success',
          text: 'DNS Verification and SSL provisioning succeeded! Your Knowledge Base is now live on your custom domain.',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!window.confirm('Are you sure you want to disconnect this custom domain?')) return;
    setFeedback(null);
    try {
      const res = await api.deleteCustomDomain(workspaceId);
      if (res.workspace) {
        setWorkspace(res.workspace);
        setDomainInput('');
        setFeedback({
          type: 'info',
          text: 'Custom domain disconnected successfully.',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading workspace settings...</div>;
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Workspace Settings" description="Manage details, customize your Help Center domain, and track your subscriptions." />

      {/* General Settings Card */}
      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>General Information</h2>
          <p className={styles.sectionDescription}>Basic settings for your workspace and support team profile.</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Workspace Name</label>
            <div className={styles.readOnlyVal}>{workspace?.name}</div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Workspace Slug</label>
            <div className={styles.readOnlyVal}>{workspace?.slug}</div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Workspace Email</label>
            <div className={styles.readOnlyVal}>{workspace?.email}</div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Subscription Plan</label>
            <div className={styles.readOnlyVal}>{workspace?.plan}</div>
          </div>
        </div>
      </div>

      {/* Custom Domain Settings Card */}
      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Custom Domain for Knowledge Base</h2>
          <p className={styles.sectionDescription}>Point a custom domain (e.g. help.yourcompany.com) to host your Knowledge Base articles.</p>
        </div>

        {!workspace?.custom_domain ? (
          <form onSubmit={handleConnectDomain} className={styles.grid}>
            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
              <label className={styles.label} htmlFor="custom-domain">Connect Domain Name</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  id="custom-domain"
                  type="text"
                  placeholder="e.g. help.mybrand.com"
                  className={styles.input}
                  style={{ flex: 1 }}
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                />
                <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                  {submitting ? 'Connecting...' : 'Connect Domain'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className={styles.label} style={{ fontSize: '1rem', color: '#1e293b' }}>
                  Custom Domain: <strong style={{ color: '#2563eb' }}>{workspace.custom_domain}</strong>
                </span>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                  <span className={`${styles.domainStatusBadge} ${workspace.custom_domain_status === 'verified' ? styles.statusActive : styles.statusPending}`}>
                    DNS: {workspace.custom_domain_status}
                  </span>
                  <span className={`${styles.domainStatusBadge} ${workspace.ssl_status === 'active' ? styles.statusActive : styles.statusPending}`}>
                    SSL Certificate: {workspace.ssl_status}
                  </span>
                </div>
              </div>
              <button onClick={handleRemoveDomain} className={styles.dangerBtn}>
                Disconnect Domain
              </button>
            </div>

            {/* DNS Records Guide */}
            {workspace.custom_domain_status !== 'verified' && (
              <div className={styles.dnsGuide}>
                <h3 className={styles.dnsGuideTitle}>
                  ⚠️ DNS Configuration Required
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 1rem 0' }}>
                  Please add the following DNS records to your domain provider (e.g. Cloudflare, GoDaddy, Route53) to verify ownership and trigger automatic SSL provisioning:
                </p>

                <table className={styles.dnsTable}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Host / Name</th>
                      <th>Value / Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className={styles.codeBlock}>CNAME</span></td>
                      <td><span className={styles.codeBlock}>{workspace.custom_domain}</span></td>
                      <td><span className={styles.codeBlock}>{workspace.dns_cname_target}</span></td>
                    </tr>
                    <tr>
                      <td><span className={styles.codeBlock}>TXT</span></td>
                      <td><span className={styles.codeBlock}>_intercom-challenge.{workspace.custom_domain}</span></td>
                      <td><span className={styles.codeBlock}>{workspace.dns_txt_record}</span></td>
                    </tr>
                  </tbody>
                </table>

                <div className={styles.buttonGroup}>
                  <button onClick={handleVerifyDomain} className={styles.primaryBtn} disabled={verifying}>
                    {verifying ? 'Verifying records...' : 'Verify DNS & SSL Provisioning'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {feedback && (
          <div className={`${styles.alertBanner} ${feedback.type === 'success' ? styles.alertSuccess : styles.alertInfo}`}>
            {feedback.type === 'success' ? '✅' : 'ℹ️'} {feedback.text}
          </div>
        )}
      </div>
    </div>
  );
}
