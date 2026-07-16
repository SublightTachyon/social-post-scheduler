const graphVersion = process.env.GRAPH_API_VERSION || "v23.0";

export async function postToFacebook(image, { dryRun }) {
  const platform = "facebook";
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (dryRun) {
    console.log(`[DRY RUN] Would publish ${image.url} to Facebook Page.`);
    return { platform, ok: true, dryRun: true };
  }

  if (!pageId || !accessToken) {
    return { platform, ok: false, error: "Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN." };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${graphVersion}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        url: image.url,
        caption: image.caption || "",
        published: "true",
        access_token: accessToken
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    return { platform, ok: true, id: data.id, postId: data.post_id };
  } catch (error) {
    return { platform, ok: false, error: error.message };
  }
}
