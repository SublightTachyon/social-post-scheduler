import base64
import json
import mimetypes
import os
import urllib.parse
import urllib.request


GRAPH_API_VERSION = os.getenv("GRAPH_API_VERSION", "v23.0")


def _post_form(url, data):
    body = urllib.parse.urlencode(data).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def _post_json(url, data, bearer_token):
    body = json.dumps(data).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {bearer_token}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def post_to_instagram(image, dry_run):
    platform = "instagram"
    ig_user_id = os.getenv("INSTAGRAM_USER_ID")
    access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")

    if dry_run:
        print(f"[DRY RUN] Would publish {image['url']} to Instagram.")
        return {"platform": platform, "ok": True, "dryRun": True}

    if not ig_user_id or not access_token:
        return {
            "platform": platform,
            "ok": False,
            "error": "Missing INSTAGRAM_USER_ID or INSTAGRAM_ACCESS_TOKEN.",
        }

    try:
        container = _post_form(
            f"https://graph.facebook.com/{GRAPH_API_VERSION}/{ig_user_id}/media",
            {
                "image_url": image["url"],
                "caption": image.get("caption", ""),
                "access_token": access_token,
            },
        )
        published = _post_form(
            f"https://graph.facebook.com/{GRAPH_API_VERSION}/{ig_user_id}/media_publish",
            {
                "creation_id": container["id"],
                "access_token": access_token,
            },
        )
        return {"platform": platform, "ok": True, "id": published.get("id")}
    except Exception as error:
        return {"platform": platform, "ok": False, "error": str(error)}


def post_to_facebook(image, dry_run):
    platform = "facebook"
    page_id = os.getenv("FACEBOOK_PAGE_ID")
    access_token = os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN")

    if dry_run:
        print(f"[DRY RUN] Would publish {image['url']} to Facebook Page.")
        return {"platform": platform, "ok": True, "dryRun": True}

    if not page_id or not access_token:
        return {
            "platform": platform,
            "ok": False,
            "error": "Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN.",
        }

    try:
        data = _post_form(
            f"https://graph.facebook.com/{GRAPH_API_VERSION}/{page_id}/photos",
            {
                "url": image["url"],
                "caption": image.get("caption", ""),
                "published": "true",
                "access_token": access_token,
            },
        )
        return {
            "platform": platform,
            "ok": True,
            "id": data.get("id"),
            "postId": data.get("post_id"),
        }
    except Exception as error:
        return {"platform": platform, "ok": False, "error": str(error)}


def _download_image_base64(image_url):
    with urllib.request.urlopen(image_url, timeout=30) as response:
        return base64.b64encode(response.read()).decode("utf-8")


def _guess_media_type(image_url):
    guessed, _ = mimetypes.guess_type(image_url)
    return guessed or "image/jpeg"


def post_to_x(image, dry_run):
    platform = "x"
    bearer_token = os.getenv("X_BEARER_TOKEN")

    if dry_run:
        print(f"[DRY RUN] Would publish {image['url']} to X.")
        return {"platform": platform, "ok": True, "dryRun": True}

    if not bearer_token:
        return {"platform": platform, "ok": False, "error": "Missing X_BEARER_TOKEN."}

    try:
        media_data = _post_json(
            "https://api.x.com/2/media/upload",
            {
                "media": _download_image_base64(image["url"]),
                "media_category": "tweet_image",
                "media_type": _guess_media_type(image["url"]),
            },
            bearer_token,
        )
        post_data = _post_json(
            "https://api.x.com/2/tweets",
            {
                "text": image.get("caption", ""),
                "media": {"media_ids": [media_data["data"]["id"]]},
            },
            bearer_token,
        )
        return {"platform": platform, "ok": True, "id": post_data["data"]["id"]}
    except Exception as error:
        return {"platform": platform, "ok": False, "error": str(error)}


def post_to_bluesky(image, dry_run):
    platform = "bluesky"
    handle = os.getenv("BLUESKY_HANDLE")
    password = os.getenv("BLUESKY_PASSWORD")

    if dry_run:
        print(f"[DRY RUN] Would post to Bluesky: \"{image.get('caption', '')}\" with image {image['id']}")
        return {"platform": platform, "ok": True, "dryRun": True}

    if not handle or not password:
        return {
            "platform": platform,
            "ok": False,
            "error": "Missing BLUESKY_HANDLE or BLUESKY_PASSWORD.",
        }

    try:
        PDS_URL = "https://bsky.social"

        # Authenticate
        session_data = _post_json(
            f"{PDS_URL}/xrpc/com.atproto.server.createSession",
            {"identifier": handle, "password": password},
            None,
        )
        access_token = session_data["accessToken"]
        did = session_data["did"]

        # Download and upload image
        with urllib.request.urlopen(image["url"], timeout=30) as response:
            image_bytes = response.read()
            content_type = response.headers.get("Content-Type", "image/jpeg")

        upload_request = urllib.request.Request(
            f"{PDS_URL}/xrpc/com.atproto.repo.uploadBlob",
            data=image_bytes,
            method="POST",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": content_type,
            },
        )
        with urllib.request.urlopen(upload_request, timeout=30) as response:
            blob_data = json.loads(response.read().decode("utf-8"))
            blob = blob_data["blob"]

        # Create post with image
        post_data = _post_json(
            f"{PDS_URL}/xrpc/com.atproto.repo.createRecord",
            {
                "repo": did,
                "collection": "app.bsky.feed.post",
                "record": {
                    "text": image.get("caption", ""),
                    "createdAt": _iso_now(),
                    "embed": {
                        "$type": "app.bsky.embed.images",
                        "images": [{"image": blob, "alt": image.get("caption", "")}],
                    },
                },
            },
            access_token,
        )
        return {"platform": platform, "ok": True, "uri": post_data.get("uri")}
    except Exception as error:
        return {"platform": platform, "ok": False, "error": str(error)}


def _iso_now():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
