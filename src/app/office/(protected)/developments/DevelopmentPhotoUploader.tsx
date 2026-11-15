"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

async function compressImage(file: File): Promise<Blob> {
  const image = await createImageBitmap(file);

  try {
    const maxDimension = 1600;
    const scale = Math.min(
      1,
      maxDimension / Math.max(image.width, image.height),
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to process image.");
    }

    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Image compression failed."));
          }
        },
        "image/webp",
        0.82,
      );
    });
  } finally {
    image.close();
  }
}

type Props = {
  developmentId: number;
};

export default function DevelopmentPhotoUploader({
  developmentId,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = event.target.files;

    if (!files?.length) return;

    setUploading(true);
    setMessage("");

    try {
      const supabase = createClient();

      for (const file of Array.from(files)) {
        const compressedFile = await compressImage(file);
        const path = `${developmentId}/${crypto.randomUUID()}.webp`;

        const { error } = await supabase.storage
          .from("development-photos")
          .upload(path, compressedFile, {
            contentType: "image/webp",
            upsert: false,
          });

        if (error) throw error;

        const { error: dbError } = await supabase.rpc(
          "development_management_add_photo",
          {
            p_development_profile_id: developmentId,
            p_storage_path: path,
            p_caption: file.name,
            p_alt_text: file.name,
          },
        );

        if (dbError) throw dbError;
      }

      setMessage("Photos uploaded successfully.");
      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Photo upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-6">
      <label className="block text-sm font-semibold">
        Upload Development Photos
      </label>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={uploading}
        onChange={handleUpload}
        className="mt-3 block w-full text-sm"
      />

      {uploading && (
        <p className="mt-3 text-sm text-sky-700">
          Uploading photos...
        </p>
      )}

      {message && (
        <p className="mt-3 text-sm">{message}</p>
      )}
    </div>
  );
}