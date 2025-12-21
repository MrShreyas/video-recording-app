"use client"

import WatchPage from "@/components/watch-page"
import { useParams } from "next/navigation"


export default function Watch() {
  const { id } = useParams<{ id: string }>()
  return <WatchPage videoId={id} />
}
