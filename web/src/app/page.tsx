'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatContainer, ChatContainerRef } from '@/components/chat/ChatContainer';
import { ChatInput } from '@/components/chat/ChatInput';
import { Footer } from '@/components/chat/Footer';

const API_BASE = '/api';

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
  const [showAgentInfo, setShowAgentInfo] = useState(true);
  const [traceFetchTrigger, setTraceFetchTrigger] = useState(0);
  const authorBubbles = useRef<Map<string, number>>(new Map());
  const sendingRef = useRef(false);
  const chatContainerRef = useRef<ChatContainerRef>(null);

  // Initialize session ID on client only to avoid hydration mismatch
  useEffect(() => {
    setSessionId(`s_${Date.now()}`);
  }, []);

  // Fetch available agents
  useEffect(() => {
    fetch(`${API_BASE}/list-apps`)
      .then(r => r.json())
      .then((apps: string[]) => {
        const allowed = ['my_agent', 'sequential_workflow', 'parallel_workflow', 'loop_workflow', 'currency_converter', 'mcp_generator'];
        const filtered = apps.filter(a => allowed.includes(a));
        const agentList = filtered.length ? filtered : apps.filter(a => !a.startsWith('__'));
        setAgents(agentList);
        if (agentList.length) setSelectedAgent(agentList[0]);
      })
      .catch(console.error);
  }, []);

  // Handle agent change - clear chat and reset connection
  const handleAgentChange = async (newAgent: string) => {
    // Disconnect previous agent session if connected
    if (connected && selectedAgent && sessionId) {
      try {
        await fetch(`${API_BASE}/apps/${selectedAgent}/users/${user}/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        console.error('Failed to disconnect previous session:', e);
      }
    }
    
    setSelectedAgent(newAgent);
    setMessages([]);
    setConnected(false);
    setShowAgentInfo(true);
    setTraceFetchTrigger(0); // Reset trace trigger to clear invocations
    setSessionId(`s_${Date.now()}`); // Generate new session ID for new agent
    authorBubbles.current.clear();
  };

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

  const send = async () => {
    if (!input.trim() || loading || sendingRef.current) return;
    
    sendingRef.current = true;
    const text = input.trim();
    setInput('');
    setShowAgentInfo(false); // Hide agent info when user sends first message
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { role: 'user', text, id: userMsgId }]);
    setLoading(true);
    
    // Clear tracking for new request
    authorBubbles.current.clear();
    // Reset trace data for new invocation
    setTraceFetchTrigger(0);
    
    // Show loading bubble
    const tempId = `loading_${Date.now()}`;
    setMessages(prev => [...prev, { role: 'agent', text: '', loading: true, id: tempId }]);
    setLoadingMsgId(tempId);
    
  // [LOG REMOVED] start request log removed for cleaner console output
    try {
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
          
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;

          // If the server for some reason emits a raw data: URL (e.g. "data:image/.."),
          // handle it directly instead of trying to JSON.parse it.
          if (dataStr.startsWith('data:')) {
            // Sanitize base64 payload (remove whitespace/newlines) to avoid ERR_INVALID_URL
            const sanitizedUrl = dataStr.replace(/\s+/g, '');
            // Remove loading bubble
            if (loadingMsgId) {
              setMessages(prev => prev.filter(m => m.id !== loadingMsgId));
              setLoadingMsgId(null);
            }

            const author = 'model';
            const chunk = `<img src="${sanitizedUrl}" alt="Generated image" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin: 8px 0;" />`;

            // Merge or append like other chunks
            setMessages(prev => {
              const trackedIdx = authorBubbles.current.get(author);
              if (trackedIdx !== undefined && trackedIdx < prev.length && prev[trackedIdx].author === author) {
                const updated = [...prev];
                updated[trackedIdx] = { ...updated[trackedIdx], text: (updated[trackedIdx].text || '') + chunk };
                return updated;
              } else {
                const newIdx = prev.length;
                const newMsgId = `agent-${author}-${Date.now()}-${newIdx}`;
                authorBubbles.current.set(author, newIdx);
                return [...prev, { role: 'agent', text: chunk, author, id: newMsgId }];
              }
            });

            continue;
          }

          // Quick guard: only attempt JSON.parse if it looks like JSON
          if (dataStr[0] !== '{' && dataStr[0] !== '[') {
            // Not JSON; ignore noisy/non-JSON SSE lines
            continue;
          }

          try {
            const evt = JSON.parse(dataStr);
            
            // Handle error events from server (evt.error may be boolean, string, or object)
            if (evt.error) {
              // Remove loading bubble
              if (loadingMsgId) {
                setMessages(prev => prev.filter(m => m.id !== loadingMsgId));
                setLoadingMsgId(null);
              }

              // Helper to extract a readable error message from messy server payloads
              const formatServerError = (raw: any) => {
                // If server provided structured status, prefer that
                if (evt.status === 429 || /429|Too Many Requests/i.test(String(raw))) {
                  return '⚠️ Rate Limit Reached\n\nThe API rate limit has been exceeded. Please wait a moment and try again.\n\nIf this persists, check your Google Cloud quota settings.';
                }

                // If raw is an object, try to use its message fields
                if (raw && typeof raw === 'object') {
                  if (raw.message) return `❌ Error\n\n${String(raw.message)}`;
                  try { return `❌ Error\n\n${JSON.stringify(raw, null, 2)}`; } catch (e) { return String(raw); }
                }

                // If raw is a string, try to find nested JSON and extract meaningful bits
                if (typeof raw === 'string') {
                  // Quick patterns for common cases
                  if (/Too Many Requests|RESOURCE_EXHAUSTED|429/.test(raw)) {
                    return '⚠️ Rate Limit Reached\n\nThe API rate limit has been exceeded. Please wait a moment and try again.\n\nIf this persists, check your Google Cloud quota settings.';
                  }

                  // Try to extract the first JSON-looking substring
                  const m = raw.match(/\{[\s\S]*\}/);
                  if (m) {
                    const jsonStr = m[0];
                    try {
                      const parsed = JSON.parse(jsonStr);
                      // If nested message field contains another JSON string, try to parse it
                      if (parsed?.error) {
                        try {
                          return `❌ Error\n\n${JSON.stringify(parsed.error, null, 2)}`;
                        } catch (e) {
                          return `❌ Error\n\n${String(parsed.error)}`;
                        }
                      }
                      if (parsed?.message) return `❌ Error\n\n${String(parsed.message)}`;
                      return `❌ Error\n\n${JSON.stringify(parsed, null, 2)}`;
                    } catch (e) {
                      // Not valid JSON - fall back to presenting cleaned string
                      const cleaned = raw.replace(/\s+/g, ' ');
                      return `❌ Error\n\n${cleaned}`;
                    }
                  }

                  // Fallback: return the raw string
                  return `❌ Error\n\n${raw}`;
                }

                return '❌ Error\n\nAn unknown error occurred.';
              };

              const errorText = formatServerError(evt.error || evt.message || evt);

              setMessages(prev => [...prev, {
                role: 'system',
                text: errorText,
                id: `sys-err-${Date.now()}`
              }]);

              // Stop processing this stream
              break;
            }
            
            // Skip non-content events (state deltas, empty events, etc.)
            if (!evt?.content?.parts || !Array.isArray(evt.content.parts)) {
              continue;
            }
            
            // IMPORTANT: Prefer streaming chunks (partial=true) but also
            // accept non-partial events if they contain image/functionResponse
            const isPartial = evt.partial === true;
            const hasImagePart = Array.isArray(evt.content.parts) && evt.content.parts.some((p: any) => {
              if (!p) return false;
              if (p.type === 'image') return true;
              // functionResponse may carry nested content with images
              if (p.functionResponse && Array.isArray(p.functionResponse.response?.content)) {
                return p.functionResponse.response.content.some((inner: any) => inner?.type === 'image');
              }
              return false;
            });

            if (!isPartial && !hasImagePart) {
              // Skip consolidated (non-partial) events that do not contain images
              continue;
            }
            
            // Process all partial events INCLUDING those with finishReason
            // (finishReason events contain the last chunk of text)
            
            // Extract text and images from partial or image-containing chunk
            const chunk = evt.content.parts
              .map((p: any) => {
                if (!p || typeof p !== 'object') return '';

                // If the part is a functionResponse, unpack its response.content
                if (p.functionResponse && Array.isArray(p.functionResponse.response?.content)) {
                  return p.functionResponse.response.content.map((inner: any) => {
                    if (!inner) return '';
                    if (typeof inner.text === 'string') return inner.text;
                    if (inner.type === 'image' && inner.data && inner.mimeType) {
                      const payload = String(inner.data).replace(/\s+/g, '');
                      return `<img src="data:${inner.mimeType};base64,${payload}" alt="Generated image" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin: 8px 0;" />`;
                    }
                    return '';
                  }).join('');
                }

                if (typeof p.text === 'string') return p.text;
                if (p.type === 'image' && p.data && p.mimeType) {
                  const payload = String(p.data).replace(/\s+/g, '');
                  return `<img src="data:${p.mimeType};base64,${payload}" alt="Generated image" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin: 8px 0;" />`;
                }

                return '';
              })
              .join('');
            
            if (!chunk) continue;
            
            const author = evt?.author || evt?.content?.role || 'model';
            
            // Extract grounding metadata if present (usually comes with finishReason)
            const groundingMetadata = evt?.groundingMetadata ? {
              webSearchQueries: evt.groundingMetadata.webSearchQueries,
              searchEntryPoint: evt.groundingMetadata.searchEntryPoint
            } : undefined;
            
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
                  text: (updated[trackedIdx].text || '') + chunk,
                  // Add or update grounding metadata if present
                  ...(groundingMetadata ? { groundingMetadata } : {})
                };
                return updated;
              } else {
                // Create new bubble and track its index
                const newIdx = prev.length;
                const newMsgId = `agent-${author}-${Date.now()}-${newIdx}`;
                authorBubbles.current.set(author, newIdx);
                return [...prev, { 
                  role: 'agent', 
                  text: chunk, 
                  author, 
                  id: newMsgId,
                  ...(groundingMetadata ? { groundingMetadata } : {})
                }];
              }
            });
          } catch (parseError) {
            // Failed to parse event JSON - log but continue
            console.error('Failed to parse SSE event:', parseError);
          }
        }
        buf = parts[parts.length - 1];
      }
    } catch (e) {
      // Remove loading bubble
      if (loadingMsgId) {
        setMessages(prev => prev.filter(m => m.id !== loadingMsgId));
        setLoadingMsgId(null);
      }
      
      // Display network/connection error
      const errorMessage = e instanceof Error 
        ? `❌ Connection Error\n\n${e.message}\n\nPlease check your network connection and try again.`
        : '❌ Connection Error\n\nFailed to communicate with the agent. Please try again.';
      
      setMessages(prev => [...prev, { 
        role: 'system', 
        text: errorMessage, 
        id: `sys-err-${Date.now()}` 
      }]);
    } finally {
      setLoading(false);
      sendingRef.current = false;
      // Ensure loading bubble is removed
      setMessages(prev => prev.filter(m => !m.loading));
      setLoadingMsgId(null);
      // Trigger trace fetch after agent finishes responding
      console.log('[TRACE TRIGGER] Incrementing traceFetchTrigger');
      setTraceFetchTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
      <Sidebar
        agents={agents}
        selectedAgent={selectedAgent}
        onAgentChange={handleAgentChange}
        user={user}
        onUserChange={setUser}
        sessionId={sessionId}
        onSessionChange={setSessionId}
        connected={connected}
        onConnect={connect}
        traceFetchTrigger={traceFetchTrigger}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatContainer
          ref={chatContainerRef}
          messages={messages}
          connected={connected}
          showAgentInfo={showAgentInfo}
          selectedAgent={selectedAgent}
        />
        
        <ChatInput
          input={input}
          onInputChange={setInput}
          onSend={send}
          loading={loading}
          scrollContainerRef={chatContainerRef.current?.containerRef}
        />
        
        <Footer />
      </main>
    </div>
  );
}
