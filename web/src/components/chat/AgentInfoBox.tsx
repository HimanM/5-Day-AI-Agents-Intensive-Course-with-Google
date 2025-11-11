import { Bot, Zap, Users, RefreshCw, Sparkles, Brain, MessageSquare, Cpu, Globe, Workflow, Check, MessageCircle } from 'lucide-react';
import agentDescriptionsData from '@/data/agentDescriptions.json';

type AgentDescription = {
  title: string;
  description: string;
  features: string[];
  exampleUsage?: string[];
};

type AgentDescriptions = Record<string, AgentDescription>;

const AGENT_DESCRIPTIONS = agentDescriptionsData as AgentDescriptions;
const AGENT_ICONS = [Bot, Zap, Users, RefreshCw, Sparkles, Brain, MessageSquare, Cpu, Globe, Workflow];

const getAgentIcon = (agentName: string) => {
  const hash = agentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const iconIndex = hash % AGENT_ICONS.length;
  return AGENT_ICONS[iconIndex];
};

interface AgentInfoBoxProps {
  selectedAgent: string;
  onExampleClick?: (example: string) => void;
}

export function AgentInfoBox({ selectedAgent, onExampleClick }: AgentInfoBoxProps) {
  const agentInfo = AGENT_DESCRIPTIONS[selectedAgent];
  
  if (!agentInfo) return null;

  const Icon = getAgentIcon(selectedAgent);

  return (
    <div className="max-w-2xl w-full bg-linear-to-br from-primary/5 to-accent/10 border-2 border-primary/20 rounded-2xl p-8 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">
          {agentInfo.title}
        </h2>
      </div>
      
      <p className="text-base text-muted-foreground mb-6 leading-relaxed">
        {agentInfo.description}
      </p>
      
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Key Features</h3>
        <ul className="space-y-2">
          {agentInfo.features.map((feature: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {agentInfo.exampleUsage && agentInfo.exampleUsage.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Example Usage</h3>
          <div className="space-y-2">
            {agentInfo.exampleUsage.map((example: string, idx: number) => (
              <div 
                key={idx} 
                className="bg-muted/50 hover:bg-muted/70 transition-colors rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-pointer border border-border/50 flex items-start gap-2"
                onClick={() => {
                  if (onExampleClick) {
                    onExampleClick(example);
                  } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(example);
                  }
                }}
                title={onExampleClick ? "Click to use this example" : "Click to copy to clipboard"}
              >
                <MessageCircle className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                <span>{example}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t border-primary/10">
        <p className="text-sm text-muted-foreground/70 text-center italic">
          {agentInfo.exampleUsage ? 'Click any example above to copy it, or send a message below' : 'Send a message below to start your conversation'}
        </p>
      </div>
    </div>
  );
}
