import type { Message } from '../types';

/**
 * Chat service interface — swap LocalChatService with ApiChatService
 * when connecting to FastAPI + Firebase backend.
 */
export interface IChatService {
  sendMessage(text: string): Promise<Message>;
  getHistory(): Promise<Message[]>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  onMessage(callback: (message: Message) => void): void;
}

/**
 * Local in-memory implementation for demo purposes.
 */
export class LocalChatService implements IChatService {
  private messages: Message[] = [];
  private listeners: ((message: Message) => void)[] = [];

  async sendMessage(text: string): Promise<Message> {
    const message: Message = {
      id: `msg-${Date.now()}`,
      text,
      sender: 'customer',
      timestamp: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  async getHistory(): Promise<Message[]> {
    return [...this.messages];
  }

  async connect(): Promise<void> {
    // No-op for local service
  }

  async disconnect(): Promise<void> {
    // No-op for local service
  }

  onMessage(callback: (message: Message) => void): void {
    this.listeners.push(callback);
  }
}
