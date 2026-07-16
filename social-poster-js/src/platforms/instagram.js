const graphVersion = process.env.GRAPH_API_VERSION || "v23.0";

async function graphPost(path, params) {
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }
  return data;
}

export async function postToInstagram(image, { dryRun }) {
  const platform = "instagram";
  const igUserId = process.env.INSTAGRAM_USER_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (dryRun) {
    console.log(`[DRY RUN] Would publish ${image.url} to Instagram.`);
    return { platform, ok: true, dryRun: true };
  }

  if (!igUserId || !accessToken) {
    return { platform, ok: false, error: "Missing INSTAGRAM_USER_ID or INSTAGRAM_ACCESS_TOKEN." };
  }

  try {
    const container = await graphPost(`${igUserId}/media`, {
      image_url: image.url,
      caption: image.caption || "",
      access_token: accessToken
    });

    const published = await graphPost(`${igUserId}/media_publish`, {
      creation_id: container.id,
      access_token: accessToken
    });

    return { platform, ok: true, id: published.id };
  } catch (error) {
    return { platform, ok: false, error: error.message };
  }
}
