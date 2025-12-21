"use client"

import VideoEditor from "@/components/video-editor"
import { useParams } from "next/navigation"

export default function EditPage() {
  const { url } = useParams<{ url: string }>()
  return (
    <div className="min-h-screen bg-background">
      <VideoEditor recordingId={url} />
    </div>
  )
}
