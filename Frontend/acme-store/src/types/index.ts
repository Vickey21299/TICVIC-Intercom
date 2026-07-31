export interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'agent';
  senderName?: string;
  timestamp: Date;
}

export interface ChatState {
  isOpen: boolean;
  messages: Message[];
  isTyping: boolean;
  unreadCount: number;
}

export interface Customer {
  customer_id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Conversation {
  conversation_id: string;
  workspace_id: string;
  customer_id: string;
  assigned_agent: string;
  status: string;
  channel: string;
  priority: string;
  subject: string;
  summary: string;
  message_count: number;
  message_ids: string[];
  created_at: string;
  last_message_at: string;
  customer_name?: string;
  agent_name?: string;
}

export interface ApiMessage {
  message_id: string;
  conversation_id: string;
  workspace_id: string;
  sender_type: 'customer' | 'agent';
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  gradient: string;
  icon: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
}
