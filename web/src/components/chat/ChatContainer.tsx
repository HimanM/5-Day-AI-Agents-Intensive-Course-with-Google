import { useEffect, useRef } from 'react';
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

export function ChatContainer({ messages, connected, showAgentInfo, selectedAgent }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasNonSystemMessages = messages.filter(m => m.role !== 'system').length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-3">
        {/* Agent Info Box - Shows when connected but no messages sent */}
        {connected && showAgentInfo && !hasNonSystemMessages && selectedAgent && (
          <AgentInfoBox selectedAgent={selectedAgent} />
        )}

        {/* Chat Messages */}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        
        <div ref={scrollRef} />
      </div>
    </div>
  );
}
