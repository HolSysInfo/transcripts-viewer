# Transcripts Viewer

This Next.js viewer supports ticket transcripts saved by DiscordChatExporterPy and previously saved JSON transcripts. Update the existing viewer deployment with this project; keep its current domain and transcript IDs. A link such as `https://your-current-domain/1558688773854728252` continues to use the same path.

## Database configuration

Set these variables in the deployment environment, or in `.env.local` for local development:

```dotenv
MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING
MONGODB_DB_NAME=test
```

Use the same MongoDB cluster and database as the ticket bot. `MONGO_URI` is accepted as an alias for `MONGODB_URI`, and `MONGO_DB_NAME` is accepted as an alias for `MONGODB_DB_NAME`. If both forms are set, the `MONGODB_*` value takes priority. The database defaults to `test` when neither database name is set, matching the bot's default.

The database user needs read access to the transcript collections and GridFS buckets. The deployment must be able to reach MongoDB. Keep connection credentials in environment configuration.

No `NEXT_PUBLIC_BASE_URL` setting is required: this viewer uses routes on its existing domain. Keep the bot's `TRANSCRIPT_BASE_URL` pointing to that domain so its transcript and attachment links reach this deployment.

## Install and run

Use a Node.js environment that can run Next.js server routes. Install from the included Bun lockfile:

```bash
bun install --frozen-lockfile
bun run build
bun run start
```

Alternatively, use npm:

```bash
npm install
npm run build
npm start
```

For local development, use `bun run dev` or `npm run dev`, then open `http://localhost:3000`. For production, use the existing deployment's build and start configuration and redeploy this updated source to the same domain. The viewer requires a server runtime; a static HTML export cannot read MongoDB or stream GridFS files.

No separate Python transcript server is needed. This Next.js application serves the stored HTML and attachments directly.

## Stored transcripts and routes

New transcript metadata lives in the `transcripts` collection with a string `_id`, `schema_version: 2`, `storage: "gridfs"`, and an `html_file_id`. The complete UTF-8 HTML is stored in the `transcript_html` GridFS bucket; archived attachments are stored in `transcript_assets`. The viewer streams these files rather than rebuilding messages or loading an entire file into memory.

- `/{id}` displays the exporter's HTML in a full-page frame. Previously saved JSON records with `messages` and `users` arrays retain the legacy viewer.
- `/api/transcripts/{id}` returns the stored metadata or legacy JSON record.
- `/api/transcripts/{id}/html` serves the exact saved HTML. Add `?download=1` to download it; the existing `/{id}?download=1` link also redirects here.
- `/assets/{id}` serves a saved attachment. Safe image, audio, and video types can display inline; other file types download. Add `?download=1` to force a download.

No database migration is required. Legacy JSON records do not contain exporter HTML, so their HTML endpoint returns `409`; their original viewer remains available. Missing records return `404`, and unavailable database API requests return `503` with a retry message. The viewer page shows a retry message when storage cannot be reached.

## Verification

Run the offline tests after installing dependencies:

```bash
node --test tests/*.test.cjs
```

The same command is available as `npm test` or `bun run test`. Tests use fake MongoDB/GridFS data and do not connect to a live database. They cover both transcript formats, string IDs, connection recovery, byte-preserving streams, downloads, safe asset responses, and stream cancellation.

After redeployment, open a newly saved transcript using its existing link and check an archived attachment. Then open an older JSON transcript to confirm legacy compatibility. If a new record cannot load, verify that the bot and viewer point to the same cluster and database.

## Credits

Original viewer by [rhaym](https://github.com/rhaym-tech/transcripts-viewer).
