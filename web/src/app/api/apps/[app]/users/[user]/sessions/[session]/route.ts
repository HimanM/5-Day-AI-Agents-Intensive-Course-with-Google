import { NextRequest, NextResponse } from 'next/server';

const ADK_SERVER = process.env.ADK_SERVER_URL || 'http://127.0.0.1:8080';

type Params = {
  app: string;
  user: string;
  session: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { app, user, session } = await context.params;
  
  try {
    const response = await fetch(
      `${ADK_SERVER}/apps/${app}/users/${user}/sessions/${session}`,
      { method: 'POST' }
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { app, user, session } = await context.params;
  
  try {
    const response = await fetch(
      `${ADK_SERVER}/apps/${app}/users/${user}/sessions/${session}`
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { app, user, session } = await context.params;
  
  try {
    const response = await fetch(
      `${ADK_SERVER}/apps/${app}/users/${user}/sessions/${session}`,
      { method: 'DELETE' }
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
