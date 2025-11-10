import { NextRequest, NextResponse } from 'next/server';

const ADK_SERVER = process.env.ADK_SERVER_URL || 'http://127.0.0.1:8080';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const response = await fetch(`${ADK_SERVER}/debug/trace/session/${sessionId}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch trace: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching trace:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trace data' },
      { status: 500 }
    );
  }
}
