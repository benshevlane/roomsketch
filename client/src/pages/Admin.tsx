import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET = "hero-images";
const OBJECT_PATH = "hero-floorplan.jpg";

export default function Admin() {
  const [heroExists, setHeroExists] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const getPublicUrl = useCallback((): string | null => {
    if (!supabase) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(OBJECT_PATH);
    return data.publicUrl;
  }, []);

  const checkHero = useCallback(async () => {
    if (!supabase) {
      setMessage("Supabase is not configured. Check environment variables.");
      setMessageType("error");
      return;
    }
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list("", { search: OBJECT_PATH });
      if (error) {
        console.error("Error checking hero image:", error);
        setHeroExists(false);
        return;
      }
      const exists = !!data && data.some((f) => f.name === OBJECT_PATH);
      setHeroExists(exists);
      if (exists) {
        const url = getPublicUrl();
        // Add cache-buster so the preview always shows the latest version
        setPreview(url ? `${url}?t=${Date.now()}` : null);
      } else {
        setPreview(null);
      }
    } catch (err) {
      console.error("Error checking hero image:", err);
      setHeroExists(false);
    }
  }, [getPublicUrl]);

  useEffect(() => { checkHero(); }, [checkHero]);

  const compressImage = (file: File, maxWidth = 1920, quality = 0.85): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Compression failed")),
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      setMessageType("error");
      return;
    }
    if (!supabase) {
      setMessage("Supabase is not configured. Check environment variables.");
      setMessageType("error");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const blob = await compressImage(file);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(OBJECT_PATH, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (error) {
        setMessage("Upload failed — " + error.message);
        setMessageType("error");
      } else {
        setMessage(`Uploaded successfully (${(blob.size / 1024).toFixed(0)} KB)`);
        setMessageType("success");
        await checkHero();
      }
    } catch (err) {
      setMessage("Upload failed — " + (err instanceof Error ? err.message : "unknown error"));
      setMessageType("error");
    }
    setUploading(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDelete = async () => {
    if (!supabase) return;
    const { error } = await supabase.storage.from(BUCKET).remove([OBJECT_PATH]);
    if (error) {
      setMessage("Delete failed — " + error.message);
      setMessageType("error");
      return;
    }
    setPreview(null);
    setHeroExists(false);
    setMessage("Hero image removed. The homepage will show the default illustration.");
    setMessageType("success");
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a1a18]">
      <div className="max-w-2xl mx-auto px-5 py-16">
        <a href="/" className="text-sm text-[#3d8a7c] hover:underline mb-6 inline-block">&larr; Back to site</a>
        <h1 className="text-3xl font-bold mb-2">Admin</h1>
        <p className="text-[#6b6457] mb-10">Manage the homepage hero image.</p>

        {/* Upload area */}
        <div
          ref={dropRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#d8d2c4] rounded-xl p-10 text-center cursor-pointer hover:border-[#3d8a7c] transition-colors"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) upload(e.target.files[0]); }}
          />
          <div className="text-4xl mb-3 text-[#c4bfb4]">{uploading ? "..." : "+"}</div>
          <p className="font-medium">{uploading ? "Uploading..." : "Drop an image here or click to browse"}</p>
          <p className="text-sm text-[#9a9488] mt-1">PNG, JPG, or WebP. Will be compressed and saved as the homepage hero image.</p>
        </div>

        {message && (
          <p className={`mt-4 text-sm font-medium ${messageType === "error" ? "text-red-600" : "text-[#3d8a7c]"}`}>{message}</p>
        )}

        {/* Current hero preview */}
        {heroExists && preview && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Current hero image</h2>
              <button
                onClick={onDelete}
                className="text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="rounded-xl border border-[#e8e3d8] overflow-hidden shadow-sm bg-white">
              <img src={preview} alt="Hero preview" className="w-full" />
            </div>
            <p className="text-xs text-[#9a9488] mt-2">Stored in Supabase Storage</p>
          </div>
        )}
      </div>
    </div>
  );
}
