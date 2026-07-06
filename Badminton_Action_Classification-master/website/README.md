# SkeletonCourt

**Badminton Action Classification Based on Human Skeleton Data Extracted by AlphaPose.**

A production-grade research showcase site. It presents a shuttlecock-free system that turns raw
badminton video into 17-joint skeleton trajectories and classifies five player strokes —
forehand clear, forehand/backhand drive, and forehand/backhand net shot — with a BiLSTM +
temporal-attention model. Content is grounded in the real project (`../Action_classification`)
and the source paper (Liang & Nyamasvisva, IEEE ICSMD 2023, 80% LSTM baseline).

> Raw Video → AlphaPose Keypoints → Temporal Sequence → Action Classification

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, and Framer Motion.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build && npm run start   # production
```

Node 18.18+ (Node 20/22 recommended).

## Project structure

```
app/
  layout.tsx            Root layout · fonts · metadata · JSON-LD · theme provider
  page.tsx              Section composition (dynamic-imported below the fold)
  globals.css           Design tokens (CSS vars) · light/dark themes
  api/classify/route.ts Secure upload endpoint (validation + rate limit + model seam)
  sitemap.ts robots.ts manifest.ts not-found.tsx
components/
  Hero, SkeletonCanvas, SkeletonAnatomy, Solution, DataFlow,
  ModelArchitecture, ClassificationShowcase, Metrics, UseCases,
  ResearchPaper, Demo, TechStack, Navbar, Footer
  ui/                   Reveal (scroll), Counter, Section, ThemeProvider
lib/
  data.ts               Single source of truth (joints, actions, pipeline, paper…)
  jsonld.ts             schema.org structured data
```

## Design system

Tokens live as CSS variables in `app/globals.css` and are surfaced to Tailwind in
`tailwind.config.ts` (`canvas`, `surface`, `ink`, `muted`, `accent`, …). Switching
`.dark` on `<html>` (via `next-themes`) reflows the entire palette.

- **Type:** Inter Tight (display) · Inter (body) · JetBrains Mono (code)
- **Palette:** Midnight `#07111F` · Indigo `#283593` · Electric Cyan `#00D4FF` · Success `#22C55E`
- **Motion:** Framer Motion, eased and subtle, fully gated behind `prefers-reduced-motion`.

## The demo & the model integration seam

`components/Demo.tsx` validates files **client-side** (type, size, empty check) and POSTs to
`/api/classify`, which re-validates **server-side** — the authoritative gate — applies a
per-IP rate limit, and **returns a simulated inference**. No upload is persisted.

To wire a real AlphaPose + LSTM/CNN model server, set the env vars below and un-comment the
forwarding block in `app/api/classify/route.ts`. The request/response contract is unchanged.

```bash
cp .env.example .env.local
# MODEL_SERVER_URL=https://your-inference-host
# MODEL_API_KEY=...        # never hard-coded; env only
```

## Security

- Strict **Content-Security-Policy** + HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, COOP — all in `next.config.mjs`.
- Upload **input validation & sanitisation** (MIME allowlist, 50 MB cap), filename sanitised
  before display (no raw user input rendered).
- **Rate limiting** on the API route (fixed-window per IP; swap for Redis/Upstash at scale).
- `x-powered-by` disabled. Secrets are **environment variables only** — none are committed.

## Performance & accessibility

- Server components by default; interaction-heavy sections are **dynamic-imported / code-split**.
- `next/font` self-hosts fonts (no layout shift, no third-party requests).
- Semantic HTML, skip-link, focus-visible rings, ARIA labels, `prefers-reduced-motion` support.
- AVIF/WebP image formats configured; animations are transform/opacity based (GPU-accelerated).

## Deployment

**Vercel** — push the repo and import; `vercel.json` sets the framework and region.

**Docker** — multi-stage build to a Next.js standalone runtime:

```bash
docker build -t skeletoncourt .
docker run -p 3000:3000 skeletoncourt
```

## License

MIT.
