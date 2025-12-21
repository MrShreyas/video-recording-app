import { getRecording } from "./indexeddb";

// Prefer FFmpeg wasm via @ffmpeg/ffmpeg + @ffmpeg/util when available in browser.
// Dynamically load the packages in the browser and fall back to a captureStream approach
// when FFmpeg isn't available or fails.

let ffmpegInstance: any | null = null;
let ffmpegModulesLoaded = false;

async function ensureFFmpeg(): Promise<any | null> {
  if (typeof window === "undefined") return null;
  if (ffmpegInstance) return ffmpegInstance;
  try {
    const ffmpegModule = await import("@ffmpeg/ffmpeg");
    const utilModule = await import("@ffmpeg/util");
    const FFmpegClass =
      ffmpegModule.FFmpeg ??
      ffmpegModule.default?.FFmpeg ??
      ffmpegModule.default ??
      ffmpegModule;
    if (typeof FFmpegClass !== "function") {
      console.warn(
        "FFmpeg class not found on module",
        Object.keys(ffmpegModule)
      );
      return null;
    }

    ffmpegInstance = new FFmpegClass();
    const baseURL =
      "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
    const coreURL = await utilModule.toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      "text/javascript"
    );
    const wasmURL = await utilModule.toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      "application/wasm"
    );
    await ffmpegInstance.load({ coreURL, wasmURL });
    // Attach logger/progress if available to surface internal ffmpeg messages
    try {
      if (typeof ffmpegInstance.setLogger === "function") {
        ffmpegInstance.setLogger(({ type, message }: any) => {
        });
      }
      if (typeof ffmpegInstance.setProgress === "function") {
        ffmpegInstance.setProgress((p: any) => {
        });
      }
    } catch (e) {
      console.warn("Failed to attach ffmpeg logger/progress", e);
    }
    ffmpegModulesLoaded = true;
    return ffmpegInstance;
  } catch (err) {
    console.warn(
      "FFmpeg dynamic load failed, falling back to native captureStream:",
      err
    );
    ffmpegInstance = null;
    ffmpegModulesLoaded = false;
    return null;
  }
}

function pickFFmpegApi(ff: any) {
  const api: any = {};
  api.write = ff?.writeFile ? "writeFile" : ff?.FS ? "FS" : null;
  api.read = ff?.readFile ? "readFile" : ff?.FS ? "FS" : null;
  api.remove = ff?.remove ? "remove" : ff?.FS ? "FS" : null;
  api.run = ff?.run ? "run" : ff?.exec ? "exec" : null;
  return api;
}

async function ffWriteFile(ff: any, api: any, name: string, data: Uint8Array) {
  if (!ff) throw new Error("No ffmpeg instance");
  if (api.write === "writeFile") {
    await ff.writeFile(name, data);
    return;
  }
  if (api.write === "FS") {
    // FS('writeFile', name, data)
    try {
      ff.FS("writeFile", name, data);
    } catch (e) {
      throw e;
    }
    return;
  }
  throw new Error("No write API on ffmpeg instance");
}

async function ffReadFile(
  ff: any,
  api: any,
  name: string
): Promise<Uint8Array> {
  if (!ff) throw new Error("No ffmpeg instance");
  if (api.read === "readFile") {
    const out = await ff.readFile(name);
    return out;
  }
  if (api.read === "FS") {
    const out = ff.FS("readFile", name);
    return out;
  }
  throw new Error("No read API on ffmpeg instance");
}

async function ffRemoveFile(ff: any, api: any, name: string) {
  if (!ff) return;
  if (api.remove === "remove") {
    try {
      await ff.remove(name);
    } catch (_) {}
    return;
  }
  if (api.remove === "FS") {
    try {
      ff.FS("unlink", name);
    } catch (_) {}
    return;
  }
}

async function ffRunWithTimeout(
  ff: any,
  api: any,
  args: string[],
  timeoutMs = 120000
) {
  if (!ff) throw new Error("No ffmpeg instance");
  const runMethod =
    api.run === "run"
      ? ff.run.bind(ff)
      : api.run === "exec"
      ? ff.exec.bind(ff)
      : null;
  if (!runMethod) throw new Error("No run/exec API on ffmpeg instance");
  const runPromise = (async () => {
    try {
      const res = runMethod(args);
      // If returns a promise-like, await it
      if (res && typeof (res as any).then === "function") return await res;
      // Some builds expect a single string
      try {
        const alt = runMethod(args.join(" "));
        if (alt && typeof (alt as any).then === "function") return await alt;
      } catch (e) {
        console.warn("ffmpeg run alt invocation failed", e);
      }
      // Some builds use run() which may not return a promise; attempt to wrap in a short-lived poll
      console.warn("ffmpeg run did not return a promise; returned:", res);
      return res;
    } catch (err) {
      console.error("ffmpeg run invocation error", err);
      throw err;
    }
  })();

  return await Promise.race([
    runPromise,
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error("ffmpeg run timeout")), timeoutMs)
    ),
  ]);
}

function chooseMimeType(): string {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const t of types) {
    try {
      if (
        (MediaRecorder as any).isTypeSupported &&
        (MediaRecorder as any).isTypeSupported(t)
      )
        return t;
    } catch (_) {}
  }
  return "";
}

async function recordPlayback(
  blob: Blob,
  startSec: number | null,
  endSec: number | null,
  mimeType?: string
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const cleanup = () => {
      try {
        video.pause();
      } catch (_) {}
      try {
        URL.revokeObjectURL(url);
      } catch (_) {}
      try {
        video.remove();
      } catch (_) {}
    };

    const onLoaded = () => {
      try {
        const duration = video.duration || 0;
        const s =
          startSec !== null ? Math.max(0, Math.min(startSec, duration)) : 0;
        const e =
          endSec !== null ? Math.max(s, Math.min(endSec, duration)) : duration;
        const recordTime = Math.max(0, e - s);
        const stream = (video as any).captureStream
          ? (video as any).captureStream()
          : (video as any).mozCaptureStream?.();
        if (!stream) {
          cleanup();
          return reject(new Error("captureStream not supported"));
        }
        const options = mimeType || chooseMimeType();
        let recorder: MediaRecorder;
        try {
          recorder = options
            ? new MediaRecorder(stream, { mimeType: options })
            : new MediaRecorder(stream);
        } catch (err) {
          try {
            recorder = new MediaRecorder(stream as any);
          } catch (err2) {
            throw err2;
          }
        }
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (ev: BlobEvent) => {
          if (ev.data && ev.data.size) chunks.push(ev.data);
        };
        recorder.onerror = (ev) => {
          console.warn("MediaRecorder error", ev);
        };
        recorder.onstop = () => {
          const out = new Blob(chunks, {
            type: chunks.length ? (chunks[0] as Blob).type : "video/webm",
          });
          cleanup();
          resolve(out);
        };
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          try {
            recorder.start();
          } catch (e) {
            console.warn("recorder.start failed", e);
          }
          video.play().catch((e) => console.warn("video play failed", e));
          setTimeout(() => {
            try {
              recorder.stop();
            } catch (e) {
              console.warn("recorder.stop failed", e);
            }
          }, Math.max(0, recordTime * 1000));
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = s;
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.onerror = () => {
      cleanup();
      reject(new Error("video error"));
    };
    video.style.position = "fixed";
    video.style.left = "-9999px";
    video.style.top = "-9999px";
    document.body.appendChild(video);
  });
}

export async function trimVideo(
  url: string | undefined,
  startSec: number,
  endSec: number
): Promise<Blob> {
  if (!url) throw new Error("No url provided");
  const blob = await getRecording(url);
  if (!blob) throw new Error("Recording not found in IndexedDB");

  const ff = await ensureFFmpeg();
  if (ff) {
    const inputName = "input.webm";
    const outName = "output.webm";
    const util = await import("@ffmpeg/util");
    const data = await util.fetchFile(blob);
    const api = pickFFmpegApi(ff);
    await ffWriteFile(ff, api, inputName, data);
    const dur = Math.max(0, endSec - startSec);
    try {
      await ffRunWithTimeout(ff, api, [
        "-ss",
        String(startSec),
        "-i",
        inputName,
        "-t",
        String(dur),
        "-c",
        "copy",
        outName,
      ]);
    } catch (e) {
      console.warn("fast copy failed, trying re-encode", e);
      await ffRunWithTimeout(ff, api, [
        "-ss",
        String(startSec),
        "-i",
        inputName,
        "-t",
        String(dur),
        "-c:v",
        "libvpx",
        "-c:a",
        "libvorbis",
        outName,
      ]);
    }
    const out = await ffReadFile(ff, api, outName);
    const blobOut = new Blob([out.buffer], { type: "video/webm" });
    await ffRemoveFile(ff, api, inputName);
    await ffRemoveFile(ff, api, outName);
    return blobOut;
  }

  const mime = chooseMimeType();
  return await recordPlayback(blob, startSec, endSec, mime);
}

async function exportMp4ViaApi(blob: Blob): Promise<Blob> {
  const formData = new FormData();
  formData.append("video", blob, "recording.webm");

  const res = await fetch("/api/export/mp4", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MP4 export API failed: ${text || res.status}`);
  }

  return await res.blob();
}

async function fetchVideoBlob(url: string): Promise<Blob> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch trimmed video: ${res.status}`)
  }
  return await res.blob()
}

export async function exportVideo(
  url: string | null,
  format: "webm" | "mp4"
): Promise<Blob> {
  if (!url) throw new Error("No url provided");

  const blob = await fetchVideoBlob(url);
  if (!blob) throw new Error("Recording not found in IndexedDB");

  if (format === "mp4") {
    try {
      return await exportMp4ViaApi(blob);
    } catch (err) {
      console.error("Server MP4 export failed", err);
      throw err;
    }
  }

  // -----------------------------
  // WEBM FLOW (unchanged)
  // -----------------------------

  const ff = await ensureFFmpeg();
  if (ff) {
    const inputName = "input.webm";
    const outName = "out.webm";
    const util = await import("@ffmpeg/util");
    const data = await util.fetchFile(blob);
    const api = pickFFmpegApi(ff);

    await ffWriteFile(ff, api, inputName, data);

    try {
      await ffRunWithTimeout(ff, api, ["-i", inputName, "-c", "copy", outName]);
    } catch {
      await ffRunWithTimeout(ff, api, [
        "-i",
        inputName,
        "-c:v",
        "libvpx",
        "-c:a",
        "libvorbis",
        outName,
      ]);
    }

    const out = await ffReadFile(ff, api, outName);
    const blobOut = new Blob([out.buffer], { type: "video/webm" });

    await ffRemoveFile(ff, api, inputName);
    await ffRemoveFile(ff, api, outName);

    return blobOut;
  }

  // Final fallback
  return await recordPlayback(blob, null, null, chooseMimeType());
}

export function getVideoDuration(videoBlob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(videoBlob);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    v.onloadedmetadata = () => {
      const d = Math.floor(v.duration || 0);
      URL.revokeObjectURL(url);
      resolve(d);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });
}
