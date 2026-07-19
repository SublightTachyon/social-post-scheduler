import argparse
import json
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from platforms import post_to_facebook, post_to_instagram, post_to_x, post_to_bluesky
from image_manager import sync_images_from_folder


ROOT_DIR = Path(__file__).resolve().parent
IMAGES_PATH = ROOT_DIR / "data" / "images.json"
STATE_PATH = ROOT_DIR / "data" / "state.json"


def read_json(path, fallback):
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path, value):
    with path.open("w", encoding="utf-8") as file:
        json.dump(value, file, indent=2)
        file.write("\n")


def utc_now():
    return datetime.now(timezone.utc)


def is_due(state, force):
    if force:
        return True
    next_run_at = state.get("nextRunAt")
    if not next_run_at:
        return True
    return datetime.fromisoformat(next_run_at.replace("Z", "+00:00")) <= utc_now()


def schedule_next_run(state):
    interval_days = int(os.getenv("POST_INTERVAL_DAYS", "7"))
    state["nextRunAt"] = (utc_now() + timedelta(days=interval_days)).isoformat()


def pick_unused_image(images, state):
    used = set(state.get("usedImageIds", []))
    for image in images:
        if image["id"] not in used:
            return image
    return None


def enabled_platforms():
    raw = os.getenv("PLATFORMS", "instagram,facebook,x")
    return [platform.strip().lower() for platform in raw.split(",") if platform.strip()]


def post_to_enabled_platforms(image, dry_run):
    results = []
    for platform in enabled_platforms():
        if platform == "instagram":
            results.append(post_to_instagram(image, dry_run))
        elif platform == "facebook":
            results.append(post_to_facebook(image, dry_run))
        elif platform == "x":
            results.append(post_to_x(image, dry_run))
        elif platform == "bluesky":
            results.append(post_to_bluesky(image, dry_run))
        else:
            results.append(
                {"platform": platform, "ok": False, "error": f"Unknown platform: {platform}"}
            )
    return results


def run_once(force):
    dry_run = os.getenv("DRY_RUN", "true").lower() != "false"
    
    # Sync images from the images folder
    images_dir = ROOT_DIR / "data" / "images"
    sync_images_from_folder(str(images_dir), str(IMAGES_PATH))
    
    images = read_json(IMAGES_PATH, [])
    state = read_json(
        STATE_PATH,
        {
            "nextRunAt": None,
            "usedImageIds": [],
            "history": [],
        },
    )

    if not is_due(state, force):
        print(f"Not due yet. Next run: {state['nextRunAt']}")
        return

    image = pick_unused_image(images, state)
    if not image:
        print("No unused images left. Stopping so no image repeats.")
        return

    prefix = "[DRY RUN] " if dry_run else ""
    print(f"{prefix}Posting image {image['id']}")
    results = post_to_enabled_platforms(image, dry_run)
    failed = [result for result in results if not result.get("ok")]

    if failed and not dry_run:
        print("At least one platform failed. State was not updated.")
        print(json.dumps(failed, indent=2))
        return

    state["usedImageIds"] = sorted(set(state.get("usedImageIds", []) + [image["id"]]))
    state.setdefault("history", []).append(
        {
            "imageId": image["id"],
            "postedAt": utc_now().isoformat(),
            "dryRun": dry_run,
            "results": results,
        }
    )
    schedule_next_run(state)
    write_json(STATE_PATH, state)

    print(f"Marked {image['id']} as used.")
    print(f"Next run: {state['nextRunAt']}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Run one schedule check and exit.")
    parser.add_argument("--force", action="store_true", help="Post now even if not due.")
    args = parser.parse_args()

    if args.once or args.force:
        run_once(force=args.force)
        return

    check_every_seconds = int(os.getenv("CHECK_EVERY_SECONDS", "60"))
    print(f"Scheduler running. Checking every {check_every_seconds} seconds.")
    while True:
        run_once(force=False)
        time.sleep(check_every_seconds)


if __name__ == "__main__":
    main()
