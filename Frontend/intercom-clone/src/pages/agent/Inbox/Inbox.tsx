import { InboxLayout } from '../../../components/Inbox/InboxLayout';
import { authSession } from '../../../utils/authSession';

export function AgentInboxPage() {
  const user = authSession.getUser();
  const userId = user?.id || 'agent_01';
  const userName = user?.name || 'Alice Johnson';

  return <InboxLayout userId={userId} userName={userName} />;
}
