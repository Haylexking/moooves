type SDP = any

export type CandidateEntry = {
  candidate: any
  timestamp: number
  from?: "host" | "guest"
}

export type RoomSignal = {
  roomId: string
  offer?: SDP
  answer?: SDP
  candidates: CandidateEntry[]
  createdAt: number
}

const rooms = new Map<string, RoomSignal>()

export function getOrCreateRoom(roomId: string): RoomSignal {
  let room = rooms.get(roomId)
  if (!room) {
    room = { roomId, candidates: [], createdAt: Date.now() }
    rooms.set(roomId, room)
  }
  return room
}

export function setOffer(roomId: string, offer: SDP) {
  const room = getOrCreateRoom(roomId)
  room.offer = offer
}

export function getOffer(roomId: string): SDP | undefined {
  const room = rooms.get(roomId)
  return room?.offer
}

export function setAnswer(roomId: string, answer: SDP) {
  const room = getOrCreateRoom(roomId)
  room.answer = answer
}

export function getAnswer(roomId: string): SDP | undefined {
  const room = rooms.get(roomId)
  return room?.answer
}

export function addIceCandidate(roomId: string, candidate: any, from?: "host" | "guest") {
  const room = getOrCreateRoom(roomId)
  room.candidates.push({ candidate, timestamp: Date.now(), from })
}

export function getIceCandidates(roomId: string, after?: number): CandidateEntry[] {
  const room = rooms.get(roomId)
  if (!room) return []
  if (!after) return [...room.candidates]
  return room.candidates.filter((c) => c.timestamp > after)
}

// Optional pruning to avoid memory leaks in long-running processes
export function pruneOldRooms(maxAgeMs = 1000 * 60 * 60) {
  const now = Date.now()
  for (const [id, room] of rooms) {
    if (now - room.createdAt > maxAgeMs) {
      rooms.delete(id)
    }
  }
}
