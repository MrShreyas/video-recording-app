"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Eye, Clock, Check, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { trackView, trackWatchProgress } from "@/lib/analytics-utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function WatchPage({ videoId }: { videoId: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [views, setViews] = useState(0);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN
  const cdnDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;

  const shareUrl = appDomain ? `${appDomain}/api/v/${videoId}` : "";

  useEffect(() => {
    // console.log("Using CDN domain for video:", base);
      console.log(appDomain,cdnDomain)
    if (cdnDomain) {
      const base = cdnDomain.startsWith("http")
        ? cdnDomain
        : `https://${cdnDomain}`;
      
      setVideoSrc(`${base}/${videoId}`);
    }

    setIsLoading(false);

    trackView(videoId).then(() => {
      setViews((prev) => prev + 1);
    });
  }, [videoId, cdnDomain]);

  const handlePlay = () => {
    setIsPlaying(true);
    trackWatchProgress(videoId, 0);
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Video Player */}
          <Card className="p-6 mb-6">
            <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
              {isLoading ? (
                <div className="text-center">
                  <p className="text-muted-foreground">Loading video...</p>
                </div>
              ) : videoSrc ? (
                <video
                  src={videoSrc}
                  controls
                  className="w-full h-full object-contain"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground">Video not found</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Eye className="size-4" />
                <span>{views} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4" />
                <span>2:34</span>
              </div>
              <Button asChild>
                <Link href={`/analytics/${videoId}`}>View Analytics</Link>
              </Button>
              <Input value={shareUrl} readOnly className="font-mono text-sm" />
              <Button
                onClick={handleCopy}
                variant="outline"
                className="shrink-0 bg-transparent"
                disabled={!shareUrl}
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </Card>

          {/* Call to Action */}
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-3">
              Create your own screen recordings
            </h2>
            <p className="text-muted-foreground mb-6">
              Record, edit, and share professional screen recordings in seconds
            </p>
            <Link
              href="/record"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Start Recording Free
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
