import { NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Proxies AI chat requests to the NestJS backend (`/api/ai/chat`).
 * The backend uses OpenRouter (`openrouter/auto`) when OPENROUTER_API_KEY is
 * set, or returns a graceful demo-mode reply otherwise. Response shape: { content }.
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const auth = req.headers.get('authorization') || '';
    const cookie = req.headers.get('cookie') || '';

    const res = await fetch(`${BACKEND}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'You are WeConnect AI, a helpful assistant built into a WhatsApp-like messaging app. Be concise and conversational.',
          },
          ...(Array.isArray(messages) ? messages : []),
        ],
      }),
    });

    const txt = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: `AI backend returned ${res.status}`, detail: txt },
        { status: res.status },
      );
    }
    const data = JSON.parse(txt);
    return NextResponse.json({ content: data.reply || '' });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'AI proxy failed', detail: e?.message },
      { status: 500 },
    );
  }
}