import { NextResponse } from 'next/server';

const ADK_SERVER = process.env.ADK_SERVER_URL || 'http://127.0.0.1:8080';

export async function GET() {
  try {
    const response = await fetch(`${ADK_SERVER}/list-apps`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching apps:', error);
    return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
  }
}
