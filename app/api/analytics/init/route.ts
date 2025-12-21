import { NextRequest } from 'next/server';
import getDb from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json();
    if (!videoId) {
      return new Response(JSON.stringify({ error: 'Missing videoId' }), { status: 400 });
    }

    const db = await getDb();
    const coll = db.collection('video_analytics');

    const now = new Date();
    const emptyDoc = {
      videoId,
      counters: {
        views: 0,
        browsers: {},
        devices: {},
        geo: {},
        referrals: {},
      },
      createdAt: now,
      recent: [],
    };

    await coll.updateOne(
      { videoId },
      { $setOnInsert: emptyDoc },
      { upsert: true }
    );

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Init analytics error:', err);
    return new Response(JSON.stringify({ error: err?.message ?? 'unknown' }), { status: 500 });
  }
}
