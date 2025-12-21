// Upload utility functions - UI only, implementation needed

import { getRecording } from "./indexeddb";
import { initializeAnalytics } from "./analytics-utils";

export async function uploadVideo(id: string): Promise<string> {
  const file = await getRecording(id)
  if (!file) throw new Error('Upload failed');
  const filename = `${Date.now()}`;
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType: file.type }),
  });
  const { url } = await res.json();
  const put = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  if (!put.ok) throw new Error('Upload failed');
  const s3Url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
  // Initialize empty analytics for the uploaded video
  await initializeAnalytics(filename);
  return s3Url;
}

export function generateShareLink(videoId: string): string {
  return `${process.env.NEXT_PUBLIC_APP_DOMAIN}/api/v/${videoId}`
}
