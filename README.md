# Done Confetti

A Claude Code plugin that celebrates when Claude finishes a long turn: Raycast confetti fills the screen and a success sound plays. A turn that ends in an API error plays an error sound instead, with no confetti.

Short turns stay quiet. By default, only turns that took 30 seconds or more trigger it.

## Install

In a Claude Code terminal session, run:

```
/plugin install done-confetti --marketplace tnt1232007/claude-plugin-done-confetti
```

Answer `y` to add the marketplace, then pick a scope. The user scope makes it work in every project.

## Settings

Open `/config` to change these options:

| Option | Default | What it does |
| --- | --- | --- |
| `min_seconds` | `30` | Turns shorter than this end silently |
| `sound` | `true` | Plays a success sound, or an error sound when the turn ends in an error |
| `confetti` | `true` | Opens `raycast://confetti` when a turn finishes |

## Platforms

| OS | Sound | Confetti |
| --- | --- | --- |
| Windows | `tada.wav` and `Windows Ding.wav`, played through PowerShell | Yes, if [Raycast for Windows](https://www.raycast.com/windows) is installed |
| macOS | `Glass` and `Basso` system sounds, played with `afplay` | Yes, if [Raycast](https://www.raycast.com) is installed |
| Linux | freedesktop `complete` and `dialog-error` sounds, played with `paplay` | No, because Raycast has no Linux version |

On Linux, the sound needs PulseAudio or PipeWire (`paplay`) and the freedesktop sound theme, which most desktop distributions ship.

The plugin also shows a toast with the turn's duration, such as `done in 1m 12s`, on surfaces that draw plugin toasts.

## How it works

The plugin is a Claude Code mod: a hooks module (`hooks/register.ts`) that listens for the `turn.complete` event. It ignores subagent turns and turns you interrupted. The mod API is in early access, so a Claude Code update may require changes to the plugin.
