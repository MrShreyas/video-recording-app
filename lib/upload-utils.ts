import { getRecording } from "./indexeddb";
import { initializeAnalytics } from "./analytics-utils";

export async function uploadVideo(id: string): Promise<string> {
  const file = await getRecording(id);
  if (!file) throw new Error("Upload failed");

  // Use a deterministic key (VERY IMPORTANT)
  const videoId = `${Date.now()}`;

  // 1️⃣ Get presigned upload URL
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: videoId,
      contentType: file.type,
    }),
  });

  if (!res.ok) throw new Error("Failed to get upload URL");
  const { url } = await res.json();

  // 2️⃣ Upload directly to S3
  const put = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!put.ok) throw new Error("Upload failed");

  // 3️⃣ Initialize analytics (backend call)
  await initializeAnalytics(videoId);

  // 4️⃣ RETURN CLOUD FRONT URL (NOT S3)
  const cdn = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
  if (!cdn) throw new Error("CDN domain not configured");

  return `${cdn}/${videoId}`;
}
