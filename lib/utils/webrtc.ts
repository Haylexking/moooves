// Simple WebRTC helpers for frontend-only peer connections using manual signaling
// (copy/paste SDP). Designed to be small and dependency-free.
export type OnDataMessage = (msg: string) => void
export type OnStateChange = (state: string) => void

export function createPeerConnection(opts?: {
  onData?: OnDataMessage
  onState?: OnStateChange
  iceServers?: RTCIceServer[]
}) {
  const pc = new RTCPeerConnection({ iceServers: opts?.iceServers || [] })
  let dc: RTCDataChannel | null = null

  const logState = (s: string) => opts?.onState?.(s)

  pc.oniceconnectionstatechange = () => {
    logState(pc.iceConnectionState)
  }

  pc.onconnectionstatechange = () => {
    logState(pc.connectionState)
  }

  // When remote creates a datachannel
  pc.ondatachannel = (ev) => {
    dc = ev.channel
    setupDataChannel(dc, opts?.onData)
    logState('datachannel-received')
  }

  function setupDataChannel(channel: RTCDataChannel, onData?: OnDataMessage) {
    channel.onopen = () => logState('open')
    channel.onclose = () => logState('closed')
    channel.onerror = (e) => logState('datachannel-error')
    channel.onmessage = (ev) => onData?.(String(ev.data))
  }

  async function createOffer(): Promise<string> {
    dc = pc.createDataChannel('moooves-channel')
    setupDataChannel(dc, opts?.onData)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    // Wait briefly for ICE candidates to be gathered (best-effort)
    await waitForIceGatheringComplete(pc)
    return pc.localDescription ? JSON.stringify(pc.localDescription) : ''
  }

  async function createAnswer(offerSDP: string): Promise<string> {
    const offer = JSON.parse(offerSDP) as RTCSessionDescriptionInit
    await pc.setRemoteDescription(offer)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await waitForIceGatheringComplete(pc)
    return pc.localDescription ? JSON.stringify(pc.localDescription) : ''
  }

  async function acceptAnswer(answerSDP: string) {
    const answer = JSON.parse(answerSDP) as RTCSessionDescriptionInit
    await pc.setRemoteDescription(answer)
  }

  function sendMessage(message: string) {
    if (!dc || dc.readyState !== 'open') throw new Error('DataChannel not open')
    dc.send(message)
  }

  async function close() {
    try {
      dc?.close()
    } catch (e) {
      /* noop */
    }
    try {
      pc.close()
    } catch (e) {
      /* noop */
    }
  }

  return { pc, createOffer, createAnswer, acceptAnswer, sendMessage, close }
}

function waitForIceGatheringComplete(pc: RTCPeerConnection, timeout = 1500) {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve()

    const handler = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', handler)
        resolve()
      }
    }

    pc.addEventListener('icegatheringstatechange', handler)

    // Fallback: resolve after a short timeout so UI doesn't hang waiting for candidates
    setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', handler)
      resolve()
    }, timeout)
  })
}
