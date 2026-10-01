import { del, get, list, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

const PREFIX = "auramirror/photos/";

export function hasBlobStorage() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID),
  );
}

async function readJson(pathname) {
  const blob = await get(pathname, { access: "private" });
  if (!blob || blob.statusCode !== 200) return null;
  return new Response(blob.stream).json();
}

export async function listSavedPhotos() {
  const metadataBlobs = [];
  let cursor;
  let hasMore = true;

  while (hasMore) {
    const page = await list({ prefix: PREFIX, limit: 1000, cursor });
    metadataBlobs.push(
      ...page.blobs.filter((blob) => blob.pathname.endsWith(".json")),
    );
    cursor = page.cursor;
    hasMore = page.hasMore;
  }

  const photos = await Promise.all(
    metadataBlobs.map((blob) => readJson(blob.pathname)),
  );
  return photos
    .filter(Boolean)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function savePhoto(image, wornAccessoryIds) {
  const id = randomUUID();
  const pathname = `${PREFIX}${id}`;
  const photo = {
    id,
    createdAt: new Date().toISOString(),
    wornAccessoryIds: [...new Set(wornAccessoryIds)],
  };

  await put(`${pathname}.png`, new Blob([image], { type: "image/png" }), {
    access: "private",
    addRandomSuffix: false,
    contentType: "image/png",
  });

  try {
    await put(`${pathname}.json`, JSON.stringify(photo), {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
    });
  } catch (error) {
    await del(`${pathname}.png`);
    throw error;
  }

  return photo;
}

export async function getPhotoImage(id) {
  return get(`${PREFIX}${id}.png`, { access: "private" });
}

export async function deleteSavedPhoto(id) {
  const metadataPath = `${PREFIX}${id}.json`;
  if (!(await get(metadataPath, { access: "private" }))) return false;
  await del([`${PREFIX}${id}.png`, metadataPath]);
  return true;
}
