# Spotlight Film

A Claude Code skill that turns a product brief into a rendered, keynote-style product film: a
black stage, one anchor whose beams of light carry content out at different angles, giant oblique
type and hard-cut proof shots. Every frame is rendered from code (HTML + three.js, Playwright,
ffmpeg), so films are deterministic and reviewable frame by frame.

## Demos

| open-slide (47 s) | Raycast Keyboard for iOS (40 s) | Raycast Keyboard (40 s) |
| --- | --- | --- |
| [![open-slide film](docs/demos/open-slide.gif)](docs/demos/open-slide.mp4) | [![Raycast Keyboard for iOS film](docs/demos/raycast-ios-keyboard.gif)](docs/demos/raycast-ios-keyboard.mp4) | [![Raycast Keyboard film](docs/demos/raycast-keyboard.gif)](docs/demos/raycast-keyboard.mp4) |

Click a preview for the full film. These are unofficial fan films made to test the skill, not
affiliated with the brands shown. Their soundtracks were added for the showcase: the skill itself
renders picture only.

## Install

```bash
npx skills add ridemountainpig/spotlight-film
```

Or copy [`skills/spotlight-film`](skills/spotlight-film) into `~/.claude/skills/`.

## Use

Try: "Make a 30-second launch film for our app. Here's the README, three screenshots and a screen
recording of the new editor."

Claude plans the film with you, renders stills for review, then the preview and the final MP4
(silent, ready for your own music). It works with the material you supply: it won't invent people, places or footage.
See [`SKILL.md`](skills/spotlight-film/SKILL.md) for the full workflow.

## License

[MIT](LICENSE)
