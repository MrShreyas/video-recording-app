"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Monitor,
  Smartphone,
  Globe,
  ExternalLink,
  Calendar,
  Check,
  Copy,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface AnalyticsData {
  videoId: string;
  counters: {
    views: number;
    browsers: Record<string, number>;
    devices: Record<string, number>;
    geo: Record<string, number>;
    referrals: Record<string, number>;
  };
  createdAt: string;
  recent: Array<{
    ts: string;
    ip: string;
    device: string;
    browser: string;
    referer: string;
    country: string;
  }>;
}

export default function AnalyticsDashboard({ id }: { id: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;

  const shareUrl = appDomain
    ? `${
        appDomain.startsWith("http") ? appDomain : `https://${appDomain}`
      }/api/v/${id}`
    : "";

  useEffect(() => {
    fetch(`/api/analytics/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setAnalytics(data);
        }
      })
      .catch((err) => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-red-500">{error || "Analytics not found"}</p>
          <Link
            href="/"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { counters, recent } = analytics;
  const totalViews = counters.views || 0;

  // Helper to get top items
  const getTop = (obj: Record<string, number>, limit = 5) => {
    return Object.entries(obj)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  };

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
        <Link href={`/watch/${id}`} className="text-primary hover:underline">
          View Video
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Analytics for Video {id}</h1>
        <div className="flex flex-row gap-2 max-w-125 mb-2 ">
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
        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-accent flex items-center justify-center">
                <Eye className="size-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-3xl font-bold">{totalViews}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-accent flex items-center justify-center">
                <Monitor className="size-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Device</p>
                <p className="text-lg font-bold">
                  {getTop(counters.devices)[0]?.[0] || "N/A"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-accent flex items-center justify-center">
                <Globe className="size-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Country</p>
                <p className="text-lg font-bold">
                  {getTop(counters.geo)[0]?.[0] || "N/A"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-accent flex items-center justify-center">
                <ExternalLink className="size-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Referral</p>
                <p className="text-lg font-bold">
                  {getTop(counters.referrals)[0]?.[0] || "N/A"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Breakdowns */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Browsers */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Browsers</h2>
            <div className="space-y-3">
              {getTop(counters.browsers).map(([browser, count]) => (
                <div
                  key={browser}
                  className="flex items-center justify-between"
                >
                  <span className="capitalize">{browser}</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(count / totalViews) * 100}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Devices */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Devices</h2>
            <div className="space-y-3">
              {getTop(counters.devices).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <span className="capitalize">{device}</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(count / totalViews) * 100}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Geo */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Geography</h2>
            <div className="space-y-3">
              {getTop(counters.geo).map(([country, count]) => (
                <div
                  key={country}
                  className="flex items-center justify-between"
                >
                  <span className="capitalize">{country}</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(count / totalViews) * 100}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Referrals */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Referrals</h2>
            <div className="space-y-3">
              {getTop(counters.referrals).map(([referral, count]) => (
                <div
                  key={referral}
                  className="flex items-center justify-between"
                >
                  <span className="capitalize">{referral}</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(count / totalViews) * 100}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Views */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Views</h2>
          <div className="space-y-4">
            {recent.slice(0, 10).map((view, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-4">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(view.ts).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {view.browser} on {view.device} • {view.country} •{" "}
                      {view.referer}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{view.ip}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
