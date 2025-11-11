'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Loader2, MessageSquare, User } from 'lucide-react';

interface SpanData {
  name: string;
  span_id: number;
  trace_id: number;
  start_time: number;
  end_time: number;
  attributes?: Record<string, any>;
  parent_span_id: number | null;
}

interface TraceResponse {
  value: SpanData[];
  Count: number;
}

interface InvocationNode {
  id: string;
  name: string;
  duration_ms: number;
  agent_name?: string;
  children: InvocationNode[];
}

interface InvocationsViewerProps {
  sessionId: string;
  connected: boolean;
  fetchTrigger: number; // Incremented when agent finishes to trigger fetch
}

export function InvocationsViewer({ sessionId, connected, fetchTrigger }: InvocationsViewerProps) {
  const [traceData, setTraceData] = useState<InvocationNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree from flat span array
  const buildTree = (spans: SpanData[]): InvocationNode[] => {
    const spanMap = new Map<number, InvocationNode>();
    const roots: InvocationNode[] = [];

    // First pass: create all nodes
    spans.forEach(span => {
      const duration_ms = (span.end_time - span.start_time) / 1_000_000; // nanoseconds to milliseconds
      const agent_name = span.attributes?.['gen_ai.agent.name'] as string | undefined;
      
      const node: InvocationNode = {
        id: String(span.span_id),
        name: span.name,
        duration_ms,
        agent_name,
        children: []
      };
      
      spanMap.set(span.span_id, node);
    });

    // Second pass: build parent-child relationships
    spans.forEach(span => {
      const node = spanMap.get(span.span_id)!;
      
      if (span.parent_span_id === null) {
        roots.push(node);
      } else {
        const parent = spanMap.get(span.parent_span_id);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    // Sort children by start time
    const sortChildren = (node: InvocationNode) => {
      node.children.sort((a, b) => {
        const spanA = spans.find(s => String(s.span_id) === a.id);
        const spanB = spans.find(s => String(s.span_id) === b.id);
        return (spanA?.start_time || 0) - (spanB?.start_time || 0);
      });
      node.children.forEach(sortChildren);
    };
    roots.forEach(sortChildren);

    return roots;
  };

  useEffect(() => {
    console.log('[TRACE EFFECT] Effect triggered, connected:', connected, 'sessionId:', sessionId, 'fetchTrigger:', fetchTrigger);
    
    if (!connected || !sessionId) {
      console.log('[TRACE EFFECT] Skipping - not connected or no sessionId');
      setTraceData([]); // Clear data when disconnected
      return;
    }
    
    if (fetchTrigger === 0) {
      console.log('[TRACE EFFECT] Clearing trace data - fetchTrigger is 0');
      setTraceData([]); // Clear previous invocations
      return;
    }

    const fetchTrace = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[TRACE] Fetching trace for session:', sessionId);
        const res = await fetch(`/api/debug/trace/session/${sessionId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch trace data (${res.status})`);
        }
        const data: any = await res.json();
        console.log('[TRACE] Received data:', data);
        console.log('[TRACE] Is array?:', Array.isArray(data));
        console.log('[TRACE] data.value?:', data.value);
        
        // Handle both formats: direct array or wrapped in { value: [...] }
        const spans = Array.isArray(data) ? data : (data.value || []);
        console.log('[TRACE] spans length:', spans.length);
        
        if (spans.length > 0) {
          const tree = buildTree(spans);
          console.log('[TRACE] Built tree with', tree.length, 'root nodes');
          setTraceData(tree);
          
          // Auto-expand root nodes
          const rootIds = tree.map(n => n.id);
          setExpandedNodes(new Set(rootIds));
        } else {
          console.log('[TRACE] No spans in response');
        }
      } catch (err: any) {
        console.error('[TRACE] Error:', err);
        setError(err.message || 'Failed to load trace data');
      } finally {
        setLoading(false);
      }
    };

    fetchTrace();
  }, [sessionId, connected, fetchTrigger]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const renderNode = (node: InvocationNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const indent = depth * 20;
    const isAgentInvoke = node.name.startsWith('invoke_agent');
    const isLLMCall = node.name === 'call_llm';

    return (
      <div key={node.id} className="text-xs">
        <div 
          className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded cursor-pointer group"
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )
            ) : (
              <div className="w-3 h-3" />
            )}
          </div>

          {/* Icon based on type */}
          <div className="shrink-0">
            {isAgentInvoke ? (
              <User className="w-3.5 h-3.5 text-blue-500" />
            ) : isLLMCall ? (
              <MessageSquare className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>

          {/* Node Info */}
          <div className="flex-1 min-w-0 flex items-baseline gap-2">
            <span className="font-mono text-foreground truncate">
              {node.name}
            </span>
            {node.agent_name && (
              <span className="text-muted-foreground truncate">
                {node.agent_name}
              </span>
            )}
          </div>

          {/* Duration */}
          <div className="shrink-0 text-muted-foreground font-mono">
            {formatDuration(node.duration_ms)}
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="ml-0">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        <div className="text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Connect to an agent to view invocations</p>
        </div>
      </div>
    );
  }

  if (loading && !traceData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 text-xs p-4 text-center">
        {error}
      </div>
    );
  }

  if (!traceData || traceData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        <div className="text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No invocations yet</p>
          <p className="text-xs mt-1 opacity-70">Send a message to see the trace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background rounded-lg border border-border">
      <div className="sticky top-0 bg-background border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground z-10">
        Invocation Trace
      </div>
      <div className="p-2">
        {traceData.map(root => renderNode(root))}
      </div>
    </div>
  );
}
