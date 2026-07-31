import { useState, useCallback, useEffect } from 'react';
import type { Message, ChatState, Customer, Conversation, ApiMessage } from '../types';
import {
  fetchCustomerConversations,
  fetchConversationMessages,
  sendMessageToConversation,
  getAiReply,
} from '../services/api';

/**
 * Convert a backend ApiMessage to the local Message format.
 */
function toLocalMessage(msg: ApiMessage): Message {
  return {
    id: msg.message_id,
    text: msg.content,
    sender: msg.sender_type === 'customer' ? 'customer' : 'agent',
    senderName: msg.sender_name,
    timestamp: new Date(msg.created_at),
  };
}

export function useChat() {
  const [state, setState] = useState<ChatState>({
    isOpen: false,
    messages: [],
    isTyping: false,
    unreadCount: 0,
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads messages for a specific conversation.
   */
  const selectConversation = useCallback(async (conversation: Conversation) => {
    setActiveConversation(conversation);
    setLoading(true);
    setError(null);

    try {
      const apiMessages = await fetchConversationMessages(conversation.conversation_id);
      const messages = apiMessages.map(toLocalMessage);

      setState((prev) => ({
        ...prev,
        messages,
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
      setState((prev) => ({
        ...prev,
        messages: [],
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * When a customer is selected, fetch their first conversation
   * and load the messages.
   */
  const selectCustomer = useCallback(async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoading(true);
    setError(null);

    // Store in localStorage for persistence
    localStorage.setItem('acme_selected_customer', JSON.stringify(customer));

    try {
      // 1. Fetch conversations for this customer
      const fetchedConversations = await fetchCustomerConversations(customer.customer_id);
      setConversations(fetchedConversations);

      if (fetchedConversations.length === 0) {
        setActiveConversation(null);
        setState((prev) => ({
          ...prev,
          messages: [],
          unreadCount: 0,
        }));
        setLoading(false);
        return;
      }

      // 2. Pick the first (most recent) conversation
      const conversation = fetchedConversations[0];
      setActiveConversation(conversation);

      // 3. Fetch messages for this conversation
      const apiMessages = await fetchConversationMessages(conversation.conversation_id);
      const messages = apiMessages.map(toLocalMessage);

      setState((prev) => ({
        ...prev,
        messages,
        unreadCount: messages.length > 0 ? 1 : 0,
      }));
    } catch (err) {
      console.error('Failed to load customer details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
      setConversations([]);
      setState((prev) => ({
        ...prev,
        messages: [],
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, restore customer from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('acme_selected_customer');
    if (stored) {
      try {
        const customer = JSON.parse(stored) as Customer;
        selectCustomer(customer);
      } catch {
        // ignore bad data
      }
    }
  }, [selectCustomer]);

  const toggleWidget = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
      unreadCount: !prev.isOpen ? 0 : prev.unreadCount,
    }));
  }, []);

  const closeWidget = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Send a message — hits the backend API, then appends locally.
   */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !selectedCustomer) return;

      let convId = activeConversation?.conversation_id;
      const isNew = !convId || activeConversation?.message_count === 0;
      if (!convId) {
        convId = `conv_${selectedCustomer.customer_id}_chat`;
      }

      // Optimistic local update
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        text: text.trim(),
        sender: 'customer',
        senderName: selectedCustomer.name,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, tempMessage],
      }));

      try {
        if (!isNew && convId) {
          // Send to backend
          const apiMsg = await sendMessageToConversation(
            convId,
            selectedCustomer.customer_id,
            selectedCustomer.name,
            text.trim(),
          );

          // Replace temp message with the real one
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === tempMessage.id ? toLocalMessage(apiMsg) : m,
            ),
            isTyping: true, // Start typing indicator for AI
          }));
        } else {
          // If conversation is new, just show the typing indicator
          setState((prev) => ({
            ...prev,
            isTyping: true,
          }));
        }

        // Get AI Reply
        const aiMsg = await getAiReply(
          convId!,
          text.trim(),
          selectedCustomer.customer_id,
          selectedCustomer.name,
          selectedCustomer.email,
          selectedCustomer.avatar,
        );
        
        // Append AI Reply and stop typing
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, toLocalMessage(aiMsg)],
          isTyping: false,
          unreadCount: prev.isOpen ? 0 : prev.unreadCount + 1,
        }));

        if (isNew && convId) {
          // Fetch conversations to set activeConversation correctly
          const conversations = await fetchCustomerConversations(selectedCustomer.customer_id);
          const found = conversations.find((c) => c.conversation_id === convId);
          if (found) {
            setActiveConversation(found);
          } else {
            // fallback structure
            setActiveConversation({
              conversation_id: convId,
              workspace_id: 'ws_demo',
              customer_id: selectedCustomer.customer_id,
              assigned_agent: 'agent_01',
              status: 'Open',
              channel: 'chat',
              priority: 'medium',
              subject: `${selectedCustomer.name} conversation`,
              summary: 'New conversation started by AI',
              message_count: 2,
              message_ids: [],
              created_at: new Date().toISOString(),
              last_message_at: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error('Failed to send message or get reply:', err);
        // Stop typing on error
        setState((prev) => ({ ...prev, isTyping: false }));
      }
    },
    [selectedCustomer, activeConversation],
  );

  const startNewChat = useCallback(() => {
    if (!selectedCustomer) return;
    const newConvId = `conv_${selectedCustomer.customer_id}_chat_${Date.now()}`;
    
    setState((prev) => ({
      ...prev,
      messages: [],
      unreadCount: 0,
    }));
    
    setActiveConversation({
      conversation_id: newConvId,
      workspace_id: 'ws_demo',
      customer_id: selectedCustomer.customer_id,
      assigned_agent: 'agent_01',
      status: 'Open',
      channel: 'chat',
      priority: 'medium',
      subject: `${selectedCustomer.name} conversation`,
      summary: 'New conversation started by AI',
      message_count: 0,
      message_ids: [],
      created_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    });
  }, [selectedCustomer]);

  const markAsRead = useCallback(() => {
    setState((prev) => ({ ...prev, unreadCount: 0 }));
  }, []);

  return {
    ...state,
    selectedCustomer,
    conversations,
    activeConversation,
    loading,
    error,
    toggleWidget,
    closeWidget,
    sendMessage,
    markAsRead,
    selectCustomer,
    selectConversation,
    startNewChat,
  };
}
