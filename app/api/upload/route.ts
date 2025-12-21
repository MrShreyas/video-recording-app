import { NextRequest } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const filename = body?.filename;
    const contentType = body?.contentType;

    if (!filename || !contentType) {
      return new Response(JSON.stringify({ error: 'Missing filename or contentType' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      ContentType: contentType,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 900 });
    return new Response(JSON.stringify({ url }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Presign error:', err);
    const message = typeof err === 'string' ? err : err?.message ?? 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
