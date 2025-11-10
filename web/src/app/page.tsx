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
        const allowed = ['my_agent', 'sequential_workflow', 'parallel_workflow', 'loop_workflow'];
        const filtered = apps.filter(a => allowed.includes(a));
        const agentList = filtered.length ? filtered : apps.filter(a => !a.startsWith('__'));
        setAgents(agentList);
        if (agentList.length) setSelectedAgent(agentList[0]);
      })
      .catch(console.error);
  }, []);

  // Handle agent change - clear chat and reset connection
  const handleAgentChange = (newAgent: string) => {
    setSelectedAgent(newAgent);
    setMessages([]);
    setConnected(false);
    setShowAgentInfo(true);
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
          try {
            const evt = JSON.parse(line.slice(6));
            
            // Handle error events from server
            if (evt.error === true) {
              // Remove loading bubble
              if (loadingMsgId) {
                setMessages(prev => prev.filter(m => m.id !== loadingMsgId));
                setLoadingMsgId(null);
              }
              
              // Format user-friendly error message
              let errorText = 'An error occurred';
              if (evt.status === 429) {
                errorText = '⚠️ Rate Limit Reached\n\nThe API rate limit has been exceeded. Please wait a moment and try again.\n\nIf this persists, check your Google Cloud quota settings.';
              } else if (evt.status === 401 || evt.status === 403) {
                errorText = '🔒 Authentication Error\n\nAPI key is invalid or missing. Please check your environment variables.';
              } else if (evt.status === 500) {
                errorText = '❌ Server Error\n\nThe agent encountered an internal error. Please try again or select a different agent.';
              } else if (evt.message) {
                errorText = `❌ Error (${evt.status || 'Unknown'})\n\n${evt.message}`;
                if (evt.details) {
                  errorText += `\n\nDetails: ${evt.details}`;
                }
              }
              
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
            
            // IMPORTANT: Only process streaming chunks (partial=true)
            // Skip consolidated messages that have no partial flag
            if (evt.partial !== true) {
              // Skip consolidated (non-partial) events during streaming
              continue;
            }
            
            // Process all partial events INCLUDING those with finishReason
            // (finishReason events contain the last chunk of text)
            
            // Extract text from partial chunk
            const chunk = evt.content.parts
              .map((p: any) => (p && typeof p === 'object' && typeof p.text === 'string') ? p.text : '')
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
  // [LOG REMOVED] request complete
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
