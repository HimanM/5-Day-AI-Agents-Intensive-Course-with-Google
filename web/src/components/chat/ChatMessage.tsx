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

interface ChatMessageProps {
  msg: Message;
}

// Google Search Display Component
function GoogleSearchDisplay({ metadata }: { metadata: GroundingMetadata }) {
  if (!metadata.webSearchQueries || metadata.webSearchQueries.length === 0) {
    return null;
  }

  const queries = metadata.webSearchQueries;
  
  return (
    <div className="mt-3 pt-3 border-t border-border/30">
      <div className="flex items-center gap-2">
        {/* Google Icon SVG */}
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
        </svg>
        
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium opacity-60 mb-1">Google Search</div>
          <div className="space-y-1">
            {queries.map((query, idx) => (
              <a
                key={idx}
                href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate"
              >
                {query}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatMessage({ msg }: ChatMessageProps) {
  const isShort = msg.role === 'user' && msg.text.length < 40 && !msg.loading;
  const isError = msg.role === 'system' && (msg.text.includes('❌') || msg.text.includes('⚠️') || msg.text.includes('🔒'));

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
          ${msg.role === 'system' && !isError ? 'bg-accent/50 text-xs text-center' : ''}
          ${isError ? 'bg-destructive/10 border-2 border-destructive/30 text-sm text-left' : ''}
          whitespace-pre-wrap wrap-break-word
        `}
        style={{ 
          maxWidth: isShort ? 'fit-content' : (msg.role === 'agent' || msg.loading ? '85%' : (isError ? '90%' : '70%')), 
          minWidth: msg.loading ? '200px' : (isError ? '300px' : '100px'),
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
            {msg.groundingMetadata && <GoogleSearchDisplay metadata={msg.groundingMetadata} />}
          </>
        )}
      </div>
    </div>
  );
}
