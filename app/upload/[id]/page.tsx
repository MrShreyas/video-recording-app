"use client"

import UploadInterface from "@/components/upload-interface"
import { useParams } from "next/navigation"

export default function UploadPage() {
    const { id } = useParams<{ id: string }>()
  return (
    <div className="min-h-screen bg-background">
      <UploadInterface id={id} />
    </div>
  )
}
