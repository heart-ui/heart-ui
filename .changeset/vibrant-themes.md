---
'@heart-ui/theme': minor
'heart-ui': minor
---

Light-mode `primary` moves from step 600 to step 500 (hover 600, pressed 700, focus ring 800), so every theme's primary is brighter and more saturated while white text still passes 4.5:1. Adds a sixth preset, `rose`, and lowers `forest`'s chroma from 0.15 to 0.12 so it needs no contrast moves. A primary with chroma 0.04 or less now makes a monochrome theme (fill at step 900 in light mode, 50 in dark), and `graphite` becomes near black.
