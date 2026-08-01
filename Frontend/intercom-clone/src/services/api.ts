import type {
  ConversationListResponse,
  ConversationDetailResponse,
  MessageListResponse,
  SendMessageRequest,
  ConversationUpdateRequest,
  AgentListResponse,
  AgentDetailResponse,
  CustomerListResponse,
  WorkspaceDetailResponse,
} from '../types/api';
import type { AuthResponse, LoginFormValues } from '../types/auth';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api';

export const api = {
  getConversations: async (
    userId: string,
    filters?: { status?: string; channel?: string; priority?: string }
  ): Promise<ConversationListResponse> => {
    const params = new URLSearchParams({ user_id: userId });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.channel) params.append('channel', filters.channel);
    if (filters?.priority) params.append('priority', filters.priority);

    const res = await fetch(`${API_BASE_URL}/conversations?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  getConversation: async (id: string, userId: string): Promise<ConversationDetailResponse> => {
    const res = await fetch(`${API_BASE_URL}/conversations/${id}?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  },

  updateConversation: async (
    id: string,
    payload: ConversationUpdateRequest,
    userId: string
  ): Promise<ConversationDetailResponse> => {
    const res = await fetch(`${API_BASE_URL}/conversations/${id}?user_id=${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  },

  getMessages: async (conversationId: string, userId: string): Promise<MessageListResponse> => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  sendMessage: async (
    conversationId: string,
    payload: SendMessageRequest,
    userId: string
  ): Promise<MessageListResponse> => {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  summarizeConversation: async (conversationId: string): Promise<{ summary: string }> => {
    const res = await fetch(`${API_BASE_URL}/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId }),
    });
    if (!res.ok) throw new Error('Failed to summarize conversation');
    return res.json();
  },

  getAgents: async (): Promise<AgentListResponse> => {
    const res = await fetch(`${API_BASE_URL}/agents`);
    if (!res.ok) throw new Error('Failed to fetch agents');
    return res.json();
  },

  getAgent: async (agentId: string): Promise<AgentDetailResponse> => {
    const res = await fetch(`${API_BASE_URL}/agents/${agentId}`);
    if (!res.ok) throw new Error('Failed to fetch agent profile');
    return res.json();
  },

  getCustomers: async (userId: string): Promise<CustomerListResponse> => {
    const res = await fetch(`${API_BASE_URL}/customers?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  getCustomerConversations: async (customerId: string, userId: string): Promise<ConversationListResponse> => {
    const res = await fetch(`${API_BASE_URL}/customers/${customerId}/conversations?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch customer conversations');
    return res.json();
  },

  updateAgentStatus: async (agentId: string, online: boolean): Promise<void> => {
    await fetch(`${API_BASE_URL}/agents/${agentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ online }),
    });
  },

  getWorkspace: async (workspaceId: string): Promise<WorkspaceDetailResponse> => {
    const res = await fetch(`${API_BASE_URL}/workspace/${workspaceId}`);
    if (!res.ok) throw new Error('Failed to fetch workspace details');
    return res.json();
  },

  addCustomDomain: async (workspaceId: string, customDomain: string): Promise<WorkspaceDetailResponse> => {
    const res = await fetch(`${API_BASE_URL}/workspace/${workspaceId}/custom-domain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_domain: customDomain }),
    });
    if (!res.ok) throw new Error('Failed to configure custom domain');
    return res.json();
  },

  verifyCustomDomain: async (workspaceId: string): Promise<WorkspaceDetailResponse> => {
    const res = await fetch(`${API_BASE_URL}/workspace/${workspaceId}/custom-domain/verify`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to verify custom domain DNS or provision SSL');
    return res.json();
  },

  deleteCustomDomain: async (workspaceId: string): Promise<WorkspaceDetailResponse> => {
    const res = await fetch(`${API_BASE_URL}/workspace/${workspaceId}/custom-domain`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove custom domain');
    return res.json();
  },

  login: async (payload: LoginFormValues): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Invalid email or password.');
    }
    return res.json();
  },

  getMe: async (params: { userId?: string; email?: string }): Promise<AuthResponse> => {
    const searchParams = new URLSearchParams();
    if (params.userId) searchParams.append('user_id', params.userId);
    if (params.email) searchParams.append('email', params.email);

    const res = await fetch(`${API_BASE_URL}/auth/me?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to get current user details');
    return res.json();
  },
};
