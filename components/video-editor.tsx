"use client"

import { useEffect, useRef, useState } from "react"
import { getRecording, deleteRecording, saveRecording } from "@/lib/indexeddb"
import Link from "next/link"
import { ArrowLeft, Scissors, Download, Upload, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { trimVideo, exportVideo } from "@/lib/video-utils"

export default function VideoEditor({ recordingId }: { recordingId?: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(120)
  const [isExporting, setIsExporting] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleTrim = async () => {
    try {
      if (!recordingId) {
        console.warn('No recordingId available for trim')
        return
      }
      const blob = await trimVideo(recordingId, trimStart, trimEnd)
      // save trimmed video back to IndexedDB
      await saveRecording(recordingId, blob)
      // replace preview with trimmed result
      const url = URL.createObjectURL(blob)
      setVideoSrc(url)
      setDuration(Math.floor((trimEnd - trimStart) || 0))
      setCurrentTime(0)
    } catch (e) {
      console.error('Trim failed', e)
    }
  }

  const handleExport = async (format: "webm" | "mp4") => {
    if (!recordingId) {
      console.warn('No recordingId available for export')
      return
    }
    setIsExporting(true)
    try {
      const blob = await exportVideo(videoSrc, format)
      const url = URL.createObjectURL(blob)
      // trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = `recording.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setIsExporting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (!recordingId) return
    let mounted = true
    ;(async () => {
      try {
        const blob = await getRecording(recordingId)
        if (!mounted) return
        if (blob) {
          // create object URL for playback
          const url = URL.createObjectURL(blob)
          setVideoSrc(url)
        }
      } catch (e) {
        console.warn('Could not load recording from IndexedDB', e)
      }
    })()
    return () => { mounted = false }
  }, [recordingId])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onLoaded = () => {
      setDuration(Math.floor(v.duration || 0))
      setTrimEnd(Math.floor(v.duration || 0))
    }
    const onTime = () => setCurrentTime(Math.floor(v.currentTime || 0))
    v.addEventListener('loadedmetadata', onLoaded)
    v.addEventListener('timeupdate', onTime)
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded)
      v.removeEventListener('timeupdate', onTime)
    }
  }, [videoSrc])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/record"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Recording
        </Link>
        <Button asChild>
          <Link href="/upload">Continue to Upload</Link>
        </Button>
      </div>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Your Recording</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <Card className="lg:col-span-2 p-6">
            <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center">
              {videoSrc ? (
                <video ref={videoRef} src={videoSrc} controls className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <Play className="size-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Video Preview</p>
                </div>
              )}
            </div>

            {/* Video Controls */}
            <div className="space-y-4">

              {/* Trim Controls */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Trim Start</label>
                  <span className="text-sm font-mono">{formatTime(trimStart)}</span>
                </div>
                <Slider value={[trimStart]} max={duration} step={1} onValueChange={(value) => setTrimStart(value[0])} />

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Trim End</label>
                  <span className="text-sm font-mono">{formatTime(trimEnd)}</span>
                </div>
                <Slider value={[trimEnd]} max={duration} step={1} onValueChange={(value) => setTrimEnd(value[0])} />

                <Button onClick={handleTrim} className="w-full gap-2">
                  <Scissors className="size-4" />
                  Apply Trim
                </Button>
              </div>
            </div>
          </Card>

          {/* Export Options */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Export Options</h2>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-medium mb-2">Duration</h3>
                <p className="text-2xl font-mono">{formatTime(trimEnd - trimStart)}</p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-medium mb-3">Export Format</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 bg-transparent"
                    onClick={() => handleExport("webm")}
                    disabled={isExporting}
                  >
                    <Download className="size-4" />
                    Export as WebM
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 bg-transparent"
                    onClick={() => handleExport("mp4")}
                    disabled={isExporting}
                  >
                    <Download className="size-4" />
                    Export as MP4
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <Button asChild className="w-full gap-2" size="lg">
                  <Link href={recordingId ? `/upload/${recordingId}` : "/upload"}> 
                    <Upload className="size-4" />
                    Upload & Share
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
