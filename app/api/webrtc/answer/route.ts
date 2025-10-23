import { NextRequest, NextResponse } from "next/server"
import { getAnswer, setAnswer } from "@/lib/server/webrtc-store"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const roomId = String(body.roomId || body.roomID || body.room || "").trim()
    const sdp = body.sdp || body.answer
    if (!roomId || !sdp) return NextResponse.json({ error: "Missing roomId or sdp" }, { status: 400 })

    setAnswer(roomId, sdp)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to set answer" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = String(searchParams.get("roomId") || "").trim()
    if (!roomId) return NextResponse.json({ error: "Missing roomId" }, { status: 400 })

    const answer = getAnswer(roomId)
    if (!answer) return NextResponse.json({ found: false }, { status: 404 })

    return NextResponse.json({ found: true, roomId, sdp: answer })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to get answer" }, { status: 500 })
  }
}
