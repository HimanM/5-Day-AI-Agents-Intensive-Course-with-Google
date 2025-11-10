import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { AgentInfoBox } from './AgentInfoBox';
import { ChatMessage } from './ChatMessage';

interface Message {
  role: 'user' | 'agent' | 'system';
  text: string;
  author?: string;
  id: string;
  loading?: boolean;
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

  useImperativeHandle(ref, () => ({
    containerRef
  }));

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasNonSystemMessages = messages.filter(m => m.role !== 'system').length > 0;

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto relative">
      {/* Agent Info Box - Centered when no messages */}
      {connected && showAgentInfo && !hasNonSystemMessages && selectedAgent ? (
        <div className="flex items-center justify-center min-h-full p-6">
          <AgentInfoBox selectedAgent={selectedAgent} />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-6 space-y-3">
          {/* Chat Messages */}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
          ))}
          
          <div ref={scrollRef} />
        </div>
      )}
    </div>
  );
});
