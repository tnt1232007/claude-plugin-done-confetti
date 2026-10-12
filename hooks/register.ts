import type { Register } from 'claude-code'

type Platform = 'windows' | 'macos' | 'linux'
type Runner = { process: { run: (argv: readonly string[], init?: { timeoutMs?: number }) => Promise<{ stdout: string }> } }

// Stock sounds each OS ships: Windows media files, macOS system sounds, the freedesktop theme on Linux.
const SOUNDS: Record<Platform, { answer: string; error: string }> = {
  windows: { answer: 'C:\\Windows\\Media\\tada.wav', error: 'C:\\Windows\\Media\\Windows Ding.wav' },
  macos: { answer: '/System/Library/Sounds/Glass.aiff', error: '/System/Library/Sounds/Basso.aiff' },
  linux: { answer: '/usr/share/sounds/freedesktop/stereo/complete.oga', error: '/usr/share/sounds/freedesktop/stereo/dialog-error.oga' },
}

// Raycast's built-in Confetti command answers this deeplink. Raycast ships for macOS and Windows only.
const CONFETTI = 'raycast://confetti'

const run = ($: Runner, argv: readonly string[]) => void $.process.run(argv, { timeoutMs: 10_000 }).catch(() => {})

// A hooks module has no Node `process`, so ask the OS. Windows has no uname unless Git Bash puts one on PATH (MINGW/MSYS).
let platform: Promise<Platform> | undefined
const detectPlatform = ($: Runner) =>
  (platform ??= $.process
    .run(['uname', '-s'], { timeoutMs: 5_000 })
    .then(({ stdout }): Platform => (stdout.startsWith('Darwin') ? 'macos' : stdout.startsWith('Linux') ? 'linux' : 'windows'))
    .catch((): Platform => 'windows'))

const playSound = ($: Runner, os: Platform, file: string) => {
  if (os === 'windows') run($, ['powershell', '-NoProfile', '-Command', `(New-Object Media.SoundPlayer '${file}').PlaySync()`])
  else if (os === 'macos') run($, ['afplay', file])
  else run($, ['paplay', file])
}

const showConfetti = ($: Runner, os: Platform) => {
  if (os === 'windows') run($, ['powershell', '-NoProfile', '-Command', `Start-Process '${CONFETTI}'`])
  else if (os === 'macos') run($, ['open', '-g', CONFETTI])
}

const formatDuration = (ms: number) => {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

export const register: Register = (on, options) => {
  // The manifest's userConfig, defaults filled in; changing one in /config reloads the module.
  const minMs = Number(options.min_seconds ?? 30) * 1000
  const hasSound = options.sound !== false
  const hasConfetti = options.confetti !== false

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)

    // Main loop only; an interrupt means the person is already watching.
    if (e.agentId !== undefined || e.isAborted || e.durationMs < minMs) return result

    const os = await detectPlatform($)
    const isAnswer = e.reason === 'answer'
    $.ui.toast(`${isAnswer ? 'done' : e.reason} in ${formatDuration(e.durationMs)}`)
    if (hasSound) playSound($, os, isAnswer ? SOUNDS[os].answer : SOUNDS[os].error)
    // Confetti celebrates answers only, never an error.
    if (isAnswer && hasConfetti) showConfetti($, os)

    return result
  })
}
