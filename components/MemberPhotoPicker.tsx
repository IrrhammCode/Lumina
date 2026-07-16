"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import MemberAvatar from "@/components/MemberAvatar";
import { readPhotoFile, isCustomPhotoUrl, PhotoUploadError } from "@/lib/photo-upload";
import { family } from "@/lib/copy";

type MemberPhotoPickerProps = {
  name: string;
  id?: string;
  code?: string;
  photoUrl?: string;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  onPhotoChange: (photoUrl: string | undefined) => void;
  disabled?: boolean;
};

export default function MemberPhotoPicker({
  name,
  id,
  code,
  photoUrl,
  size = "md",
  className = "",
  onPhotoChange,
  disabled = false,
}: MemberPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCustom = isCustomPhotoUrl(photoUrl);

  const openPicker = () => {
    if (disabled || busy) return;
    setError(null);
    inputRef.current?.click();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await readPhotoFile(file);
      onPhotoChange(dataUrl);
    } catch (err) {
      setError(err instanceof PhotoUploadError ? err.message : family.photoError);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || busy) return;
    onPhotoChange(undefined);
    setError(null);
  };

  return (
    <div className={`member-photo-picker-wrap ${className}`}>
      <button
        type="button"
        className="member-photo-picker"
        onClick={openPicker}
        disabled={disabled || busy}
        aria-label={family.photoChange(name)}
      >
        <MemberAvatar name={name} id={id} code={code} photoUrl={photoUrl} size={size} />
        <span className="member-photo-picker-badge" aria-hidden>
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
        </span>
        {hasCustom && !busy && (
          <span
            role="button"
            tabIndex={0}
            className="member-photo-picker-remove"
            aria-label={family.photoRemove(name)}
            onClick={removePhoto}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                removePhoto(e as unknown as React.MouseEvent);
              }
            }}
          >
            <X size={10} />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/*"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {error && <p className="member-photo-picker-error">{error}</p>}
    </div>
  );
}