# social-post-scheduler
A starter project for automatically scheduling and publishing image posts to multiple social platforms.
# Social Post Scheduler

A starter project for automatically scheduling and publishing image posts to multiple social platforms.

This project includes example implementations in **JavaScript/Node.js** and **Python**. It is designed as a safe learning project that uses scheduler logic, local state tracking, and official API-style adapters for social media publishing.

The bot can:

* Store a list of images
* Track which images have already been posted
* Pick an unused image
* Post on a schedule
* Mark posted images as used
* Support multiple platforms through separate adapter functions
* Run in dry-run mode for testing

> This project is intended to use official platform APIs. It does not automate browser clicks, steal cookies, or ask users for social media passwords.

---

## Project Goal

The goal is to create a simple automated social media posting system that can publish content at intervals such as:

* Once a week
* Every two weeks
* Monthly
* Custom scheduled runs

It also avoids reposting the same image by tracking used images in a local state file.

---

## How It Works

The basic flow is:

```text
Image list
   ↓
Scheduler checks if a post is due
   ↓
Bot picks an unused image
   ↓
Bot sends the post to enabled platforms
   ↓
Bot marks the image as used
   ↓
Bot calculates the next post date
```

The project uses a local JSON file to remember which images have already been posted.

---

## Features

* Dry-run mode for safe testing
* JavaScript and Python starter versions
* Local JSON-based image tracking
* Simple scheduler logic
* Separate posting adapters for each platform
* Prevents duplicate image posting
* Easy to expand with a real database later
* Designed to work with official APIs instead of browser automation

---

## Folder Structure

```text
social-post-scheduler/
├── social-poster-js/
│   ├── data/
│   │   ├── images.json
│   │   └── state.json
│   ├── poster.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── social-poster-python/
│   ├── data/
│   │   ├── images.json
│   │   └── state.json
│   ├── poster.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── .gitignore
└── README.md
```

---

## Requirements

For the JavaScript version:

```bash
node --version
npm --version
```

For the Python version:

```bash
python3 --version
pip --version
```

You will also need developer/API access for any platform you want to actually publish to.

Common platforms include:

* Instagram
* Facebook
* X/Twitter

---

## Environment Variables

Create a `.env` file from the example file:

```bash
cp .env.example .env
```

Example `.env` values:

```env
DRY_RUN=true

POST_INTERVAL_DAYS=7

INSTAGRAM_ENABLED=false
FACEBOOK_ENABLED=false
X_ENABLED=false

INSTAGRAM_ACCESS_TOKEN=your_instagram_token_here
FACEBOOK_ACCESS_TOKEN=your_facebook_token_here
X_API_KEY=your_x_api_key_here
X_API_SECRET=your_x_api_secret_here
X_ACCESS_TOKEN=your_x_access_token_here
X_ACCESS_SECRET=your_x_access_secret_here
```

Keep `DRY_RUN=true` until you are sure everything works.

Never commit your real `.env` file.

---

## JavaScript Version

Go into the JavaScript project folder:

```bash
cd social-poster-js
```

Install dependencies:

```bash
npm install
```

Run in dry-run mode:

```bash
DRY_RUN=true npm run force
```

Run normally:

```bash
npm start
```

---

## Python Version

Go into the Python project folder:

```bash
cd social-poster-python
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run in dry-run mode:

```bash
DRY_RUN=true python3 poster.py --force
```

Run normally:

```bash
python3 poster.py
```

---

## Image Tracking

Images are listed in:

```text
data/images.json
```

Example:

```json
[
  {
    "id": "img001",
    "path": "images/photo1.jpg",
    "caption": "First scheduled post"
  },
  {
    "id": "img002",
    "path": "images/photo2.jpg",
    "caption": "Second scheduled post"
  }
]
```

Posted image history is stored in:

```text
data/state.json
```

Example:

```json
{
  "lastPostDate": "2026-07-01T09:00:00",
  "nextPostDate": "2026-07-08T09:00:00",
  "usedImages": ["img001"]
}
```

The bot checks `usedImages` before choosing a new image.

---

## Scheduling

This project can be scheduled in several ways.

On Linux, you can use `cron`.

Example: run every Monday at 9:00 AM:

```cron
0 9 * * MON /usr/bin/node /path/to/social-poster-js/poster.js
```

For Python:

```cron
0 9 * * MON /usr/bin/python3 /path/to/social-poster-python/poster.py
```

You can also run it with:

* A VPS
* GitHub Actions
* A cloud scheduler
* A background worker
* A Docker container

For reliable automatic posting, use a server or cloud service that stays online.

---

## Safety Notes

Do not store real API keys in GitHub.

Do not commit:

```text
.env
tokens.json
credentials.json
data/state.json
node_modules/
.venv/
```

Use official APIs when publishing to social platforms.

Avoid browser automation that logs in with usernames and passwords. That approach is fragile, can break when websites change, and may violate platform rules.

---

## Recommended `.gitignore`

```gitignore
# Secrets
.env
.env.*
!.env.example
tokens.json
credentials.json
client_secret*.json
secrets.json

# Node
node_modules/
npm-debug.log*

# Python
__pycache__/
*.py[cod]
.venv/
venv/

# Runtime state
data/state.json
logs/
*.log

# Media uploads
uploads/
media/
images/private/

# OS/editor
.DS_Store
Thumbs.db
.vscode/*
!.vscode/extensions.json
```

---

## Roadmap

Possible future improvements:

* Add a web dashboard
* Add user login
* Add a database such as SQLite, PostgreSQL, or Supabase
* Add image upload support
* Add caption templates
* Add hashtag rotation
* Add post preview
* Add failure retry logic
* Add email alerts when posting fails
* Add Docker support
* Add GitHub Actions scheduling
* Add support for videos and carousels

---

## Disclaimer

This project is for educational and development purposes.

Use official APIs and follow each platform’s developer rules. Do not use this project to spam, impersonate others, scrape private data, or bypass platform restrictions.

---

## License

MIT License

You are free to use, modify, and distribute this project. See the `LICENSE` file for details.
