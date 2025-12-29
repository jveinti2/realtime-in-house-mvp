import { useEffect, useRef } from 'react';

export function ChatTranscript({ messages }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="chat-transcript">
      <div className="chat-header">
        <h3>Transcript</h3>
        <span className="message-count">{messages.length} mensajes</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>La conversación aparecerá aquí...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}${!msg.isFinal ? ' partial' : ''}`}
            >
              <div className="message-header">
                <span className="message-role">
                  {msg.role === 'user' ? '👤 Usuario' : '🤖 Agente'}
                </span>
                {!msg.isFinal ? (
                  <span className="message-typing">transcribiendo...</span>
                ) : (
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                )}
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
