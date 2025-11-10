import { Bot, Zap, Users, RefreshCw, Sparkles, Brain, MessageSquare, Cpu, Globe, Workflow } from 'lucide-react';

const AGENT_ICONS = [Bot, Zap, Users, RefreshCw, Sparkles, Brain, MessageSquare, Cpu, Globe, Workflow];

const formatAgentName = (name: string) => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getAgentIcon = (agentName: string) => {
  const hash = agentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const iconIndex = hash % AGENT_ICONS.length;
  return AGENT_ICONS[iconIndex];
};

interface Message {
  role: 'user' | 'agent' | 'system';
  text: string;
  author?: string;
  id: string;
  loading?: boolean;
}

interface ChatMessageProps {
  msg: Message;
}

export function ChatMessage({ msg }: ChatMessageProps) {
  const isShort = msg.role === 'user' && msg.text.length < 40 && !msg.loading;

  return (
    <div
      className={`
        flex w-full
        ${msg.role === 'user' ? 'justify-end' : ''}
        ${msg.role === 'agent' || msg.loading ? 'justify-start' : ''}
        ${msg.role === 'system' ? 'justify-center' : ''}
      `}
    >
      <div
        className={`
          px-5 py-3 rounded-2xl cursor-default transition-all
          ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : ''}
          ${msg.role === 'agent' || msg.loading ? 'bg-muted text-muted-foreground' : ''}
          ${msg.role === 'system' ? 'bg-accent/50 text-xs text-center' : ''}
          whitespace-pre-wrap wrap-break-word
        `}
        style={{ 
          maxWidth: isShort ? 'fit-content' : (msg.role === 'agent' || msg.loading ? '85%' : '70%'), 
          minWidth: msg.loading ? '200px' : '100px',
          marginLeft: msg.role === 'agent' || msg.loading ? '0' : 'auto',
          marginRight: msg.role === 'user' ? '0' : 'auto'
        }}
      >
        {msg.loading ? (
          <div className="flex items-center gap-3">
            <span className="spinner" />
            <span className="text-sm opacity-70">Thinking…</span>
          </div>
        ) : (
          <>
            {msg.author && (
              <div className="flex items-center gap-2 mb-1.5">
                {(() => {
                  const Icon = getAgentIcon(msg.author);
                  return <Icon className="w-3.5 h-3.5 opacity-60" />;
                })()}
                <span className="text-xs font-medium opacity-60">{formatAgentName(msg.author)}</span>
              </div>
            )}
            {msg.text}
          </>
        )}
      </div>
    </div>
  );
}
