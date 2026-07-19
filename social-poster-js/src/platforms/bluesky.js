// Bluesky (AT Protocol) adapter for posting images with captions

const PDS_URL = "https://bsky.social";

async function authenticateBluesky(handle, password) {
  const response = await fetch(`${PDS_URL}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: handle,
      password: password
    })
  });

  if (!response.ok) {
    throw new Error(`Bluesky auth failed: ${response.statusText}`);
  }

  const session = await response.json();
  return session;
}

async function uploadImageBluesky(imageUrl, accessToken) {
  // Fetch the image from the URL
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image from ${imageUrl}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

  // Upload to Bluesky
  const uploadResponse = await fetch(`${PDS_URL}/xrpc/com.atproto.repo.uploadBlob`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType
    },
    body: imageBuffer
  });

  if (!uploadResponse.ok) {
    throw new Error(`Bluesky image upload failed: ${uploadResponse.statusText}`);
  }

  const blobData = await uploadResponse.json();
  return blobData.blob;
}

async function postToBluesky(image, options = {}) {
  const { dryRun = true } = options;

  try {
    const handle = process.env.BLUESKY_HANDLE;
    const password = process.env.BLUESKY_PASSWORD;

    if (!handle || !password) {
      return {
        platform: "bluesky",
        ok: false,
        error: "Missing BLUESKY_HANDLE or BLUESKY_PASSWORD"
      };
    }

    if (dryRun) {
      return {
        platform: "bluesky",
        ok: true,
        dryRun: true,
        message: `Would post to Bluesky: "${image.caption}" with image ${image.id}`
      };
    }

    // Authenticate
    const session = await authenticateBluesky(handle, password);

    // Upload image
    const blob = await uploadImageBluesky(image.url, session.accessToken);

    // Create post with image
    const postResponse = await fetch(`${PDS_URL}/xrpc/com.atproto.repo.createRecord`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        repo: session.did,
        collection: "app.bsky.feed.post",
        record: {
          text: image.caption,
          createdAt: new Date().toISOString(),
          embed: {
            $type: "app.bsky.embed.images",
            images: [
              {
                image: blob,
                alt: image.caption
              }
            ]
          }
        }
      })
    });

    if (!postResponse.ok) {
      const error = await postResponse.text();
      return {
        platform: "bluesky",
        ok: false,
        error: `Failed to create post: ${error}`
      };
    }

    const postData = await postResponse.json();
    return {
      platform: "bluesky",
      ok: true,
      postUri: postData.uri,
      message: `Posted to Bluesky: ${image.caption}`
    };
  } catch (error) {
    return {
      platform: "bluesky",
      ok: false,
      error: error.message
    };
  }
}

export { postToBluesky };
