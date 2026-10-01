import {
  hasBlobStorage,
  listSavedPhotos,
  savePhoto,
} from "../server/blobStore.js";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const PNG_DATA_URL = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/;

export const config = { api: { bodyParser: { sizeLimit: "4.5mb" } } };

function sendJson(response, status, body) {
  response.status(status).setHeader("Cache-Control", "no-store").json(body);
}

function storageUnavailable(response) {
  sendJson(response, 503, {
    error:
      "Photo storage is not configured. Connect a Vercel Blob store to this project.",
  });
}

export default async function handler(request, response) {
  if (!hasBlobStorage()) {
    storageUnavailable(response);
    return;
  }

  try {
    if (request.method === "GET") {
      sendJson(response, 200, await listSavedPhotos());
      return;
    }

    if (request.method !== "POST") {
      response.setHeader("Allow", "GET, POST");
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    const { imageDataUrl, wornAccessoryIds } = request.body ?? {};
    const match =
      typeof imageDataUrl === "string" ? PNG_DATA_URL.exec(imageDataUrl) : null;
    if (!match) {
      sendJson(response, 400, {
        error: "imageDataUrl must be a base64 PNG data URL.",
      });
      return;
    }
    if (
      !Array.isArray(wornAccessoryIds) ||
      !wornAccessoryIds.every((id) => typeof id === "string")
    ) {
      sendJson(response, 400, {
        error: "wornAccessoryIds must be an array of strings.",
      });
      return;
    }

    const image = Buffer.from(match[1], "base64");
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (
      image.length < pngSignature.length ||
      image.length > MAX_IMAGE_BYTES ||
      !image.subarray(0, pngSignature.length).equals(pngSignature)
    ) {
      sendJson(response, 400, {
        error: "imageDataUrl must contain a PNG no larger than 3 MB.",
      });
      return;
    }

    sendJson(response, 201, await savePhoto(image, wornAccessoryIds));
  } catch (error) {
    console.error("Photo API request failed:", error);
    sendJson(response, 503, {
      error: "Photo storage is temporarily unavailable.",
    });
  }
}
