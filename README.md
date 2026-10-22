# ProView

**Less distraction. More connection.**

A free, browser-based church presentation workspace with a public landing page, account creation through BreadBackend, a preparation workspace, and a separate live operator deck. Built with React 19, TypeScript, and Vite. No subscriptions, billing code, paid themes, or credit-card forms.

## Run locally

Requires **Node.js 22.17 or newer**.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The development server binds to `0.0.0.0`; Arena preview hosts are allowed. Click **Take a look around** on the landing page to enter the explicitly labelled local demo. No backend or account is required for that mode.

```sh
npm run build          # Type-check and generate dist/
npm run preview        # Serve the production build
npm test               # 24 unit tests
npm run test:e2e        # Playwright browser tests
npm run format:check   # Source formatting
```

Before the first normal browser test run:

```sh
npx playwright install --with-deps chromium
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can point to an existing Chromium binary in constrained environments. Browser tests use local mocks for the supplied SDK contract; they **do not** create real backend accounts.

## What is implemented

| Area           | Included                                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public website | Responsive landing page, interactive product preview, preparation/presentation tabs, FAQs, login and signup                                                                        |
| Accounts       | BreadBackend SDK signup, login, session validation, logout, loading states, validation and honest connection errors                                                                |
| Preparation    | Overview, service collections, editable service details, drag/drop and keyboard-button reordering, duplicate/delete, nested slides within items                                    |
| Slides         | Text, subtitle, private speaker notes, font size, six themes, image/video backgrounds, individual slide ordering and smart word-boundary reflow                                    |
| Songs          | Add/edit/delete, search, tags, plain-text import, public-domain example hymns, credit and church CCLI licence display                                                              |
| Scripture      | Two complete, on-demand 66-book libraries: KJV and ASV (1901); chapter and verse-range lookup, common abbreviations, translation selection and configurable text flow              |
| Media          | Image and video upload, preview, local IndexedDB persistence, cloud upload/delete, file-type validation, 50 MB per-file limit, protection against deleting files used by a service |
| Live operator  | Separate session copy, slide navigation, keyboard shortcuts, blackout, text clear, micro-edits, theme/media swaps, reflow, last-minute items, item reordering, session reset       |
| Displays       | Separate audience and confidence-monitor windows, synchronized using BroadcastChannel with a storage fallback, stage notes, next-slide preview, elapsed time and countdown         |
| Data           | Account-scoped local caches, debounced serialized cloud saves, explicit sync errors/retry, validated JSON backup export/restore, demo reset                                        |
| Quality        | Accessible form labels, focus-trapped dialogs, keyboard controls, reduced-motion handling, mobile layouts, unit/browser tests, CI and GitHub Pages workflows                       |

### A service is a collection

Each service contains ordered song, scripture, sermon, announcement, or media items. Each item contains its own ordered slides. This release supports **one level of grouped slides**, not arbitrary-depth folder trees.

### The master stays safe

Opening a service in the live deck makes a separate copy. Operator changes never call the workspace save functions. The session copy is retained in **sessionStorage** for that tab and service version. Resetting the session reloads the original collection. Returning to preparation does not silently commit live changes.

Keyboard shortcuts, when not typing in a form:

- **Right arrow / Space:** next slide
- **Left arrow:** previous slide
- **B:** blackout / restore
- **C:** clear / restore text
- **L:** go live / end live
- **?:** shortcut guide

Space keeps its normal activation behaviour when a button or link is focused. Arrow, blackout, and text-clear shortcuts remain available from buttons.

## BreadBackend integration

The supplied configuration is used by default. An optional `.env.local` can override the values in `.env.example`:

```env
VITE_BREAD_BASE_URL=https://kaidaz18.duckdns.org/api/v1/proview
VITE_BREAD_SDK_URL=https://kaidaz18.duckdns.org/sdk/bread-client.js
VITE_BREAD_PUBLIC_KEY=your_public_pk_key
```

The provided `pk_live_…` key is a **publishable browser key**, not a secret. Never put an admin, service-role, or private key in a `VITE_*` variable.

The SDK is loaded on demand when an account operation is requested. Passwords are sent to its authentication methods and are not stored by the application. The SDK owns authentication tokens. Logout calls the SDK's logout method when available and clears the storage keys observed during SDK authentication as a fallback.

### Cloud schema

The app uses a `workspaces` collection:

```ts
{
  id: string,                 // returned by BreadBackend
  ownerId: string,            // authenticated account ID
  workspace: {
    schemaVersion: 1,
    services: Service[],
    songs: Song[],
    media: Media[],
    settings: Settings
  },
  updatedAt: string
}
```

Types are in `src/lib/types.ts`; nested validation is in `src/lib/validation.ts`. A workspace is created only after a successful authenticated read confirms it does not exist. An unreadable or malformed cloud workspace is **not replaced** with demo data. With a previous cache, the app explicitly shows an unsynced state; without one, it blocks editing and offers a reload.

Media uses `bread.files.upload(file)` and `bread.files.delete(filename)`. Its filename and URL are stored in the owner's workspace. Direct media URLs follow the backend guide. The app does not list every project's files into a user's library.

Cloud writes are serialized and debounced. Edits remain on the device after a failed save and show a retry control. This is **last-write-wins**, not collaborative conflict resolution: avoid simultaneous preparation on the same account from multiple devices. The live output transport is not a cloud collaboration channel.

### Required before public production use

The frontend cannot create or audit backend security rules. The backend must enforce:

1. Authentication for every workspace and private file operation.
2. Owner-only reads and updates: authenticated user ID must match the stored `ownerId`.
3. Ownership assigned/validated server-side on creation and immutable on update.
4. Owner-only file deletion and appropriate upload limits and content validation.
5. HTTPS, rate limits, and the appropriate CORS/origin configuration for your deployed website and SDK.

**The `ownerId` check in the client is defence in depth, not access control. A publishable API key alone is not authentication.** Do not enable public reads/writes on `workspaces`. Verify account isolation with two real accounts before production.

The SDK host is outside the coding sandbox's network allowlist. Live signup, email verification behaviour, real backend response shapes, file ownership, CORS, and server authorization **have not been verified against that host**. Automated tests exercise the documented SDK methods with deterministic mocks. Browser connection failures never produce fake successful signups or a fake cloud workspace.

## Outputs and current release boundaries

- Audience and stage views work in **the same browser/profile on the same device**. Open **Displays** in the live deck, move each window onto an extended monitor, then use Fullscreen. Allow pop-ups if requested.
- A random per-session channel keeps separate operator sessions from accidentally sharing an output. It is **not a secure cross-device sharing token**. Copying the URL to a tablet will not relay the presentation.
- Audience output stays black until Go live is active. Ending live, leaving the operator, or a stale/disconnected session blacks out the feed. The stage preview can show queued content and private notes while standing by.
- Video backgrounds loop **silently** using native browser playback. Supported containers are MP4 and WebM, but codecs still depend on the browser. Audio-enabled foreground-video cueing and frame-accurate cross-window video synchronization are not included. Full media preview has native video/audio controls.
- Capture the audience window in OBS or another external broadcast tool for streaming. **Native NDI, direct hardware video output, and remote/tablet stage synchronization require additional broadcast/relay integrations.** They are not simulated or advertised as already working.
- There are authenticated **owner accounts**, not a complete multi-tenant church-team identity system. Preparation/operator separation protects masters by architecture, but does not constitute server-enforced multi-user roles. Staff invitations, custom roles, account recovery, and self-service account deletion need backend-supported endpoints and policies.
- CCLI credits are displayed from user-provided metadata. ProView does **not** verify licensing, grant rights, or automatically submit CCLI usage reports. The church retains those responsibilities.
- The local demo stores metadata in localStorage and media blobs in IndexedDB. It survives refresh, but is not a service-worker-installed offline application. Demo work is not automatically migrated at signup; export/import a backup if desired.
- JSON backups contain media references, **not file bytes**. Local media references only work in the browser that owns the blobs. Keep original media files and re-upload when moving devices.
- Cloud media links may be public under the supplied backend's file-serving model. Do not upload confidential pastoral information or sensitive recordings.

## Publish on GitHub Pages

A static deployment workflow is included at `.github/workflows/pages.yml`.

1. Review and merge the website changes into `main`.
2. In the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Run **Publish ProView to GitHub Pages**, or push a subsequent change to `main`.
4. Confirm the backend accepts the deployed origin and run the production checks below.

The workflow uses `/<repository-name>/` as Vite's base path for a project site. Hash routing works on static hosting without rewrite rules. For a custom domain, set the `PAGES_BASE_PATH` repository variable to `/`.

For another static host, run `npm run build` and serve `dist/`. Set `BASE_PATH` during the build if serving from a subdirectory. No app server, private API proxy, or browser-facing localhost endpoint is required.

## Production acceptance checklist

- Create two accounts using real email addresses; test login, logout, verification, and session expiry.
- Verify workspace and file isolation **on the server**, including malicious requests that change `ownerId`.
- Reload each account and confirm services, songs, settings, and uploaded images/video persist.
- Disconnect/reconnect the backend and verify the unsynced status and recovery path.
- Check projector and stage windows on real extended displays, including blackout, countdown, reconnect, and fullscreen.
- Try the actual media codecs and hardware used for the service.
- Confirm copyright/licence metadata and your church's separate reporting process.
- Export a backup and keep copies of uploaded media before the first live use.

## Project structure

```text
src/
  components/      Accessible UI, slide canvas, collection/media/scripture dialogs
  context/         Account and workspace state, cache and sync boundaries
  lib/             Backend adapter, types, validation, Bible lookup, media, live transport
  pages/           Public website, accounts, admin preparation, live deck, outputs
  styles.css       Responsive ProView visual system
public/
  bibles/          On-demand texts and source licence
  images/          Included AI-generated landscape background
 tests/
  unit/            Text flow, lookup, validation, credits and account normalization
  e2e/             Browser workflows, cloud-contract mocks, live outputs and mobile checks
```

Bible text provenance and jurisdiction-specific notes are in `public/bibles/README.md`. The KJV and ASV libraries are intentionally lazy-loaded and excluded from the initial JavaScript bundle. Fonts are self-hosted through Fontsource; the demo and website do not depend on an external image or font CDN.
