// Recording utility functions - UI only, implementation needed

let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []
let localStream: MediaStream | null = null
// Screen recording globals (moved here to avoid TDZ when functions are called)
let screenRecorder: MediaRecorder | null = null
let screenChunks: Blob[] = []
let screenStream: MediaStream | null = null
let screenMicStream: MediaStream | null = null
let screenTrackEndHandlers: Array<{ track: MediaStreamTrack; handler: EventListenerOrEventListenerObject }> = []
let screenStartTime: number | null = null

function chooseMimeType() {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  for (const t of types) {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

export async function startRecording(): Promise<void> {
  // TODO: Initialize MediaRecorder API
  // TODO: Request screen capture permission
  // TODO: Request microphone permission if enabled
  // TODO: Start recording stream
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    alert('getDisplayMedia is not supported in this browser')
    return
  }

  try {
    // request display stream (may include system audio if browser supports it)
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    // preview.srcObject = screenStream

    // if the user stops sharing via browser UI, stop the recorder and finalize
    screenTrackEndHandlers = []
    screenStream.getTracks().forEach((t) => {
      const onEnded = () => {
        if (screenRecorder && screenRecorder.state !== 'inactive') screenRecorder.stop()
      }
      t.addEventListener('ended', onEnded)
      screenTrackEndHandlers.push({ track: t, handler: onEnded })
    })

    // also request microphone and attach its audio tracks to the screen stream
    screenMicStream = null
    try {
      screenMicStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // add each mic audio track to the screen stream so MediaRecorder records both
      screenMicStream.getAudioTracks().forEach((t) => screenStream?.addTrack(t))
    } catch (micErr) {
      console.warn('Microphone not available or permission denied:', micErr)
      // continue without mic
    }

    screenChunks = []
    const mimeType = chooseMimeType()
    const options = mimeType ? { mimeType } : undefined
    screenRecorder = new MediaRecorder(screenStream, options)

    screenRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) screenChunks.push(e.data)
    }

    screenRecorder.onstop = () => {

      // remove track 'ended' handlers
      if (screenTrackEndHandlers && screenTrackEndHandlers.length) {
        screenTrackEndHandlers.forEach(({ track, handler }) => {
          try { track.removeEventListener('ended', handler as EventListener) } catch (e) { /* ignore */ }
        })
        screenTrackEndHandlers = []
      }

      // stop and release screen stream tracks
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop())
        screenStream = null
      }

      // stop and release microphone tracks if we created them separately
      if (screenMicStream) {
        screenMicStream.getTracks().forEach((t) => t.stop())
        screenMicStream = null
      }
      screenStartTime = null
    }

    screenRecorder.start()
    screenStartTime = Date.now()
    // if (srecord) srecord.disabled = true
    // if (sstop) sstop.disabled = false
  } catch (err) {
    console.error('startScreenRecording error:', err)
    alert('Could not start screen recording: ' + (err && err ? err : err))
  }
}

export async function stopRecording(): Promise<Blob> {
  // TODO: Stop MediaRecorder
  // TODO: Return recorded blob (webm format)
  if (screenRecorder && screenRecorder.state !== 'inactive') {
    return await new Promise<Blob>((resolve) => {
      const onStop = () => {
        try {
          const blob = new Blob(screenChunks, { type: screenChunks.length ? screenChunks[0].type : 'video/webm' })
          resolve(blob)
        } finally {
          if (screenRecorder) screenRecorder.removeEventListener('stop', onStop)
        }
      }
      // resolve when recorder emits stop (onstop handler in startRecording does UI + cleanup)
      screenRecorder?.addEventListener('stop', onStop)
      try {
        screenRecorder?.stop()
      } catch (e) {
        // if stop throws, still resolve with current chunks
        const blob = new Blob(screenChunks, { type: screenChunks.length ? screenChunks[0].type : 'video/webm' })
        resolve(blob)
      }
    })
  }

  return new Blob(screenChunks, { type: screenChunks.length ? screenChunks[0].type : 'video/webm' })
}

export function toggleMicrophone(enabled: boolean): void {
  // If we created a separate mic stream when starting, toggle those tracks.
  try {
    if (screenMicStream) {
      screenMicStream.getAudioTracks().forEach((t) => {
        t.enabled = enabled
      })
      // Also reflect on combined screenStream audio tracks that came from the mic
      if (screenStream) {
        const micIds = new Set(screenMicStream.getAudioTracks().map((t) => t.id))
        screenStream.getAudioTracks().forEach((t) => {
          if (micIds.has(t.id)) t.enabled = enabled
        })
      }
    } else if (screenStream) {
      // No separate mic stream — toggle all audio tracks (best-effort)
      screenStream.getAudioTracks().forEach((t) => (t.enabled = enabled))
    }
  } catch (e) {
    console.warn('toggleMicrophone error:', e)
  }
}

export function getRecordingDuration(): number {
  if (!screenStartTime) return 0
  return Math.max(0, Math.floor((Date.now() - screenStartTime) / 1000))
}
