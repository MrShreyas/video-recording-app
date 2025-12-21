import { NextRequest } from 'next/server';
import getDb from '@/lib/mongodb';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const db = await getDb();
    const coll = db.collection('video_analytics');

    const doc = await coll.findOne({ videoId: id });
    if (!doc) {
      return new Response(JSON.stringify({ error: 'Analytics not found' }), { status: 404 });
    }

    // Clean up the response
    const { _id, ...analytics } = doc;
    return new Response(JSON.stringify(analytics), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Fetch analytics error:', err);
    return new Response(JSON.stringify({ error: err?.message ?? 'unknown' }), { status: 500 });
  }
}
