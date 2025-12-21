import MyVideos from "@/components/my-videos"

export const metadata = {
  title: "My Videos - ScreenRec",
  description: "Manage your screen recordings",
}

export default function MyVideosPage() {
  return (
    <div className="min-h-screen bg-background">
      <MyVideos />
    </div>
  )
}
