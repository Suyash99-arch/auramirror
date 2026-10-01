import { createServer } from "node:http";
import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.API_PORT ?? 3001);
const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "data");
const PHOTOS_DIR = join(DATA_DIR, "photos");
const MANIFEST = join(DATA_DIR, "photos.json");
const MAX_BODY_BYTES = 24 * 1024 * 1024;
let manifestQueue = Promise.resolve();

async function ensureStorage() {
  await mkdir(PHOTOS_DIR, { recursive: true });
  try {
    await readFile(MANIFEST);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeFile(MANIFEST, "[]\n", "utf8");
  }
}

async function readPhotos() {
  await ensureStorage();
  return JSON.parse(await readFile(MANIFEST, "utf8"));
}

function updatePhotos(update) {
  const operation = manifestQueue.then(async () => {
    const photos = await readPhotos();
    const { next, result } = update(photos);
    const temporary = `${MANIFEST}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    await rename(temporary, MANIFEST);
    return result;
  });
  manifestQueue = operation.catch(() => {});
  return operation;
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES)
      throw Object.assign(new Error("Request body exceeds 24 MB."), {
        status: 413,
      });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON."), {
      status: 400,
    });
  }
}

const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, DELETE, OPTIONS",
  );
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const pathname = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? "localhost"}`,
  ).pathname;
  try {
    if (request.method === "GET" && pathname === "/api/health") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    if (request.method === "GET" && pathname === "/api/photos") {
      const photos = await readPhotos();
      photos.sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );
      sendJson(response, 200, photos);
      return;
    }

    if (request.method === "POST" && pathname === "/api/photos") {
      const body = await readJson(request);
      const match =
        typeof body.imageDataUrl === "string"
          ? /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(
              body.imageDataUrl,
            )
          : null;
      if (!match) {
        sendJson(response, 400, {
          error: "imageDataUrl must be a base64 PNG data URL.",
        });
        return;
      }
      if (
        !Array.isArray(body.wornAccessoryIds) ||
        !body.wornAccessoryIds.every((id) => typeof id === "string")
      ) {
        sendJson(response, 400, {
          error: "wornAccessoryIds must be an array of strings.",
        });
        return;
      }

      const image = Buffer.from(match[1], "base64");
      if (
        image.length < 8 ||
        !image
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ) {
        sendJson(response, 400, {
          error: "imageDataUrl does not contain a valid PNG image.",
        });
        return;
      }

      const photo = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        wornAccessoryIds: [...new Set(body.wornAccessoryIds)],
      };
      await writeFile(join(PHOTOS_DIR, `${photo.id}.png`), image, {
        flag: "wx",
      });
      await updatePhotos((photos) => ({
        next: [...photos, photo],
        result: photo,
      }));
      sendJson(response, 201, photo);
      return;
    }

    const photoMatch = /^\/api\/photos\/([^/]+)$/.exec(pathname);
    if (photoMatch && request.method === "GET") {
      const id = decodeURIComponent(photoMatch[1]);
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          id,
        )
      ) {
        sendJson(response, 404, { error: "Photo not found." });
        return;
      }
      const photos = await readPhotos();
      if (!photos.some((photo) => photo.id === id)) {
        sendJson(response, 404, { error: "Photo not found." });
        return;
      }
      try {
        const image = await readFile(join(PHOTOS_DIR, `${id}.png`));
        response.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": image.length,
          "Cache-Control": "no-store",
        });
        response.end(image);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        sendJson(response, 404, { error: "Photo image not found." });
      }
      return;
    }

    if (photoMatch && request.method === "DELETE") {
      const id = decodeURIComponent(photoMatch[1]);
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          id,
        )
      ) {
        sendJson(response, 404, { error: "Photo not found." });
        return;
      }
      const removed = await updatePhotos((photos) => {
        const exists = photos.some((photo) => photo.id === id);
        return {
          next: photos.filter((photo) => photo.id !== id),
          result: exists,
        };
      });
      if (!removed) {
        sendJson(response, 404, { error: "Photo not found." });
        return;
      }
      try {
        await unlink(join(PHOTOS_DIR, `${id}.png`));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      response.writeHead(204);
      response.end();
      return;
    }

    sendJson(response, 404, { error: "Not found." });
  } catch (error) {
    sendJson(response, error.status ?? 500, {
      error: error.message ?? "Internal server error.",
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`AuraMirror API listening on http://localhost:${PORT}`);
});
