import { getRecording } from "./indexeddb";
import { initializeAnalytics } from "./analytics-utils";

export async function uploadVideo(id: string): Promise<string> {
  const file = await getRecording(id);
  if (!file) throw new Error("Upload failed");

  // Create FormData to send the file
  const formData = new FormData();
  formData.append('file', file);

  // Send to API for upload
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Failed to upload');

  const { shareableUrl } = await res.json();
  return shareableUrl;
}
