import { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import type { Agent, Conversation, Message } from '../../types/api';
import styles from './ConversationDetail.module.css';
import { InboxActions } from './InboxActions';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface Props {
  conversationId: string;
  userId: string;
  userName: string;
  agents: Agent[];
  onConversationUpdated: () => void;
}

export function ConversationDetail({ conversationId, userId, userName, agents, onConversationUpdated }: Props) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);  // only true on first load
  const [isSending, setIsSending] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Runs only on initial mount + conversationId change — shows the full spinner once
  useEffect(() => {
    let cancelled = false;

    // Check if details are already in cache
    const cacheKeyDetail = `ticvic_conv_detail_${conversationId}`;
    const cacheKeyMessages = `ticvic_conv_msgs_${conversationId}`;
    const cachedDetail = localStorage.getItem(cacheKeyDetail);
    const cachedMsgs = localStorage.getItem(cacheKeyMessages);
    
    if (cachedDetail && cachedMsgs) {
      try {
        setConversation(JSON.parse(cachedDetail));
        setMessages(JSON.parse(cachedMsgs));
        setLoading(false);
      } catch (err) {
        console.error('Failed to parse cached details', err);
        setLoading(true);
      }
    } else {
      setLoading(true);
    }

    Promise.all([
      api.getConversation(conversationId, userId),
      api.getMessages(conversationId, userId),
    ])
      .then(([convRes, msgRes]) => {
        if (cancelled) return;
        setConversation(convRes.conversation);
        setMessages(msgRes.messages);
        
        // Cache the updated values
        localStorage.setItem(cacheKeyDetail, JSON.stringify(convRes.conversation));
        localStorage.setItem(cacheKeyMessages, JSON.stringify(msgRes.messages));
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [conversationId, userId]);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // AI Summarization caching and fetching
  useEffect(() => {
    if (messages.length > 0) {
      const cacheKey = `summary_${conversationId}_${messages.length}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setAiSummary(cached);
        setIsSummarizing(false);
      } else {
        setIsSummarizing(true);
        api.summarizeConversation(conversationId)
          .then(data => {
            if (data.summary) {
              localStorage.setItem(cacheKey, data.summary);
              setAiSummary(data.summary);
            }
          })
          .catch(err => console.error('Failed to get AI summary:', err))
          .finally(() => setIsSummarizing(false));
      }
    } else {
      setAiSummary(null);
      setIsSummarizing(false);
    }
  }, [messages.length, conversationId]);

  // --- Status / assignment update ---
  // Optimistic: update local state immediately, sync with server quietly in background.
  // No loading spinner is shown at any point.
  const handleUpdate = async (updates: { status?: string; assigned_agent?: string }) => {
    setConversation(prev => (prev ? { ...prev, ...updates } : prev));

    try {
      const res = await api.updateConversation(conversationId, updates, userId);
      if (res.conversation) setConversation(res.conversation);
      onConversationUpdated(); // silently refresh the sidebar list
    } catch (error) {
      console.error(error);
      // Roll back optimistic update on failure
      api.getConversation(conversationId, userId)
        .then(r => setConversation(r.conversation))
        .catch(console.error);
    }
  };

  // --- Send a message ---
  // Appends the message locally IMMEDIATELY (optimistic UI) — the user sees
  // it appear in the chat right away. The API call fires in the background.
  // The conversation view NEVER reloads / goes back to a spinner.
  const handleSend = async (content: string) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: Message = {
      message_id: tempId,
      conversation_id: conversationId,
      workspace_id: conversation?.workspace_id ?? '',
      sender_type: 'agent',
      sender_id: userId,
      sender_name: userName,
      content,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setIsSending(true);

    try {
      await api.sendMessage(
        conversationId,
        { sender_type: 'agent', sender_id: userId, sender_name: userName, content },
        userId,
      );
      // Silently ping parent list to update last_message_at — no UI disruption
      onConversationUpdated();
    } catch (error) {
      console.error(error);
      // Remove the optimistic bubble if the API failed
      setMessages(prev => prev.filter(m => m.message_id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  // Show spinner only on first load of this conversation
  if (loading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner}></div>
        <span>Loading conversation...</span>
      </div>
    );
  }

  if (!conversation) {
    return <div className={styles.loader}>Conversation not found</div>;
  }

  return (
    <div className={styles.detail}>
      <InboxActions
        conversation={conversation}
        agents={agents}
        onUpdate={handleUpdate}
      />

      <div className={styles.messagesWrapper}>
        {/* Floating AI Summary Overlay */}
        {(isSummarizing || aiSummary) && (
          <div className={styles.aiSummaryOverlay}>
            {!isSummaryVisible && aiSummary ? (
              <button
                className={styles.aiSummaryToggleBtn}
                onClick={() => setIsSummaryVisible(true)}
                title="Open AI Summary"
              >
                ✨ Show AI Summary
              </button>
            ) : (
              <div className={styles.aiSummaryBox}>
                <div className={styles.aiSummaryHeader}>
                  <div className={styles.aiSummaryTitle}>
                    <span className={styles.aiSummaryIcon}>✨</span>
                    <strong>{isSummarizing && !aiSummary ? 'Generating AI Summary...' : 'AI Conversation Summary'}</strong>
                  </div>
                  {aiSummary && (
                    <button
                      className={styles.aiSummaryCloseBtn}
                      onClick={() => setIsSummaryVisible(false)}
                      title="Close Summary"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {aiSummary && <div className={styles.aiSummaryContent}>{aiSummary}</div>}
              </div>
            )}
          </div>
        )}

        <div className={styles.messages}>
          {messages.map(msg => (
            <MessageBubble key={msg.message_id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <MessageInput
        onSend={handleSend}
        disabled={conversation.status === 'Closed' || isSending}
      />
    </div>
  );
}
