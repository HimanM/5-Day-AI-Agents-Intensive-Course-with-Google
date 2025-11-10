import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface SidebarProps {
  agents: string[];
  selectedAgent: string;
  onAgentChange: (agent: string) => void;
  user: string;
  onUserChange: (user: string) => void;
  sessionId: string;
  onSessionChange: (session: string) => void;
  connected: boolean;
  onConnect: () => void;
}

export function Sidebar({
  agents,
  selectedAgent,
  onAgentChange,
  user,
  onUserChange,
  sessionId,
  onSessionChange,
  connected,
  onConnect,
}: SidebarProps) {
  return (
    <aside className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-2xl font-semibold tracking-tight">ADK Agents</h1>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Agent</label>
          <Select value={selectedAgent} onValueChange={onAgentChange}>
            <SelectTrigger className="w-full text-base">
              <SelectValue>
                {selectedAgent && (
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getAgentIcon(selectedAgent);
                      return <Icon className="w-4 h-4" />;
                    })()}
                    <span>{formatAgentName(selectedAgent)}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {agents.map((a) => {
                const Icon = getAgentIcon(a);
                return (
                  <SelectItem key={a} value={a}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{formatAgentName(a)}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">User</label>
          <input 
            className="w-full px-3 py-2.5 rounded-md bg-background border border-input text-base"
            value={user}
            onChange={e => onUserChange(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Session</label>
          <input 
            className="w-full px-3 py-2.5 rounded-md bg-background border border-input text-base"
            value={sessionId}
            onChange={e => onSessionChange(e.target.value)}
          />
        </div>
        <div className={agents.length > 0 && !connected ? 'connect-gradient rounded-lg' : ''}>
          <Button 
            onClick={onConnect} 
            className="w-full text-base py-6 rounded-lg"
            disabled={connected || !selectedAgent || !user || !sessionId}
          >
            {connected ? 'Connected' : (agents.length > 0 ? 'Connect to Agent' : 'Loading...')}
          </Button>
        </div>
        {!connected && (
          <div className="text-xs mt-1.5 text-muted-foreground opacity-80 text-center">
            Tip: click Connect to start the session before sending messages.
          </div>
        )}
      </div>
      <div className="flex-1 p-4 overflow-hidden">
        <h2 className="text-base font-medium mb-2">History</h2>
        <div className="text-sm text-muted-foreground">Session: {sessionId}</div>
      </div>
    </aside>
  );
}
