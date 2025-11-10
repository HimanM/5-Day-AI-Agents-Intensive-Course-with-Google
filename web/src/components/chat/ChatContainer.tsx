import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { AgentInfoBox } from './AgentInfoBox';
import { ChatMessage } from './ChatMessage';

interface GroundingMetadata {
  webSearchQueries?: string[];
  searchEntryPoint?: {
    renderedContent?: string;
  };
}

interface Message {
  role: 'user' | 'agent' | 'system';
  text: string;
  author?: string;
  id: string;
  loading?: boolean;
  groundingMetadata?: GroundingMetadata;
}

interface ChatContainerProps {
  messages: Message[];
  connected: boolean;
  showAgentInfo: boolean;
  selectedAgent: string;
}

export interface ChatContainerRef {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatContainer = forwardRef<ChatContainerRef, ChatContainerProps>(
  ({ messages, connected, showAgentInfo, selectedAgent }, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dismissedErrorId, setDismissedErrorId] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    containerRef
  }));

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasNonSystemMessages = messages.filter(m => m.role !== 'system').length > 0;

  // Detect a prominent system error message to show in a banner
  const errorMessage = messages.find(m =>
    m.role === 'system' && 
    m.id !== dismissedErrorId &&
    /error|failed|fail(ed)?|resource exhausted|too many requests|429/i.test(m.text)
  );
  
  // Track the current error ID being shown to keep filtering it even after dismissal
  const currentErrorId = errorMessage?.id || dismissedErrorId;

  // Auto-dismiss error banner after 10 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setDismissedErrorId(errorMessage.id);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);
  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto relative">
      {/* Top-left error banner for important system errors */}
      {errorMessage && (
        <div className="absolute top-4 left-4 z-30">
          <div className="max-w-md w-full bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg shadow-sm p-3">
            <div className="font-medium text-sm">Error{(errorMessage.text.match(/\d{3}/) || []).length ? ` (${(errorMessage.text.match(/\d{3}/) || [''])[0]})` : ''}</div>
            <div className="mt-1 text-xs leading-snug">{errorMessage.text}</div>
          </div>
        </div>
      )}

      {/* Agent Info Box - Centered when no messages */}
      {connected && showAgentInfo && !hasNonSystemMessages && selectedAgent ? (
        <div className="flex items-center justify-center min-h-full p-6">
          <AgentInfoBox selectedAgent={selectedAgent} />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-6 space-y-3">
          {/* Chat Messages */}
          {messages
            // remove the error message from inline rendering to avoid showing it twice
            .filter(m => !(currentErrorId && m.id === currentErrorId))
            .map((msg) => (
              <ChatMessage key={msg.id} msg={msg} />
          ))}
          
          <div ref={scrollRef} />
        </div>
      )}
    </div>
  );
});
