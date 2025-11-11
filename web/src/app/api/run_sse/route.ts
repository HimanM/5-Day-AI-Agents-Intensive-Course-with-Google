import { NextRequest } from 'next/server';

const ADK_SERVER = process.env.ADK_SERVER_URL || 'http://127.0.0.1:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${ADK_SERVER}/run_sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Try to get error details from response body
      let errorMessage = 'Failed to run agent';
      let errorDetails = '';
      
      try {
        const errorBody = await response.text();
        if (errorBody) {
          try {
            const errorJson = JSON.parse(errorBody);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
            errorDetails = errorJson.details || '';
          } catch {
            // Response wasn't JSON, use raw text
            errorMessage = errorBody.substring(0, 200); // Limit length
          }
        }
      } catch {}
      
      // Send error as SSE event so frontend can display it properly
      const errorEvent = {
        error: true,
        status: response.status,
        message: errorMessage,
        details: errorDetails
      };
      
      const errorStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
          controller.close();
        }
      });
      
      return new Response(errorStream, {
        status: 200, // Send 200 so SSE stream is readable
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Stream the SSE response back to client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) return;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (streamError) {
          // Handle streaming errors (e.g., connection dropped)
          console.error('Stream error:', streamError);
          const encoder = new TextEncoder();
          const errorEvent = {
            error: true,
            status: 500,
            message: 'Stream connection error',
            details: streamError instanceof Error ? streamError.message : 'Unknown error'
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in SSE proxy:', error);
    
    // Send error as SSE event
    const errorEvent = {
      error: true,
      status: 500,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    
    const errorStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
        controller.close();
      }
    });
    
    return new Response(errorStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}
