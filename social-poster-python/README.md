# Social Poster Python Starter

This is a Python version of the same automatic posting idea:

- Check if a post is due.
- Pick an unused image from `data/images/` folder.
- Publish through official platform API adapters.
- Mark the image as used in `data/state.json`.
- Schedule the next run.

It uses only Python's standard library.

## Setup

```bash
cd social-poster-python
DRY_RUN=true python3 poster.py --force
```

## Add Images

Drop image files into the `data/images/` folder (`.jpg`, `.png`, `.gif`, `.webp`). The bot will automatically detect them and add them to `images.json` on the next run.

Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

To serve local images, run the image server in a separate terminal:

```bash
python3 image_server.py
```

The server listens on `http://localhost:3000/images` and serves images from the `data/images/` folder. Update the `base_url` in your environment if needed.

## Run Automatically

Option 1: daemon mode:

```bash
python3 poster.py
```

Option 2: cron:

```cron
0 * * * * cd /path/to/social-poster-python && /usr/bin/python3 poster.py --once
```

The script exits without posting when `data/state.json` says the next post is not due yet.

## Real API Posting

Set `DRY_RUN=false` and export the needed environment variables:

```bash
export DRY_RUN=false
export PLATFORMS=instagram,facebook,x,bluesky
export INSTAGRAM_USER_ID=...
export INSTAGRAM_ACCESS_TOKEN=...
export FACEBOOK_PAGE_ID=...
export FACEBOOK_PAGE_ACCESS_TOKEN=...
export X_BEARER_TOKEN=...
export BLUESKY_HANDLE=your-handle.bsky.social
export BLUESKY_PASSWORD=your-app-password
python3 poster.py --force
```

Use OAuth/access tokens. Do not collect users' social media passwords.

### Bluesky Setup

1. Convert your account to a Creator or Business account (if not already)
2. Create an app password in Settings → Password
3. Set `BLUESKY_HANDLE` and `BLUESKY_PASSWORD` environment variables
