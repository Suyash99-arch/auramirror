import { hasBlobStorage } from "../server/blobStore.js";

export default function handler(_request, response) {
  const configured = hasBlobStorage();
  response
    .status(configured ? 200 : 503)
    .setHeader("Cache-Control", "no-store")
    .json({ status: configured ? "ok" : "storage-unconfigured" });
}
