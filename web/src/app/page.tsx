'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Zap, Users, RefreshCw, Sparkles, Brain, MessageSquare, Cpu, Globe, Workflow } from 'lucide-react';

const API_BASE = '/api';

// Map agent names to icons (supports up to 10 different agents)
const AGENT_ICONS = [Bot, Zap, Users, RefreshCw, Sparkles, Brain, MessageSquare, Cpu, Globe, Workflow];

// Transform agent name: "loop_workflow" → "Loop Workflow"
const formatAgentName = (name: string) => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get icon for agent based on hash of name for consistency
const getAgentIcon = (agentName: string, index: number) => {
  const hash = agentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const iconIndex = hash % AGENT_ICONS.length;
  const Icon = AGENT_ICONS[iconIndex];
  return Icon;
};

interface Message {
  role: 'user' | 'agent' | 'system';
  text: string;
  author?: string;
  expanded?: boolean;
  id: string;
  loading?: boolean;
}

export default function ChatPage() {
  const [agents, setAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [user, setUser] = useState('demo');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loadingMsgId, setLoadingMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const authorBubbles = useRef<Map<string, number>>(new Map());

  // Initialize session ID on client only to avoid hydration mismatch
  useEffect(() => {
    setSessionId(`s_${Date.now()}`);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/list-apps`)
      .then(r => r.json())
      .then((apps: string[]) => {
        const allowed = ['my_agent', 'sequential_workflow', 'parallel_workflow', 'loop_workflow'];
        const filtered = apps.filter(a => allowed.includes(a));
        const agentList = filtered.length ? filtered : apps.filter(a => !a.startsWith('__'));
        setAgents(agentList);
        if (agentList.length) setSelectedAgent(agentList[0]);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connect = async () => {
    try {
      setMessages([{ role: 'system', text: 'Connecting...', id: `sys-${Date.now()}` }]);
      await fetch(`${API_BASE}/apps/${selectedAgent}/users/${user}/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createdAt: Date.now() })
      });
      setMessages([{ role: 'system', text: 'Connected. Session ready.', id: `sys-${Date.now()}` }]);
      setConnected(true);
      authorBubbles.current.clear();
    } catch (e) {
      setMessages([{ role: 'system', text: 'Connection failed.', id: `sys-${Date.now()}` }]);
      setConnected(false);
    }
  };

  const sendingRef = useRef(false);

  const send = async () => {
    if (!input.trim() || loading || sendingRef.current) return;
    
    sendingRef.current = true;
    const text = input.trim();
    setInput('');
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { role: 'user', text, id: userMsgId }]);
    setLoading(true);

    // Clear author tracking from previous query to allow new messages from same agents
    authorBubbles.current.clear();

    // Add a temporary loading bubble while we wait for first tokens
    const tempId = `loading_${Date.now()}`;
    setMessages(prev => [...prev, { role: 'agent', author: 'Thinking', text: '', loading: true, id: tempId }]);
    setLoadingMsgId(tempId);
    
    console.log('[SEND] Starting request for:', text);    try {
      const res = await fetch(`${API_BASE}/run_sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: selectedAgent,
          user_id: user,
          session_id: sessionId,
          new_message: { role: 'user', parts: [{ text }] },
          streaming: true
        })
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        for (let i = 0; i < parts.length - 1; i++) {
          const line = parts[i].split('\n').find(l => l.startsWith('data: '));
          if (!line) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            
            // Skip non-content events (state deltas, empty events, etc.)
            if (!evt?.content?.parts || !Array.isArray(evt.content.parts)) {
              continue;
            }
            
            // IMPORTANT: Only process partial (streaming) events, skip final consolidated messages
            // Final messages have finishReason and duplicate the full text
            const isPartialChunk = evt.partial === true;
            const isFinalMessage = evt.partial !== true && evt.finishReason;
            
            // Skip final consolidated messages - we already have the text from streaming
            if (isFinalMessage) {
              continue;
            }
            
            // Extract text from partial chunk
            const chunk = evt.content.parts
              .map((p: any) => (p && typeof p === 'object' && typeof p.text === 'string') ? p.text : '')
              .join('');
            
            if (!chunk) continue;
            
            const author = evt?.author || evt?.content?.role || 'model';
            console.log(`[SSE] Chunk from ${author}:`, chunk.substring(0, 20));
            
            // Remove loading bubble on first chunk
            if (loadingMsgId) {
              setMessages(prev => prev.filter(m => m.id !== loadingMsgId));
              setLoadingMsgId(null);
            }
            
            // Use ref-based tracking to merge messages from same author during streaming
            setMessages(prev => {
              const trackedIdx = authorBubbles.current.get(author);
              
              if (trackedIdx !== undefined && trackedIdx < prev.length && prev[trackedIdx].author === author) {
                // Update existing bubble for this author
                const updated = [...prev];
                updated[trackedIdx] = { 
                  ...updated[trackedIdx], 
                  text: (updated[trackedIdx].text || '') + chunk 
                };
                return updated;
              } else {
                // Create new bubble and track its index
                const newIdx = prev.length;
                const newMsgId = `agent-${author}-${Date.now()}-${newIdx}`;
                authorBubbles.current.set(author, newIdx);
                return [...prev, { role: 'agent', text: chunk, author, id: newMsgId }];
              }
            });
          } catch {}
        }
        buf = parts[parts.length - 1];
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', text: 'Error sending message.', id: `sys-err-${Date.now()}` }]);
    } finally {
      setLoading(false);
      sendingRef.current = false;
      // Ensure loading bubble is removed
      setMessages(prev => prev.filter(m => !m.loading));
      setLoadingMsgId(null);
      console.log('[SEND] Request complete');
      // Don't clear authorBubbles - we need to persist across streaming sessions
    }
  };

  // AnimatedText displays words progressively - memoized to prevent unnecessary re-renders
  const AnimatedText = memo(({ text, messageId }: { text: string; messageId: string }) => {
    const [displayText, setDisplayText] = useState('');
    const animatedLengthRef = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [messageId]);

    useEffect(() => {
      const target = text || '';
      const currentAnimated = animatedLengthRef.current;
      
      // If text is shorter or same length, just display it (shouldn't happen but safety check)
      if (target.length <= currentAnimated) {
        if (target.length < currentAnimated) {
          // Text got shorter (new message) - reset
          animatedLengthRef.current = 0;
          setDisplayText('');
        }
        return;
      }
      
      // Split into words for animation
      const words = target.split(/(\s+)/);
      const currentWords = target.slice(0, currentAnimated).split(/(\s+)/);
      let wordIndex = currentWords.length;
      
      // Clear any existing animation
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      // Animate new words
      const animateNextWord = () => {
        if (!isMountedRef.current) return;
        
        if (wordIndex < words.length) {
          const newText = words.slice(0, wordIndex + 1).join('');
          setDisplayText(newText);
          animatedLengthRef.current = newText.length;
          wordIndex++;
          timerRef.current = setTimeout(animateNextWord, 30);
        } else {
          setDisplayText(target);
          animatedLengthRef.current = target.length;
        }
      };
      
      // Start animation
      animateNextWord();

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [text]);

    return <span>{displayText || text}</span>;
  });

  const toggleExpand = (idx: number) => {
    setMessages(prev => {
      const updated = [...prev];
      updated[idx].expanded = !updated[idx].expanded;
      return updated;
    });
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      <aside className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="text-2xl font-semibold tracking-tight">ADK Agents</h1>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Agent</label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-full text-base">
                <SelectValue>
                  {selectedAgent && (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = getAgentIcon(selectedAgent, agents.indexOf(selectedAgent));
                        return <Icon className="w-4 h-4" />;
                      })()}
                      <span>{formatAgentName(selectedAgent)}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {agents.map((a, idx) => {
                  const Icon = getAgentIcon(a, idx);
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
              onChange={e => setUser(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Session</label>
            <input 
              className="w-full px-3 py-2.5 rounded-md bg-background border border-input text-base"
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
            />
          </div>
          <div className={agents.length > 0 && !connected ? 'connect-gradient rounded-lg' : ''}>
            <Button 
              onClick={connect} 
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
        <div className="flex-1 p-4">
          <h2 className="text-base font-medium mb-2">History</h2>
          <ScrollArea className="h-full">
            <div className="text-sm text-muted-foreground">Session: {sessionId}</div>
          </ScrollArea>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-3">
            {messages.map((msg, idx) => {
              const isShort = msg.role === 'user' && msg.text.length < 40 && !msg.loading;
              return (
              <div
                key={msg.id}
                className={`
                  flex w-full
                  ${msg.role === 'user' ? 'justify-end' : ''}
                  ${msg.role === 'agent' || msg.loading ? 'justify-start' : ''}
                  ${msg.role === 'system' ? 'justify-center' : ''}
                `}
              >
                <div
                  onClick={() => undefined}
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
                            const Icon = getAgentIcon(msg.author, 0);
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
            })}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border p-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input
              className="flex-1 px-5 py-3.5 rounded-full bg-muted border border-input text-base focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
            />
            <Button onClick={send} disabled={loading} size="icon" className="rounded-full h-14 w-14">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
