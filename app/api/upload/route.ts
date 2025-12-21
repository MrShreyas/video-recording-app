import { NextRequest } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import getDb from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const filename = `${Date.now()}-${file.name}`;
    const contentType = file.type;

    const region = process.env.AWS_REGION;
    const bucket = process.env.S3_BUCKET;
    if (!region || !bucket) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: AWS_REGION or S3_BUCKET not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clientConfig: any = { region };
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }

    const client = new S3Client(clientConfig);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    });

    await client.send(command);

    // Initialize analytics
    const db = await getDb();
    const coll = db.collection('video_analytics');
    const now = new Date();
    const emptyDoc = {
      videoId: filename,
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
      { videoId: filename },
      { $setOnInsert: emptyDoc },
      { upsert: true }
    );

    // Return shareable URL
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
    if (!appDomain) {
      return new Response(JSON.stringify({ error: 'App domain not configured' }), { status: 500 });
    }
    const shareableUrl = `${appDomain}/api/v/${filename}`;

    return new Response(JSON.stringify({ shareableUrl }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Upload error:', err);
    const message = typeof err === 'string' ? err : err?.message ?? 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
