import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/mongodb';

function parseReferrer(referer: string | null) {
  if (!referer) return 'direct';
  try {
    const u = new URL(referer);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return referer.slice(0, 100);
  }
}

function parseDevice(ua: string) {
  const uaLower = ua.toLowerCase();
  if (/mobile|iphone|android/.test(uaLower)) return 'mobile';
  if (/ipad|tablet/.test(uaLower)) return 'tablet';
  return 'desktop';
}

function parseBrowser(ua: string) {
  if (!ua) return 'unknown';
  if (ua.includes('Firefox')) return 'firefox';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
  if (ua.includes('Edg') || ua.includes('Edge')) return 'edge';
  if (ua.includes('OPR') || ua.includes('Opera')) return 'opera';
  return 'other';
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const headers = req.headers;
    const referer = parseReferrer(headers.get('referer'));
    const ua = headers.get('user-agent') || '';
    const device = parseDevice(ua);
    const browser = parseBrowser(ua);
    const ip = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
    const country = (headers.get('cf-ipcountry') || headers.get('x-country') || 'unknown').toUpperCase();

    const db = await getDb();
    const coll = db.collection('video_analytics');

    const now = new Date();
    const recentEntry = { ts: now, ip, device, browser, referer, country };

    // sanitize dynamic keys: replace dots
    const safeRef = referer.replace(/\./g, '_');
    const safeCountry = country || 'unknown';

    const update: any = {
      $inc: {
        'counters.views': 1,
        [`counters.devices.${device}`]: 1,
        [`counters.browsers.${browser}`]: 1,
        [`counters.referrals.${safeRef}`]: 1,
        [`counters.geo.${safeCountry}`]: 1,
      },
      $setOnInsert: { videoId: id, createdAt: now },
      $push: { recent: { $each: [recentEntry], $slice: -200 } },
    };

    await coll.updateOne({ videoId: id }, update, { upsert: true });

    // Redirect to /watch/id with 302
    return NextResponse.redirect(new URL(`/watch/${id}`, req.url), 302);
  } catch (err: any) {
    console.error('Analytics update error:', err);
    // On error, still redirect or return error? Probably redirect to avoid breaking
    return NextResponse.redirect(new URL(`/watch/${params.id}`, req.url), 302);
  }
}
