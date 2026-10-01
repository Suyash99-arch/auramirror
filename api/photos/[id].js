import { Readable } from "node:stream";
import {
  deleteSavedPhoto,
  getPhotoImage,
  hasBlobStorage,
} from "../../server/blobStore.js";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sendJson(response, status, body) {
  response.status(status).setHeader("Cache-Control", "no-store").json(body);
}

export default async function handler(request, response) {
  if (!hasBlobStorage()) {
    sendJson(response, 503, {
      error:
        "Photo storage is not configured. Connect a Vercel Blob store to this project.",
    });
    return;
  }

  const id = request.query.id;
  if (typeof id !== "string" || !UUID.test(id)) {
    sendJson(response, 404, { error: "Photo not found." });
    return;
  }

  try {
    if (request.method === "GET") {
      const blob = await getPhotoImage(id);
      if (!blob || blob.statusCode !== 200) {
        sendJson(response, 404, { error: "Photo not found." });
        return;
      }
      response.status(200);
      response.setHeader("Content-Type", "image/png");
      response.setHeader("Cache-Control", "private, no-store");
      Readable.fromWeb(blob.stream).pipe(response);
      return;
    }

    if (request.method === "DELETE") {
      if (!(await deleteSavedPhoto(id))) {
        sendJson(response, 404, { error: "Photo not found." });
        return;
      }
      response.status(204).end();
      return;
    }

    response.setHeader("Allow", "GET, DELETE");
    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    console.error("Photo API request failed:", error);
    sendJson(response, 503, {
      error: "Photo storage is temporarily unavailable.",
    });
  }
}
