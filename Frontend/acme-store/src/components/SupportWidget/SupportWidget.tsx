import { useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import ChatBubble from './ChatBubble';
import Message, { TypingIndicator } from './Message';
import InputBar from './InputBar';
import CustomerSelector from '../CustomerSelector/CustomerSelector';
import './SupportWidget.css';

export default function SupportWidget() {
  const {
    isOpen,
    messages,
    isTyping,
    unreadCount,
    selectedCustomer,
    conversations,
    activeConversation,
    loading,
    error,
    toggleWidget,
    closeWidget,
    sendMessage,
    selectCustomer,
    selectConversation,
    startNewChat,
  } = useChat();

  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or typing
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <>
      {/* Customer test selector */}
      <CustomerSelector
        selectedCustomer={selectedCustomer}
        onSelect={selectCustomer}
      />

      {/* Widget panel */}
      <div className="widget-overlay">
        <div className={`widget-panel ${isOpen ? 'open' : 'closed'}`}>
          {/* Header */}
          <div className="widget-header">
            <div className="widget-header-info">
              <div className="widget-header-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <div>
                <p className="widget-header-name">ACME Support</p>
                <div className="widget-header-status">
                  <span className="widget-status-dot" />
                  {selectedCustomer ? (
                    <span>Chatting as <strong>{selectedCustomer.name}</strong></span>
                  ) : (
                    'Online'
                  )}
                </div>
              </div>
            </div>
            <button className="widget-close-btn" onClick={closeWidget} aria-label="Close chat">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Previous Chats Selector */}
          {selectedCustomer && (conversations.length > 0 || activeConversation) && (
            <div className="widget-past-chats">
              <span className="widget-past-chats-label">Chats:</span>
              <div className="widget-past-chats-list">
                {conversations.map((conv) => (
                  <button
                    key={conv.conversation_id}
                    className={`widget-past-chat-btn${activeConversation?.conversation_id === conv.conversation_id ? ' active' : ''}`}
                    onClick={() => selectConversation(conv)}
                    title={conv.subject || 'Previous Chat'}
                  >
                    <svg className="widget-past-chat-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
                    </svg>
                    <span className="widget-past-chat-subject">
                      {conv.conversation_id.replace('conv_', '')}
                    </span>
                  </button>
                ))}
                <button
                  className={`widget-past-chat-btn new-chat-btn${activeConversation && !conversations.some(c => c.conversation_id === activeConversation.conversation_id) ? ' active' : ''}`}
                  onClick={startNewChat}
                  title="Start New Chat"
                >
                  <svg className="widget-past-chat-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>New Chat</span>
                </button>
              </div>
            </div>
          )}

          {/* Messages body */}
          <div className="widget-body" ref={bodyRef}>
            {/* No customer selected */}
            {!selectedCustomer && (
              <div className="widget-welcome">
                <div className="widget-welcome-emoji">👆</div>
                <p className="widget-welcome-title">Select a Customer</p>
                <p className="widget-welcome-text">
                  Pick a test customer from the bar above to load their conversation.
                </p>
              </div>
            )}

            {/* Loading */}
            {selectedCustomer && loading && (
              <div className="widget-welcome">
                <div className="widget-loading-spinner" />
                <p className="widget-welcome-title">Loading messages...</p>
              </div>
            )}

            {/* Error */}
            {selectedCustomer && error && (
              <div className="widget-welcome">
                <div className="widget-welcome-emoji">⚠️</div>
                <p className="widget-welcome-title">Connection Error</p>
                <p className="widget-welcome-text">{error}</p>
              </div>
            )}

            {/* No conversation found */}
            {selectedCustomer && !loading && !error && !activeConversation && (
              <div className="widget-welcome">
                <div className="widget-welcome-emoji">💬</div>
                <p className="widget-welcome-title">No conversations yet</p>
                <p className="widget-welcome-text">
                  This customer has no chat history.
                </p>
              </div>
            )}

            {/* Messages */}
            {selectedCustomer && !loading && !error && activeConversation && (
              <>
                <div className="widget-welcome">
                  <div className="widget-welcome-emoji">👋</div>
                  <p className="widget-welcome-title">
                    {activeConversation.subject || 'Conversation'}
                  </p>
                  <p className="widget-welcome-text">
                    {activeConversation.summary}
                  </p>
                </div>

                {messages.map((msg) => (
                  <Message key={msg.id} message={msg} />
                ))}
              </>
            )}

            {isTyping && <TypingIndicator />}
          </div>

          {/* Input */}
          <InputBar
            onSend={sendMessage}
            disabled={!selectedCustomer}
          />

          {/* Powered by */}
          <div className="widget-powered">
            Powered by <a href="#">ACME Support</a>
          </div>
        </div>
      </div>

      {/* Floating bubble */}
      <ChatBubble
        isOpen={isOpen}
        unreadCount={unreadCount}
        onClick={toggleWidget}
      />
    </>
  );
}
