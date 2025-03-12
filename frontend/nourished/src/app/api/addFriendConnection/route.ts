import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, uid1, uid2 } = body;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/addFriendConnection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, uid1, uid2 }),
    });

    if (!response.ok) {
      throw new Error('Failed to add friend connection');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in addFriendConnection API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update friend connection' },
      { status: 500 }
    );
  }
} 