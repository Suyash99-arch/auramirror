import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownToLine, ArrowLeft, Images, Trash2 } from "lucide-react";
import {
  deletePhoto,
  listPhotos,
  photoImageUrl,
  type SavedPhoto,
} from "../../api/client";
import { accessories } from "../../data/accessories";
import "./Gallery.css";

export default function Gallery() {
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listPhotos()
      .then((result) => active && setPhotos(result))
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Gallery could not be loaded.",
          );
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const remove = async (photo: SavedPhoto) => {
    setRemovingId(photo.id);
    setError(null);
    try {
      await deletePhoto(photo.id);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Photo could not be deleted.",
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className="gallery-page">
      <header className="gallery-header">
        <Link to="/studio" className="gallery-back" aria-label="Back to Studio">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="gallery-kicker">AURAMIRROR / COLLECTION</p>
          <h1>Your Gallery</h1>
        </div>
        <Link to="/studio" className="gallery-studio-link">
          Open Studio
        </Link>
      </header>

      {error && (
        <p className="gallery-message" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="gallery-message" aria-live="polite">
          Loading saved photos…
        </p>
      ) : photos.length === 0 ? (
        <section className="gallery-empty">
          <Images size={30} strokeWidth={1.5} />
          <h2>No saved looks yet</h2>
          <p>Captured looks saved from Studio will appear here.</p>
          <Link to="/studio" className="gallery-studio-link">
            Go to Studio
          </Link>
        </section>
      ) : (
        <section className="gallery-grid" aria-label="Saved photos">
          {photos.map((photo) => {
            const itemNames = photo.wornAccessoryIds
              .map((id) => accessories.find((item) => item.id === id)?.name)
              .filter((name): name is string => Boolean(name));
            const imageUrl = photoImageUrl(photo.id);
            return (
              <article className="gallery-item" key={photo.id}>
                <img
                  src={imageUrl}
                  alt={`AuraMirror look captured ${new Date(photo.createdAt).toLocaleString()}`}
                />
                <div className="gallery-item-info">
                  <time dateTime={photo.createdAt}>
                    {new Date(photo.createdAt).toLocaleString()}
                  </time>
                  <p>
                    {itemNames.length ? itemNames.join(" · ") : "Natural look"}
                  </p>
                  <div className="gallery-item-actions">
                    <a
                      href={imageUrl}
                      download={`auramirror-${photo.id}.png`}
                      aria-label="Download photo"
                    >
                      <ArrowDownToLine size={17} />
                    </a>
                    <button
                      type="button"
                      onClick={() => void remove(photo)}
                      disabled={removingId === photo.id}
                      aria-label="Delete photo"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
