# LeanTrack AI

A mobile-first Next.js + TypeScript + Tailwind + Recharts PWA. All implementation lives in this directory; the repository's CSV is untouched.

## Run locally

Requires Node.js 20.9+ (Node 24 recommended).

```sh
cd leantrack-ai
npm ci
npm test
npm run typecheck
npm run build
npm start
```

For development use `npm run dev`. Open http://localhost:3000. No paid key is needed. Initial values: starting weight 95 kg, height 177 cm, first goal 90 kg. Age, sex, activity and optional calorie target are blank. Finish the profile onboarding; no meals or dated weigh-ins are invented.

## Features

- Responsive dashboard, daily calorie/macronutrient totals, optional user-entered target, dated meal history.
- Breakfast/lunch/dinner/snacks with validated add/edit/delete, Unicode Thai food names.
- Camera and library upload, editable scan review. Keyless demo returns a clearly labeled zero-valued placeholder, **not photo analysis**. Estimates from real AI may be substantially wrong.
- Daily weight upsert/delete, kg/lb display, Recharts, calendar-based trailing seven-day average and goal progress. Missing days are not interpolated.
- Weekly local reflection, optional protected server-side OpenAI coach.
- Profile preferences, light/dark mode, English/Thai main navigation and core flows, bilingual forms. Some explanatory copy and charts remain English.
- CSV export for food and weight, quotes/Thai preserved, spreadsheet formula injection neutralized.
- Install manifest, PNG icons, iOS standalone metadata, safe areas, shell service worker. Offline use requires a successful prior online visit and cached bundles. API requests and photos are not cached.

## Optional AI setup

Copy `.env.example` to `.env.local` and configure `OPENAI_API_KEY`, `OPENAI_MODEL` and a long random `AI_ACCESS_TOKEN` **on the server**. Never commit secrets or prefix server keys with `NEXT_PUBLIC_`. Both the API key and token must exist or endpoints remain in demo/local mode. Enter the access token in the UI each session (memory only). Photo selection sends the image to this app's same-origin endpoint; configured AI forwards it to OpenAI. Coach asks for consent before sending journal data; the server forwards only aggregate facts. Images are not persisted.

The demo shared-token guard is intended for a private single-user deployment. Before inviting public users, replace it with per-user authentication, distributed rate limits, request-size enforcement at the hosting edge, spend limits and abuse monitoring. Keep provider logs free of payloads. Provider data policies apply to submitted photos.

## Privacy and integration boundaries

`lib/storage.ts` defines the repository interface. Browser-local data is not encrypted and is accessible to anyone using this browser profile; no analytics or cloud sync are enabled. Clearing site data removes logs. Export regularly; CSV reimport is not implemented. Malformed stored data is preserved and saves are blocked pending manual recovery in browser devtools.

Supabase integration is deliberately not activated. Implement an authenticated repository adapter for the `Repository` boundary, migrate to async loading/saving, and create per-user profile/meal/weight tables with row-level security (`auth.uid() = user_id`), unique `(user_id,date)` weight entries, and migration tests. Never ship a service-role key. The example public URL/anon variables are placeholders only.

## Deploy on Vercel (Next.js runtime)

1. Push the branch and import the repository in Vercel.
2. Set **Root Directory** to `leantrack-ai`, framework **Next.js**, Node **24.x**.
3. Use install command `npm ci`, build command `npm run build`, and default Next.js output settings.
4. Deploy without environment variables for the private keyless demo. To activate AI, add the three server variables above to the intended environment and redeploy.
5. Open the HTTPS deployment in Safari on iPhone → Share → Add to Home Screen. Confirm camera upload, persistence after reload, offline reopening after online use, light/dark mode and CSV exports on a physical device.

Alternatively deploy to any Node host: run the local production commands above, bind port 3000, and terminate HTTPS through the host's reverse proxy. Static export is not supported because API routes require a server. Sites Worker hosting is not used because this implementation explicitly uses Next.js.

## Validation and limits

`npm test` covers defaults, invalid inputs, calendar-window averages, CSV escaping and evidence-conscious fallback text. `npm run typecheck` and `npm run build` verify the application. Photo estimates are not validated nutritional measurements. No medical advice or automatic calorie prescription. This adult-oriented demo is not a replacement for a clinician or dietitian. Full Thai editorial localization, multi-user auth/cloud synchronization and physical iPhone QA remain follow-up work.

### Verified in this implementation session

- Dependencies installed and lockfile committed.
- Nine unit/API tests passed; TypeScript check passed.
- Optimized production build passed with Webpack. Turbopack's CSS worker could not bind an internal port in the execution sandbox; `npm run build` explicitly selects Webpack.
- No browser preview agent was available; visual, camera, offline and physical iPhone behavior still require manual acceptance checks above.
