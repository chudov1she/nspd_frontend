"use client"

let notificationAudio: HTMLAudioElement | null = null
let audioContext: AudioContext | null = null
let unlockBound = false

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (audioContext) return audioContext
  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  audioContext = new Ctx()
  return audioContext
}

function unlockAudioIfNeeded() {
  if (typeof window === "undefined" || unlockBound) return
  unlockBound = true
  const unlock = () => {
    const ctx = getAudioContext()
    if (ctx && ctx.state === "suspended") {
      void ctx.resume().catch(() => {})
    }
    window.removeEventListener("pointerdown", unlock)
    window.removeEventListener("keydown", unlock)
  }
  window.addEventListener("pointerdown", unlock, { once: true })
  window.addEventListener("keydown", unlock, { once: true })
}

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null
  if (notificationAudio) return notificationAudio
  notificationAudio = new Audio("/sounds/notification.mp3")
  notificationAudio.preload = "auto"
  notificationAudio.volume = 0.5
  return notificationAudio
}

function playFallbackBeep() {
  const ctx = getAudioContext()
  if (!ctx) return
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = "sine"
  oscillator.frequency.value = 880
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + 0.2)
}

export function playNotificationSound() {
  unlockAudioIfNeeded()
  const audio = getAudio()
  if (!audio) {
    playFallbackBeep()
    return
  }
  audio.currentTime = 0
  void audio.play().catch(() => {
    playFallbackBeep()
  })
}
