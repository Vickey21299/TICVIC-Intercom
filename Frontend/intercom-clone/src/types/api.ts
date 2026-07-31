export interface Conversation {
  conversation_id: string;
  workspace_id: string;
  customer_id: string;
  assigned_agent: string;
  status: string;
  channel: string;
  priority: string;
  created_at: string;
  last_message_at: string;
  summary: string;
  subject: string;
  message_count: number;
  message_ids: string[];
  customer_name?: string;
  customer_avatar?: string;
  agent_name?: string;
}

export interface ConversationListResponse {
  success: boolean;
  message: string;
  conversations: Conversation[];
  total: number;
}

export interface ConversationDetailResponse {
  success: boolean;
  message: string;
  conversation: Conversation;
}

export interface Message {
  message_id: string;
  conversation_id: string;
  workspace_id: string;
  sender_type: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface MessageListResponse {
  success: boolean;
  message: string;
  messages: Message[];
  total: number;
}

export interface Customer {
  customer_id: string;
  name: string;
  email: string;
  avatar: string;
  created_at: string;
}

export interface CustomerListResponse {
  success: boolean;
  message: string;
  customers: Customer[];
  total: number;
}

export interface Agent {
  user_id: string;
  name: string;
  email: string;
  role: string;
  workspace_id: string;
  online: boolean;
  avatar: string;
  assigned_conversations: string[];
  created_at?: string;
}

export interface AgentListResponse {
  success: boolean;
  message: string;
  agents: Agent[];
  total: number;
}

export interface AgentDetailResponse {
  success: boolean;
  message: string;
  agent: Agent;
}

export interface Workspace {
  workspace_id: string;
  name: string;
  slug: string;
  email: string;
  plan: string;
  status: string;
  created_by: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  custom_domain?: string;
  custom_domain_status?: string;
  ssl_status?: string;
  dns_txt_record?: string;
  dns_cname_target?: string;
}

export interface WorkspaceDetailResponse {
  success: boolean;
  message: string;
  workspace: Workspace;
}


export interface SendMessageRequest {
  sender_type: string;
  sender_id: string;
  sender_name: string;
  content: string;
}

export interface ConversationUpdateRequest {
  status?: string;
  priority?: string;
  assigned_agent?: string;
}
