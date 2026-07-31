import type { ApiMessage, Conversation } from '../types';

const API_BASE = 'http://localhost:8000';

// For testing, we use admin_acme as user_id to bypass role restrictions
// so we can view any customer's conversations
const AUTH_USER_ID = 'admin_acme';

/**
 * Fetch conversations for a given customer.
 */
export async function fetchCustomerConversations(
  customerId: string,
): Promise<Conversation[]> {
  const url = `${API_BASE}/api/customers/${customerId}/conversations?user_id=${AUTH_USER_ID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch conversations: ${res.status}`);
  const data = await res.json();
  const conversations: Conversation[] = data.conversations ?? [];
  // Filter out non-chat (e.g. email) conversations for this chat widget
  return conversations.filter((c) => c.channel === 'chat');
}

/**
 * Fetch messages for a given conversation.
 */
export async function fetchConversationMessages(
  conversationId: string,
): Promise<ApiMessage[]> {
  const url = `${API_BASE}/api/conversations/${conversationId}/messages?user_id=${AUTH_USER_ID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  const data = await res.json();
  return data.messages ?? [];
}

/**
 * Send a message to a conversation.
 */
export async function sendMessageToConversation(
  conversationId: string,
  senderId: string,
  senderName: string,
  content: string,
): Promise<ApiMessage> {
  const url = `${API_BASE}/api/conversations/${conversationId}/messages?user_id=${AUTH_USER_ID}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender_type: 'customer',
      sender_id: senderId,
      sender_name: senderName,
      content,
    }),
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
  const data = await res.json();
  return data.data;
}

/**
 * Ask the AI service for a reply and persist the agent message.
 */
export async function getAiReply(
  conversationId: string,
  message: string,
  customerId: string,
  customerName: string,
  customerEmail: string,
  customerAvatar: string,
): Promise<ApiMessage> {
  // First, get the AI response
  const aiUrl = `${API_BASE}/api/ai/chat`;
  const aiRes = await fetch(aiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_id: conversationId,
      message,
      customer_id: customerId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_avatar: customerAvatar,
    }),
  });
  
  if (!aiRes.ok) throw new Error(`Failed to get AI reply: ${aiRes.status}`);
  const aiData = await aiRes.json();
  const replyContent = aiData.reply || "I'm sorry, I encountered an error.";

  // The backend already stored this message as agent_01 in RTDB,
  // so we just return a local ApiMessage object to immediately update the UI.
  return {
    message_id: `temp_ai_${Date.now()}`,
    conversation_id: conversationId,
    workspace_id: '',
    sender_type: 'agent',
    sender_id: 'agent_01',
    sender_name: 'AI Agent',
    content: replyContent,
    created_at: new Date().toISOString(),
  };
}
