import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { postToFacebook } from "./platforms/facebook.js";
import { postToInstagram } from "./platforms/instagram.js";
import { postToX } from "./platforms/x.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const imagesPath = path.join(rootDir, "data", "images.json");
const statePath = path.join(rootDir, "data", "state.json");

const args = new Set(process.argv.slice(2));
const dryRun = process.env.DRY_RUN !== "false";
const intervalDays = Number(process.env.POST_INTERVAL_DAYS || 7);
const checkEverySeconds = Number(process.env.CHECK_EVERY_SECONDS || 60);

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function nowIso() {
  return new Date().toISOString();
}

function isDue(state) {
  if (args.has("--force")) return true;
  if (!state.nextRunAt) return true;
  return new Date(state.nextRunAt).getTime() <= Date.now();
}

function scheduleNextRun(state) {
  const next = new Date();
  next.setDate(next.getDate() + intervalDays);
  state.nextRunAt = next.toISOString();
}

function pickUnusedImage(images, state) {
  const used = new Set(state.usedImageIds || []);
  return images.find((image) => !used.has(image.id));
}

function enabledPlatforms() {
  return (process.env.PLATFORMS || "instagram,facebook,x")
    .split(",")
    .map((platform) => platform.trim().toLowerCase())
    .filter(Boolean);
}

async function postToEnabledPlatforms(image) {
  const platforms = enabledPlatforms();
  const results = [];

  for (const platform of platforms) {
    if (platform === "instagram") {
      results.push(await postToInstagram(image, { dryRun }));
    } else if (platform === "facebook") {
      results.push(await postToFacebook(image, { dryRun }));
    } else if (platform === "x") {
      results.push(await postToX(image, { dryRun }));
    } else {
      results.push({ platform, ok: false, error: `Unknown platform: ${platform}` });
    }
  }

  return results;
}

async function runOnce() {
  const images = await readJson(imagesPath, []);
  const state = await readJson(statePath, {
    nextRunAt: null,
    usedImageIds: [],
    history: []
  });

  if (!isDue(state)) {
    console.log(`Not due yet. Next run: ${state.nextRunAt}`);
    return;
  }

  const image = pickUnusedImage(images, state);
  if (!image) {
    console.log("No unused images left. Stopping so no image repeats.");
    return;
  }

  console.log(`${dryRun ? "[DRY RUN] " : ""}Posting image ${image.id}`);
  const results = await postToEnabledPlatforms(image);
  const failed = results.filter((result) => !result.ok);

  if (failed.length > 0 && !dryRun) {
    console.error("At least one platform failed. State was not updated.");
    console.error(JSON.stringify(failed, null, 2));
    process.exitCode = 1;
    return;
  }

  state.usedImageIds = [...new Set([...(state.usedImageIds || []), image.id])];
  state.history = state.history || [];
  state.history.push({
    imageId: image.id,
    postedAt: nowIso(),
    dryRun,
    results
  });
  scheduleNextRun(state);
  await writeJson(statePath, state);

  console.log(`Marked ${image.id} as used.`);
  console.log(`Next run: ${state.nextRunAt}`);
}

if (args.has("--once")) {
  await runOnce();
} else {
  console.log(`Scheduler running. Checking every ${checkEverySeconds} seconds.`);
  await runOnce();
  setInterval(runOnce, checkEverySeconds * 1000);
}
