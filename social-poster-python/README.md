# Social Poster Python Starter

This is a Python version of the same automatic posting idea:

- Check if a post is due.
- Pick an unused image from `data/images.json`.
- Publish through official platform API adapters.
- Mark the image as used in `data/state.json`.
- Schedule the next run.

It uses only Python's standard library.

## Setup

```bash
cd social-poster-python
DRY_RUN=true python3 poster.py --force
```

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
export PLATFORMS=instagram,facebook,x
export INSTAGRAM_USER_ID=...
export INSTAGRAM_ACCESS_TOKEN=...
export FACEBOOK_PAGE_ID=...
export FACEBOOK_PAGE_ACCESS_TOKEN=...
export X_BEARER_TOKEN=...
python3 poster.py --force
```

Use OAuth/access tokens. Do not collect users' social media passwords.
