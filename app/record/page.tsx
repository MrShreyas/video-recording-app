import RecordingInterface from "@/components/recording-interface"

export const metadata = {
  title: "Record Screen - ScreenRec",
  description: "Record your screen and microphone",
}

export default function RecordPage() {
  return (
    <div className="min-h-screen bg-background">
      <RecordingInterface />
    </div>
  )
}
