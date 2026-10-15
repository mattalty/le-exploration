# le-exploration: app prototyping playground

A product designer's playground for high-fidelity **iOS app prototypes**, built in React and shared by URL.
Each prototype renders inside an iPhone 17 Pro (402×874 pt) on desktop, and full-screen on a real phone.
It deploys to Cloudflare Workers.

## Commands

- `npm run dev`: local dev at http://localhost:5173. This is the real Worker (vite + @cloudflare/vite-plugin).
- `npm run new "Name"`: scaffold `src/prototypes/<slug>/` from `_template`.
- `npm run lock <slug>`: password-protect a prototype (writes `locks.json`). `-- --remove` unlocks it.
- `npm run typecheck` / `npm run build` / `npm run deploy`

## Layout

- `src/prototypes/<slug>/`: one folder per prototype. `meta.ts` holds the gallery info and `index.tsx` the default-exported component.
  Folders are discovered automatically. Folders starting with `_` are ignored.
- `src/kit/`: the iOS kit. **Import from `@/kit`.**
  - `device/`: DeviceFrame, status bar, Dynamic Island, `useStatusBarStyle`, `useScreen`.
  - `nav/`: `TabView` (floating Liquid Glass tab bar), `Stack` + `useStack()` (push/pop, swipe-back), `Page` (nav bar, collapsing large title).
  - `ios/`: `Glass`, `Button`, `GlassIconButton`, `Toggle`, `SegmentedControl`, `SearchField`, `Stepper`, `List/Section/Cell/CellIcon`, `Sheet`, `Alert`, `ActionSheet`, `Toast`, `Portal`.
  - `tokens.css`: iOS system colours (light/dark), materials, radii.
- `src/app/`: playground chrome. Gallery, Viewer (toolbar, share/QR), Unlock.
- `worker/index.ts`: password gate for locked prototypes. All other requests go to static assets.
- `src/prototypes/ios-showcase/`: the reference usage of every kit component. Read it before building something new.

## Building prototypes

1. **Compose from the kit first.** A typical root is
   `<TabView tabs=[{ content: <Stack root={<Page …/>} /> }]>`. Every screen is a `<Page>`.
   If something is missing, extend `src/kit` rather than one-off styling inside a prototype. Keep the kit generic.
2. **Style with the iOS tokens** via Tailwind:
   - Colour: `text-label`, `text-label-secondary`, `bg-grouped-bg`, `bg-grouped-bg-secondary`, `bg-fill-tertiary`, `text-tint`, `bg-ios-red`…
   - Type: `text-large-title`, `text-title1..3`, `text-headline`, `text-body`, `text-callout`, `text-subhead`, `text-footnote`, `text-caption1/2`.
   - In inline styles use `var(--ios-*)`. Never hard-code light-only colours; everything must work in dark mode.
   - Accent colour: set `--ios-tint` on a wrapper.
3. **Position overlays inside the device, never against the browser viewport.** Use `absolute` (not `fixed`) and the `Portal` component.
   Respect `var(--safe-top)` / `var(--safe-bottom)`. These are simulated in the frame and real `env()` values on a phone.
4. **Motion**: use `motion/react` springs. Use `pushSpring` for navigation-like moves. Gestures should feel physical (drag, velocity, snap).
5. **Icons**: `lucide-react` stands in for SF Symbols. SF Pro and SF Symbols can't be bundled. The font stack uses the system font, so Apple devices render real SF Pro.
6. Check every prototype in light **and** dark (`?theme=dark`), in the frame, and at mobile width (full-screen).

## From Figma

When given a Figma URL:
1. Use the Figma MCP. Load the `figma:figma-design-to-code` skill first, then call `get_design_context` + `get_screenshot` on the node, and `get_variable_defs` for tokens.
2. Map Figma layers to kit components (nav bar → `Page`, tab bar → `TabView`, grouped rows → `Section/Cell`, sheets → `Sheet`…). Map Figma colours to the nearest iOS token unless they're clearly brand colours. Brand colours go in the prototype, or later into a brand token layer.
3. Export images with the Figma tools into `public/<slug>/` and reference them as `/<slug>/file.png`.
4. Record the source URL in `meta.ts` as `figma: "…"`. The viewer then shows a Figma link.
5. Compare your render against the Figma screenshot side by side in the browser preview and iterate until they match.

## From scratch

Scaffold with `npm run new`. Mobbin (MCP) is available for real-world iOS pattern references.

## Sharing and locks

- Every prototype is public at `/p/<slug>`. `/embed/<slug>` is device-only, for iframes. Query params: `?theme=dark`, `?frame=0`.
- `npm run lock <slug>` stores a salted PBKDF2 hash in `locks.json`. The Worker then requires the password and sets a signed cookie.
  Locked prototypes are hidden from the production gallery.
  This is a soft lock: the JS bundles are still static files.
- Optional extra hardening: `npx wrangler secret put COOKIE_SECRET`.

## Gotchas

- Kit CSS (`tokens.css`) lives in `@layer components` so Tailwind utilities override it. Keep new kit CSS in that layer.
- The device may be CSS-scaled on small windows. Divide pointer deltas by the scale for custom gestures. See `SwipeBackEdge` in `nav/Stack.tsx`.
