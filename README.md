# Typewriter

A minimal digital typewriter simulator for distraction-free writing. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Distraction-free writing** — Clean, minimal interface focused on the writing experience
- **Typewriter sound effects** — Authentic keypress sounds with subtle pitch variation
- **Visual keyboard** — On-screen keyboard that highlights keys as you type
- **Light & dark mode** — Toggle between themes based on preference
- **Writing prompts** — Random poems, riddles, jokes, and quotes to overcome blank page anxiety
- **Fullscreen mode** — Immersive writing experience
- **Download your work** — Export your writing as a `.txt` file
- **Desktop-only** — Designed for physical keyboards

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `ESC` | Open/close settings |
| `Cmd/Ctrl + Backspace` | Clear all text |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd typewriter

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Settings

Access settings by pressing `ESC`:

- **Show keyboard** — Toggle the on-screen keyboard visibility
- **Sound effects** — Enable/disable typewriter sounds
- **Dark mode** — Switch between light and dark themes
- **Download as .txt** — Save your writing to a text file

## Tech Stack

- [Next.js 16](https://nextjs.org/) — React framework
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Tailwind CSS 4](https://tailwindcss.com/) — Styling
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — Sound playback
- [Courier Prime](https://fonts.google.com/specimen/Courier+Prime) — Typewriter font

## Project Structure

```
src/
├── app/
│   ├── page.tsx        # Main typewriter component
│   ├── layout.tsx      # Root layout with fonts
│   ├── globals.css     # Global styles and themes
│   └── prompts.ts      # Collection of writing prompts
public/
└── typewriter-key.wav  # Keypress sound effect
```

## License

MIT
