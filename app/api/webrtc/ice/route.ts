import { NextRequest, NextResponse } from "next/server"
import { addIceCandidate, getIceCandidates } from "@/lib/server/webrtc-store"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const roomId = String(body.roomId || body.roomID || body.room || "").trim()
    const candidate = body.candidate
    const from = body.from === "host" || body.from === "guest" ? body.from : undefined
    if (!roomId || !candidate) return NextResponse.json({ error: "Missing roomId or candidate" }, { status: 400 })

    addIceCandidate(roomId, candidate, from)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to add candidate" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = String(searchParams.get("roomId") || "").trim()
    const after = searchParams.get("after") ? Number(searchParams.get("after")) : undefined
    if (!roomId) return NextResponse.json({ error: "Missing roomId" }, { status: 400 })

    const candidates = getIceCandidates(roomId, after)
    return NextResponse.json({ roomId, candidates, count: candidates.length, now: Date.now() })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to get candidates" }, { status: 500 })
  }
}
