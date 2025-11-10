import { Bot, Zap, Users, RefreshCw, Sparkles, Brain, MessageSquare, Cpu, Globe, Workflow } from 'lucide-react';
import agentDescriptionsData from '@/data/agentDescriptions.json';

type AgentDescription = {
  title: string;
  description: string;
  features: string[];
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
}

export function AgentInfoBox({ selectedAgent }: AgentInfoBoxProps) {
  const agentInfo = AGENT_DESCRIPTIONS[selectedAgent];
  
  if (!agentInfo) return null;

  const Icon = getAgentIcon(selectedAgent);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
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
                <span className="text-primary mt-1">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-6 pt-6 border-t border-primary/10">
          <p className="text-sm text-muted-foreground/70 text-center italic">
            Send a message below to start your conversation
          </p>
        </div>
      </div>
    </div>
  );
}
