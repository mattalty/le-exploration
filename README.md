# le-exploration

A playground for high-fidelity iOS app prototypes. You can build them from Figma or from scratch, and each one gets a link you can share.

- An **iPhone 17 Pro** mockup on desktop. On a phone the prototype runs **full-screen**.
- An **iOS 26/27 Liquid Glass kit**: floating tab bar, nav stack with swipe-back, collapsing large titles, sheets with detents, lists with swipe actions, alerts, toasts and controls.
- **Share** any prototype by link or QR code. You can **password-lock** individual prototypes.
- Hosted on **Cloudflare Workers**.

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
npm run new "Booking flow"
```

Then open `src/prototypes/booking-flow/index.tsx`, or ask Claude Code something like
"build this Figma frame as a prototype: <url>" or "prototype a checkout flow with a bottom sheet".

## Sharing

| URL | What |
| --- | --- |
| `/` | Gallery |
| `/p/<slug>` | Prototype with toolbar (theme, frame, restart, share/QR) |
| `/embed/<slug>` | Device only, for Figma/Notion/Keynote embeds |
| `?theme=dark` · `?frame=0` | Saved in shared links |

Lock a prototype:

```bash
npm run lock booking-flow                # prompts for a password
npm run lock booking-flow -- --remove
```

Commit `locks.json` and deploy.

## Deploying

```bash
npx wrangler login     # once
npm run deploy
```

To deploy automatically on every push, connect this GitHub repo in the Cloudflare dashboard under
**Workers & Pages → le-exploration → Settings → Builds**. Use build command `npm run build` and deploy command `npx wrangler deploy`.
Pushes to `main` go live. Other branches get their own preview URLs.
