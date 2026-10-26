"use client";

import { upload } from "@vercel/blob/client";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Video = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  platform: string;
  url: string;
  size: number;
  createdAt: string;
};

const allowed = ["video/mp4", "video/webm", "video/quicktime"];
const maxSize = 2 * 1024 * 1024 * 1024;

function formatBytes(size: number) {
  return `${(size / 1024 / 1024).toFixed(
    size >= 1024 * 1024 * 1024 ? 0 : 1
  )} MB`;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function VideoLibrary() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [platform, setPlatform] = useState("none");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async (): Promise<Video[]> => {
    const response = await fetch("/api/media/videos", {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        response.status === 401
          ? "Tu sesión terminó. Inicia sesión nuevamente."
          : data.error || "No se pudieron cargar los videos."
      );
    }

    const nextVideos = Array.isArray(data.videos) ? data.videos : [];
    setVideos(nextVideos);
    return nextVideos;
  };

  useEffect(() => {
    void load().catch((cause) =>
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron cargar los videos."
      )
    );
  }, []);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null;
    setError("");
    setNotice("");

    if (!selected) {
      setFile(null);
      return;
    }

    if (!allowed.includes(selected.type)) {
      setFile(null);
      setError("Selecciona un MP4, WebM o MOV válido.");
      return;
    }

    if (selected.size > maxSize) {
      setFile(null);
      setError("El archivo supera el límite configurado de 2 GB.");
      return;
    }

    setFile(selected);

    if (!title) {
      setTitle(selected.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!file || !title.trim()) {
      setError("Selecciona un video y escribe un título.");
      return;
    }

    setProgress(0);

    try {
      const blob = await upload(`videos/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/media/videos/upload",
        multipart: file.size > 100 * 1024 * 1024,
        clientPayload: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          platform,
          size: file.size,
          fingerprint: `${file.name}:${file.size}:${file.lastModified}`,
        }),
        onUploadProgress: ({ percentage }) => {
          setProgress(Math.round(percentage));
        },
      });

      setNotice("Archivo cargado. Verificando el registro de la biblioteca…");

      let confirmed = false;

      for (let attempt = 0; attempt < 15; attempt++) {
        await wait(1000);

        const currentVideos = await load();

        if (currentVideos.some((video) => video.url === blob.url)) {
          confirmed = true;
          break;
        }
      }

      if (!confirmed) {
        throw new Error(
          "El archivo se cargó, pero no se confirmó su registro en la biblioteca. No vuelvas a subirlo todavía; revisa los registros del servidor."
        );
      }

      setNotice("Video disponible en la biblioteca.");
      setFile(null);
      setTitle("");
      setDescription("");
      setTags("");

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo completar la carga del video."
      );
    } finally {
      setProgress(null);
    }
  }

  async function remove(video: Video) {
    if (
      !window.confirm(
        `¿Eliminar “${video.title}”? Esta acción borra el archivo almacenado.`
      )
    ) {
      return;
    }

    setError("");

    try {
      const response = await fetch(
        `/api/media/videos/${video.id}?confirm=true`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo eliminar el video.");
      }

      setVideos((current) =>
        current.filter((item) => item.id !== video.id)
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo eliminar el video."
      );
    }
  }

  async function edit(video: Video) {
    const nextTitle = window.prompt("Título", video.title);
    if (nextTitle === null) return;

    const nextDescription = window.prompt(
      "Descripción",
      video.description
    );
    if (nextDescription === null) return;

    const nextTags = window.prompt(
      "Etiquetas separadas por coma",
      video.tags.join(", ")
    );
    if (nextTags === null) return;

    setError("");

    try {
      const response = await fetch(`/api/media/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nextTitle,
          description: nextDescription,
          tags: nextTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          platform: video.platform,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar el video.");
      }

      setVideos((current) =>
        current.map((item) =>
          item.id === video.id ? data.video : item
        )
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo actualizar el video."
      );
    }
  }

  return (
    <article className="panel video-library">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">VIDEOS Y ACTIVOS</p>
          <h3>Biblioteca de video</h3>
        </div>
      </div>

      <form className="video-upload" onSubmit={submit}>
        <label>
          Archivo de video
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mov"
            onChange={selectFile}
            required
          />
        </label>

        <label>
          Título
          <input
            value={title}
            maxLength={160}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>

        <label>
          Descripción
          <textarea
            value={description}
            maxLength={4000}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <div className="modal-row">
          <label>
            Etiquetas (separadas por coma)
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
          </label>

          <label>
            Red prevista
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
            >
              <option value="none">Sin asignar</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>
          </label>
        </div>

        {file && (
          <p className="field-note">
            {file.name} · {formatBytes(file.size)}
          </p>
        )}

        {progress !== null && (
          <progress value={progress} max="100">
            {progress}%
          </progress>
        )}

        {error && (
          <div className="result-error">
            <b>No se pudo completar la operación.</b>
            <p>{error}</p>
          </div>
        )}

        {notice && <p className="field-note">{notice}</p>}

        <button
          className="primary"
          disabled={progress !== null}
          type="submit"
        >
          {progress === null ? "Subir video" : `Subiendo ${progress}%`}
        </button>
      </form>

      <div className="video-grid">
        {videos.map((video) => (
          <article className="video-card" key={video.id}>
            <video controls preload="metadata" src={video.url} />
            <b>{video.title}</b>
            <small>
              {formatBytes(video.size)} ·{" "}
              {new Date(video.createdAt).toLocaleString("es-CO")}
            </small>
            {video.description && <p>{video.description}</p>}
            <div>
              <span>{video.platform}</span>
              <span>
                <button
                  className="outline"
                  type="button"
                  onClick={() => void edit(video)}
                >
                  Editar
                </button>
                <button
                  className="outline"
                  type="button"
                  onClick={() => void remove(video)}
                >
                  Eliminar
                </button>
              </span>
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}
