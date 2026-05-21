"use client";

import React, { useRef, useState } from "react";
import styled from "styled-components";
import { CircularProgress } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import toast from "react-hot-toast";
import { colors } from "@/lib/theme";

interface ImageUploadProps {
  /** Current image URL (controlled) */
  value: string;
  /** Called with the new Cloudinary URL after a successful upload */
  onChange: (url: string) => void;
  /** Cloudinary sub-folder inside 'schoolwheelz/', e.g. "profiles" or "cars" */
  folder: string;
  /** Optional label shown above the widget */
  label?: string;
  /** "small" renders a compact 80×80 square; default is a wider rectangle */
  size?: "small" | "default";
}

export default function ImageUpload({
  value,
  onChange,
  folder,
  label,
  size = "default",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const MAX_SIZE = 10 * 1024 * 1024;
    if (!ALLOWED.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP or GIF images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File is too large. Maximum size is 10 MB.");
      return;
    }

    setUploading(true);
    try {
      // Step 1: get a short-lived signature from our server (no file sent)
      const signRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: `schoolwheelz/${folder}` }),
      });
      const sign = await signRes.json();
      if (!signRes.ok) {
        toast.error(sign.error ?? "Could not get upload signature.");
        return;
      }

      // Step 2: upload directly from the browser to Cloudinary
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sign.apiKey);
      fd.append("timestamp", String(sign.timestamp));
      fd.append("signature", sign.signature);
      fd.append("folder", sign.folder);

      const upRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
        { method: "POST", body: fd },
      );
      const data = await upRes.json();

      if (!upRes.ok) {
        toast.error(data?.error?.message ?? "Upload failed.");
        return;
      }
      onChange(data.secure_url as string);
    } catch {
      toast.error("Upload failed. Check your connection.");
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    upload(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const small = size === "small";

  return (
    <Wrapper>
      {label && <Label>{label}</Label>}
      <DropZone
        small={small}
        hasImage={!!value}
        dragOver={dragOver}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        role="button"
        aria-label={label ?? "Upload image"}
      >
        {value && <Preview src={value} alt="Upload preview" />}

        <Overlay hasImage={!!value} uploading={uploading}>
          {uploading ? (
            <CircularProgress size={small ? 20 : 28} sx={{ color: "#fff" }} />
          ) : (
            <>
              <PhotoCameraIcon sx={{ fontSize: small ? 18 : 24, color: "#fff" }} />
              {!small && (
                <HintText>
                  {value ? "Change photo" : "Click or drag to upload"}
                </HintText>
              )}
            </>
          )}
        </Overlay>

        {!value && !uploading && (
          <PlaceholderContent small={small}>
            <PhotoCameraIcon sx={{ fontSize: small ? 22 : 32, color: colors.mutedText, mb: small ? 0 : 0.5 }} />
            {!small && (
              <PlaceholderText>
                Click or drag an image here
                <SubText>JPEG, PNG, WebP or GIF · max 10 MB</SubText>
              </PlaceholderText>
            )}
          </PlaceholderContent>
        )}
      </DropZone>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
        // Reset so the same file can be re-selected
        onClick={(e) => ((e.target as HTMLInputElement).value = "")}
      />
    </Wrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${colors.mutedText};
  letter-spacing: 0.01em;
`;

const DropZone = styled.div<{ small: boolean; hasImage: boolean; dragOver: boolean }>`
  position: relative;
  width: ${(p) => (p.small ? "80px" : "100%")};
  height: ${(p) => (p.small ? "80px" : "160px")};
  border-radius: ${(p) => (p.small ? "10px" : "12px")};
  border: 2px dashed ${(p) => (p.dragOver ? colors.skyBlue : p.hasImage ? "transparent" : colors.border)};
  background: ${(p) => (p.hasImage ? "#000" : p.dragOver ? `${colors.skyBlue}12` : colors.lightBg)};
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover > div[data-overlay] {
    opacity: 1;
  }
`;

const Preview = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
`;

const Overlay = styled.div<{ hasImage: boolean; uploading: boolean }>`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.48);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: inherit;
  opacity: ${(p) => (p.uploading ? 1 : p.hasImage ? 0 : 0)};
  transition: opacity 0.15s;
  pointer-events: none;
`;

const HintText = styled.span`
  font-size: 0.78rem;
  font-weight: 600;
  color: #fff;
`;

const PlaceholderContent = styled.div<{ small: boolean }>`
  display: flex;
  flex-direction: ${(p) => (p.small ? "row" : "column")};
  align-items: center;
  justify-content: center;
  gap: ${(p) => (p.small ? "0" : "8px")};
  pointer-events: none;
`;

const PlaceholderText = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 500;
  color: ${colors.mutedText};
  text-align: center;
`;

const SubText = styled.span`
  font-size: 0.72rem;
  font-weight: 400;
  color: ${colors.mutedText};
  opacity: 0.75;
`;
