<div align="center">

# Simphonia — Marketing Website

Premium marketing website for the Simphonia eSIM travel app.  
Apple-inspired design with 3D elements, glassmorphism, and scroll-driven animations.

</div>

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | Semantic HTML5 with ARIA landmarks |
| Styling | CSS3 — Custom Properties, Grid, Flexbox, Backdrop Filter |
| Scripting | Vanilla JavaScript (ES Modules) |
| 3D | Three.js r128 (wireframe globe with connection arcs) |
| Animation | GSAP 3.12 + ScrollTrigger |
| Typography | Inter (Google Fonts) |

## Pages

| Page | Path | Description |
|------|------|-------------|
| **Home** | `index.html` | Hero with 3D globe, trust bar, how-it-works, features, app showcase, destinations bento, testimonials, pricing, download CTA |
| **Destinations** | `pages/destinations.html` | Searchable/filterable grid of 200+ countries with plans |
| **How It Works** | `pages/how-it-works.html` | Detailed 3-step guide with imagery and FAQ |
| **About** | `pages/about.html` | Company story, mission, values, team |
| **Support** | `pages/support.html` | Searchable FAQ accordion + contact form |
| **Compatibility** | `pages/compatibility.html` | Device compatibility checker with autocomplete |
| **Privacy Policy** | `pages/privacy.html` | Full privacy policy |
| **Terms of Service** | `pages/terms.html` | Full terms of service |

## File Structure

```
simphonia-website/
├── index.html                  # Main landing page
├── css/
│   └── style.css               # Complete stylesheet (organized sections)
├── js/
│   ├── main.js                 # Entry point — boots layout, cursor, stars
│   ├── globe.js                # Three.js interactive globe
│   ├── animations.js           # GSAP scroll-triggered animations
│   └── components/
│       └── layout.js           # Shared nav + footer (DRY injection)
├── pages/
│   ├── destinations.html
│   ├── how-it-works.html
│   ├── about.html
│   ├── support.html
│   ├── compatibility.html
│   ├── privacy.html
│   └── terms.html
└── assets/                     # Static assets (SVGs, images)
```

## Design System

### Colors (CSS Custom Properties)

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#D4AF37` | Brand gold — buttons, highlights, links |
| `--bg-primary` | `#0A0A0A` | Page background |
| `--bg-elevated` | `#1E1E1E` | Cards, elevated surfaces |
| `--text-primary` | `#FFFFFF` | Headings, body text |
| `--text-secondary` | `#B0ACA5` | Paragraphs, descriptions |
| `--glass-bg` | `rgba(255,255,255,0.04)` | Glassmorphism cards |

### Components

- **Glass Card** — Backdrop blur + subtle border + hover glow
- **Buttons** — Primary (solid gold), Outline, Ghost variants
- **Badge** — Pill-shaped status indicators with pulse dot
- **Store Badge** — App Store / Google Play download buttons
- **Section Header** — Label + H2 + description pattern

## Development

Serve with any static file server:

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

## Accessibility

- Skip navigation link
- ARIA landmarks and labels
- `prefers-reduced-motion` respected (disables all animations)
- `<noscript>` fallback for JS-dependent features
- Semantic HTML5 headings hierarchy
- Focus-visible styles on interactive elements
- Color contrast meets WCAG AA guidelines

## Performance

- Lazy-loaded images (`loading="lazy"`)
- Deferred script loading
- CSS Custom Properties for zero-duplication theming
- Three.js only loaded on pages that use it
- GSAP feature-detects sections (no page-name coupling)

## SEO

- Semantic `<meta>` tags on every page
- Open Graph tags for social sharing
- JSON-LD structured data (Organization, FAQPage)
- Descriptive `<title>` and `alt` attributes

## License

See [LICENSE](LICENSE).
