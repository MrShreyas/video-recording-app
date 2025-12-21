"use client"

import Link from "next/link"
import { ArrowLeft, Video, MoreVertical, Trash2, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function MyVideos() {
  const videos = [
    { id: "abc123", title: "Product Demo", date: "2024-03-15", thumbnail: "/product-demo-presentation.png" },
    { id: "def456", title: "Tutorial Video", date: "2024-03-14", thumbnail: "/tutorial-screen.jpg" },
    { id: "ghi789", title: "Team Update", date: "2024-03-13", thumbnail: "/meeting-screen.jpg" },
  ]

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
        <Button asChild>
          <Link href="/record">New Recording</Link>
        </Button>
      </div>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Videos</h1>

        {videos.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="size-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No videos yet</h2>
            <p className="text-muted-foreground mb-6">Create your first screen recording to get started</p>
            <Button asChild>
              <Link href="/record">Start Recording</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden group">
                <div className="aspect-video bg-muted relative">
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Link href={`/watch/${video.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="size-16 rounded-full bg-primary flex items-center justify-center">
                        <ExternalLink className="size-8 text-primary-foreground" />
                      </div>
                    </Link>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate mb-1">{video.title}</h3>
                      <p className="text-sm text-muted-foreground">{video.date}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="size-8 p-0">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <ExternalLink className="size-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
