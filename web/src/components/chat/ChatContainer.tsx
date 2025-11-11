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
  onExampleClick?: (example: string) => void;
}

export interface ChatContainerRef {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatContainer = forwardRef<ChatContainerRef, ChatContainerProps>(
  ({ messages, connected, showAgentInfo, selectedAgent, onExampleClick }, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // We will always show the latest system error in the top-left banner.

  useImperativeHandle(ref, () => ({
    containerRef
  }));

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasNonSystemMessages = messages.filter(m => m.role !== 'system').length > 0;

  // When an error appears we show it in the top-left banner and auto-hide it
  // after 10s. If older system messages exist they should not resurface the
  // banner once dismissed; the banner will only reappear for a newer error.
  const [dismissedAll, setDismissedAll] = useState(false);
  const [lastShownErrorId, setLastShownErrorId] = useState<string | null>(null);

  // Detect the latest prominent system error message to show in a banner.
  // We reverse the messages so the newest matching system message is selected.
  const latestError = [...messages].reverse().find(m =>
    m.role === 'system' &&
    /error|failed|fail(ed)?|resource exhausted|too many requests|429/i.test(m.text)
  );

  // When a new error arrives, reset dismissed state and start the auto-hide timer.
  useEffect(() => {
    if (!latestError) return;

    // If this is a new error (different id), show it and start timer
    if (latestError.id !== lastShownErrorId) {
      setLastShownErrorId(latestError.id);
      setDismissedAll(false);
    }

    // Start/refresh auto-dismiss timer
    const t = setTimeout(() => setDismissedAll(true), 10000);
    return () => clearTimeout(t);
  }, [latestError, lastShownErrorId]);

  // Only show the banner when we have a latestError and it has not been dismissedAll
  const errorMessage = latestError && !dismissedAll ? latestError : null;

  // We will not render system messages inline in the chat (remove the middle error display).
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
          <AgentInfoBox selectedAgent={selectedAgent} onExampleClick={onExampleClick} />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-6 space-y-3">
          {/* Chat Messages */}
          {messages
            // remove all system messages from inline rendering to avoid the middle/inline error display
            .filter(m => m.role !== 'system')
            .map((msg) => (
              <ChatMessage key={msg.id} msg={msg} />
          ))}
          
          <div ref={scrollRef} />
        </div>
      )}
    </div>
  );
});
