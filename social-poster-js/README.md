# Social Poster JS Starter

This is a learning starter for an automatic social media posting bot. It:

- Checks whether a post is due.
- Picks the next image that has not been used.
- Posts to selected official API adapters.
- Marks that image as used so it will not repeat.
- Schedules the next run.

It starts in `DRY_RUN=true`, so it logs what it would do without posting.

## Setup

```bash
cd social-poster-js
cp .env.example .env
npm run force
```

Node does not load `.env` automatically in this dependency-free version, so either export variables in your shell or run it like this:

```bash
DRY_RUN=true PLATFORMS=instagram,facebook,x npm run force
```

## Add Images

Drop image files into the `data/images/` folder (`.jpg`, `.png`, `.gif`, `.webp`). The bot will automatically detect them and add them to `images.json` on the next run.

Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

To serve local images, run the image server in a separate terminal:

```bash
npm run server
```

The server listens on `http://localhost:3000/images` and serves images from the `data/images/` folder. Update the `base_url` in your environment if needed.

## Run Automatically

Option 1: run it as a daemon:

```bash
npm run daemon
```

Option 2: use cron to wake it up every hour:

```cron
0 * * * * cd /path/to/social-poster-js && /usr/bin/node src/index.js --once
```

The script checks `data/state.json`. If the current time is before `nextRunAt`, it exits without posting.

## Real API Posting

Set `DRY_RUN=false` and provide the platform tokens in your environment.

Important notes:

- Instagram image publishing expects a public HTTPS `image_url`.
- Facebook Page photo publishing also expects a public image URL.
- X image posting uploads media first, then creates a post with the returned media ID.
- Bluesky uses your handle and app password (create in Settings → Password).
- Use OAuth/access tokens. Do not ask users for their social media passwords.

### Bluesky Setup

1. Convert your account to a Creator or Business account (if not already)
2. Create an app password in Settings → Password
3. Set environment variables:

```bash
export PLATFORMS=bluesky
export BLUESKY_HANDLE=your-handle.bsky.social
export BLUESKY_PASSWORD=your-app-password
export DRY_RUN=false
npm run force
```

## Image List

Images are automatically detected from the `data/images/` folder. To manually edit the list, edit `data/images.json`:

```json
[
  {
    "id": "unique-image-id",
    "url": "https://your-site.com/photo.jpg",
    "caption": "Caption goes here"
  }
]
```

When every image has been used, the bot stops instead of repeating.
