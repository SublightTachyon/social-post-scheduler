function guessMediaType(imageUrl) {
  const lower = imageUrl.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function fetchImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}

export async function postToX(image, { dryRun }) {
  const platform = "x";
  const bearerToken = process.env.X_BEARER_TOKEN;

  if (dryRun) {
    console.log(`[DRY RUN] Would publish ${image.url} to X.`);
    return { platform, ok: true, dryRun: true };
  }

  if (!bearerToken) {
    return { platform, ok: false, error: "Missing X_BEARER_TOKEN." };
  }

  try {
    const mediaResponse = await fetch("https://api.x.com/2/media/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        media: await fetchImageAsBase64(image.url),
        media_category: "tweet_image",
        media_type: guessMediaType(image.url)
      })
    });

    const mediaData = await mediaResponse.json();
    if (!mediaResponse.ok) throw new Error(JSON.stringify(mediaData));

    const postResponse = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: image.caption || "",
        media: {
          media_ids: [mediaData.data.id]
        }
      })
    });

    const postData = await postResponse.json();
    if (!postResponse.ok) throw new Error(JSON.stringify(postData));

    return { platform, ok: true, id: postData.data.id };
  } catch (error) {
    return { platform, ok: false, error: error.message };
  }
}
