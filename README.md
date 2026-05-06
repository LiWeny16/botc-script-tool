# BOTC Script Tool

Free Blood on the Clocktower layout beautifier & custom script generator. Import official JSON, edit characters and jinx relationships, customize special rules, and export print-ready PDF, PNG, and multi-language JSON — no signup needed.

**[Live Demo](https://botc.letshare.fun/)** | **[GitHub](https://github.com/LiWeny16/botc-script-tool-modern)**

![Screenshot](public/imgs/images/screenshots/promo.png)

## Features

- **Import/Export JSON** — Import official or custom script JSON, export with your edits
- **Character Editing** — Modify character names, images, abilities, and metadata
- **Jinx & Special Rules** — Edit jinx relationships and add custom special rules
- **Two-Page Layout** — Town square + night order side-by-side, ready for print
- **Export PDF & PNG** — High-quality printable script sheets
- **Night Order** — Auto-generated night order with drag-and-drop reordering
- **Multi-Language** — UI and role names in English, Chinese (简体中文), and Spanish
- **Script Repository** — Browse and preview official and community scripts
- **Custom Characters** — Upload custom icons and define homebrew characters
- **Dark/Light Theme** — Toggle between dark and light mode
- **Mobile-Friendly** — Responsive design works on phones and tablets

## Script Design Knowledge Base

This project includes an AI-oriented [BOTC Knowledge Base](./knowledge/botc/README.md) for script design reasoning — rules ontology, design heuristics, and a generation/review playbook. Useful if you're using AI to assist with script creation.

## Tech Stack

| Category | Technology |
|:---|:---|
| Framework | React 19 + TypeScript |
| State | MobX 6 |
| UI | MUI 7 + Emotion + framer-motion |
| Routing | react-router-dom v7 |
| Drag & Drop | @dnd-kit |
| Build | Vite (rolldown) |
| Analytics | Google Analytics 4 |

## Development

```bash
# Install dependencies
yarn

# Start dev server
yarn dev

# Build for production
yarn build
```

The production build outputs to the `docs/` directory (configured for GitHub Pages).

## License

[AGPL-3.0](LICENSE)
