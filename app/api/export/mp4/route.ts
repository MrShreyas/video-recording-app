import { NextRequest } from 'next/server'
import { execFile } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function runFFmpeg(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      'ffmpeg',
      [
        '-y',
        '-i', input,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-c:a', 'aac',
        output
      ],
      (err) => (err ? reject(err) : resolve())
    )
  })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('video') as File | null

  if (!file) {
    return new Response('No video file', { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const tmpDir = os.tmpdir()
  const inputPath = path.join(tmpDir, `input-${Date.now()}.webm`)
  const outputPath = path.join(tmpDir, `output-${Date.now()}.mp4`)

  fs.writeFileSync(inputPath, buffer)

  try {
    await runFFmpeg(inputPath, outputPath)

    const mp4Buffer = fs.readFileSync(outputPath)

    return new Response(mp4Buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="export.mp4"'
      }
    })
  } catch (err) {
    console.error('FFmpeg error:', err)
    return new Response('MP4 export failed', { status: 500 })
  } finally {
    fs.existsSync(inputPath) && fs.unlinkSync(inputPath)
    fs.existsSync(outputPath) && fs.unlinkSync(outputPath)
  }
}
