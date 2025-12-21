import Link from "next/link"
import { Video, Upload, BarChart3, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="size-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">ScreenRec</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/record" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Record
            </Link>
            <Link href="/my-videos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              My Videos
            </Link>
            <Link href="/analytics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Analytics
            </Link>
          </nav>
          <Button asChild>
            <Link href="/record">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
            Record, Edit & Share Screen Recordings in Seconds
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Professional screen recording tool with built-in editing, instant sharing, and detailed analytics. Perfect
            for tutorials, presentations, and demos.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link href="/record">Start Recording</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base bg-transparent">
              <Link href="/my-videos">View Examples</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="size-12 rounded-lg bg-accent flex items-center justify-center mb-4">
              <Video className="size-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Easy Recording</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Capture your screen and microphone with one click. High-quality WebM output ready to share.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="size-12 rounded-lg bg-accent flex items-center justify-center mb-4">
              <Shield className="size-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Trim & Export</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Precision editing tools to trim your recordings. Export in WebM or MP4 format.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="size-12 rounded-lg bg-accent flex items-center justify-center mb-4">
              <Upload className="size-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Share Instantly</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload and get a shareable link in seconds. Track views and engagement with built-in analytics.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card md:col-span-3">
            <div className="size-12 rounded-lg bg-accent flex items-center justify-center mb-4">
              <BarChart3 className="size-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Detailed Analytics</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track view counts, watch completion rates, and engagement metrics for every video you share. Understand
              how your audience interacts with your content.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 mb-16">
        <div className="max-w-3xl mx-auto text-center p-12 rounded-2xl border border-border bg-card">
          <h2 className="text-3xl font-bold mb-4 text-balance">Ready to start recording?</h2>
          <p className="text-muted-foreground mb-6">No signup required. Start recording your screen in seconds.</p>
          <Button asChild size="lg">
            <Link href="/record">Start Recording Now</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
