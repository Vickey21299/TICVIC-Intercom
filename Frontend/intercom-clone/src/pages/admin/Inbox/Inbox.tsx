import { InboxLayout } from '../../../components/Inbox/InboxLayout';
import { authSession } from '../../../utils/authSession';

export function InboxPage() {
  const user = authSession.getUser();
  const userId = user?.id || 'admin_acme';
  const userName = user?.name || 'Super Admin';

  return <InboxLayout userId={userId} userName={userName} />;
}
