"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Video, ArrowLeft, Circle, Square, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { startRecording, stopRecording, toggleMicrophone, getRecordingDuration } from "@/lib/recording-utils"
import { saveRecording } from "@/lib/indexeddb"

export default function RecordingInterface() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState("00:00")
  const [micEnabled, setMicEnabled] = useState(true)
  const [hasRecording, setHasRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  const handleStartRecording = async () => {
    await startRecording()
    setIsRecording(true)
    // start timer via effect
  }

  const handleStopRecording = async () => {
    const blob = await stopRecording()
    setIsRecording(false)
    const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : String(Date.now())
    try {
      await saveRecording(id, blob)
      // preview via object URL for immediate playback
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
      const url = URL.createObjectURL(blob)
      setRecordedUrl(url)
      setRecordingId(id)
      setHasRecording(true)
      return
    } catch (e) {
      console.warn('Failed to save recording to IndexedDB', e)
    }

    // fallback if save failed: use object URL without persistence
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    const url = URL.createObjectURL(blob)
    setRecordingId(url.split('/').pop() || null)
    setRecordedUrl(url)
    setHasRecording(true)
  }

  const handleToggleMic = () => {
    toggleMicrophone(!micEnabled)
    setMicEnabled(!micEnabled)
  }

  useEffect(() => {
    // start/stop interval to update recording time
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        const secs = getRecordingDuration()
        const mm = String(Math.floor(secs / 60)).padStart(2, '0')
        const ss = String(secs % 60).padStart(2, '0')
        setRecordingTime(`${mm}:${ss}`)
      }, 500)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      // reset displayed time when not recording
      if (!hasRecording) setRecordingTime('00:00')
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording, hasRecording])

  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    }
  }, [recordedUrl])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <Video className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">ScreenRec</span>
        </div>
      </div>

      {/* Recording Area */}
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 md:p-12 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center size-24 rounded-full bg-accent mb-6">
              <Video  className="size-12 text-accent-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-4">
              {isRecording ? "Recording in Progress" : hasRecording ? "Recording Complete" : "Start Screen Recording"}
            </h1>
            <p className="text-muted-foreground">
              {isRecording
                ? "Click stop when you're done recording"
                : hasRecording
                  ? "Your recording is ready for editing"
                  : "Click the button below to start capturing your screen"}
            </p>
          </div>

          {/* Recording Timer */}
          {isRecording && (
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20">
                <div className="size-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-2xl font-mono font-semibold">{recordingTime}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-4 justify-center items-center">
            {!isRecording && !hasRecording && (
              <>
                <Button size="lg" onClick={handleStartRecording} className="text-base gap-2">
                  <Circle className="size-5" />
                  Start Recording
                </Button>
                <Button
                  size="lg"
                  variant={micEnabled ? "outline" : "secondary"}
                  onClick={handleToggleMic}
                  className="gap-2"
                >
                  {micEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
                  {micEnabled ? "Mic On" : "Mic Off"}
                </Button>
              </>
            )}

            {isRecording && (
              <Button size="lg" variant="destructive" onClick={handleStopRecording} className="text-base gap-2">
                <Square className="size-5" />
                Stop Recording
              </Button>
            )}

            {hasRecording && (
              <>
              <div className="flex flex-col items-center gap-4 mt-8">
                {recordedUrl && (
                  <div className="w-full flex flex-col items-center">
                    <video src={recordedUrl} controls className="max-w-full rounded-md shadow" />
                    <a href={recordedUrl} download="screen-recording.webm" className="mt-2 text-sm text-primary">Download recording</a>
                  </div>
                )}
              </div>
              <>
                <Button asChild size="lg" className="text-base">
                  <Link href={recordingId ? `/edit/${recordingId}` : "/edit"}>Edit Video</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    if (recordedUrl) {
                      URL.revokeObjectURL(recordedUrl)
                      setRecordedUrl(null)
                    }
                    setHasRecording(false)
                    setRecordingTime('00:00')
                  }}
                >
                  Record Again
                </Button>
              </>
              </>
            )}
          </div>

          {/* Info */}
          {!isRecording && !hasRecording && (
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                You'll be prompted to select which screen or window to share
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
