import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export async function syncImagesFromFolder(imagesDir, imagesJsonPath, baseUrl = "http://localhost:3000/images") {
  try {
    // Read existing images.json
    let images = [];
    try {
      const content = await readFile(imagesJsonPath, "utf8");
      images = JSON.parse(content);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    // Get existing image IDs
    const existingIds = new Set(images.map((img) => img.id));

    // Read files from images folder
    let files;
    try {
      files = await readdir(imagesDir);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log("Images folder does not exist yet. Create data/images/ and add images.");
        return images;
      }
      throw error;
    }

    // Filter for image files
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // Add new images
    let added = 0;
    for (const file of imageFiles) {
      const idFromFile = path.parse(file).name;
      const uniqueId = existingIds.has(idFromFile)
        ? `${idFromFile}-${crypto.randomBytes(4).toString("hex")}`
        : idFromFile;

      if (!existingIds.has(uniqueId)) {
        images.push({
          id: uniqueId,
          url: `${baseUrl}/${file}`,
          caption: `Image: ${file}`
        });
        existingIds.add(uniqueId);
        added++;
      }
    }

    // Write back to images.json if new images were added
    if (added > 0) {
      await writeFile(imagesJsonPath, `${JSON.stringify(images, null, 2)}\n`);
      console.log(`Added ${added} new image(s) to images.json`);
    }

    return images;
  } catch (error) {
    console.error("Error syncing images:", error.message);
    throw error;
  }
}
