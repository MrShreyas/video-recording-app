"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, Check, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { uploadVideo, generateShareLink } from "@/lib/upload-utils"

export default function UploadInterface({id} : {id: string}) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [copied, setCopied] = useState(false)

  const handleUpload = async () => {
    setIsUploading(true)
    setUploadProgress(0)

    // keep a simple progress ping for UX while the upload runs
    const interval = setInterval(() => setUploadProgress((p) => Math.min(95, p + 10)), 300)

    try {
      const s3Url = await uploadVideo(id)
      const key = s3Url.split('/').pop() || id
      const publicUrl = generateShareLink(key)
      clearInterval(interval)
      setUploadProgress(100)
      setIsUploading(false)
      setIsComplete(true)
      setShareUrl(publicUrl)
    } catch (err) {
      clearInterval(interval)
      console.error('Upload failed', err)
      setIsUploading(false)
      setUploadProgress(0)
      // optionally: show error UI
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/edit"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Editor
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Your Video</h1>

        <Card className="p-8">
          {!isUploading && !isComplete && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center size-20 rounded-full bg-accent mb-6">
                <Upload className="size-10 text-accent-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">Ready to Upload</h2>
              <p className="text-muted-foreground mb-8">Upload your video to get a shareable link with analytics</p>
              <Button size="lg" onClick={handleUpload} className="gap-2">
                <Upload className="size-5" />
                Upload Video
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center size-20 rounded-full bg-accent mb-6 animate-pulse">
                  <Upload className="size-10 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">Uploading...</h2>
                <p className="text-muted-foreground mb-6">Please wait while we upload your video</p>
              </div>
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-center text-sm text-muted-foreground">{uploadProgress}% complete</p>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center size-20 rounded-full bg-green-500/10 border-2 border-green-500 mb-6">
                  <Check className="size-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">Upload Complete!</h2>
                <p className="text-muted-foreground mb-8">Your video is ready to share</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Share Link</label>
                  <div className="flex gap-2">
                    <Input value={shareUrl} readOnly className="font-mono text-sm" />
                    <Button onClick={handleCopy} variant="outline" className="shrink-0 bg-transparent">
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild className="flex-1 gap-2">
                    <Link href={`/watch/${shareUrl.split("/").pop()}`}>
                      <ExternalLink className="size-4" />
                      View Video
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 bg-transparent">
                    <Link href={`/analytics/${shareUrl.split("/").pop()}`}>View Analytics</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
