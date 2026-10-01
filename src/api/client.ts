export interface SavedPhoto {
  id: string;
  createdAt: string;
  wornAccessoryIds: string[];
}

interface ErrorResponse {
  error?: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Gallery request failed (${response.status}).`;
    try {
      const body = (await response.json()) as ErrorResponse;
      if (body.error) message = body.error;
    } catch {
      // Keep the status-based message if the server returned a non-JSON error.
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function savePhoto(
  imageDataUrl: string,
  wornAccessoryIds: string[],
) {
  const response = await fetch("/api/photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl, wornAccessoryIds }),
  });
  return parseResponse<SavedPhoto>(response);
}

export async function listPhotos() {
  const response = await fetch("/api/photos");
  return parseResponse<SavedPhoto[]>(response);
}

export async function deletePhoto(id: string) {
  const response = await fetch(`/api/photos/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return parseResponse<void>(response);
}

export function photoImageUrl(id: string) {
  return `/api/photos/${encodeURIComponent(id)}`;
}
