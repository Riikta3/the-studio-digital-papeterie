"use client";

import { uploadEditorImage } from "@/actions/invitation-editor-actions";

import type { EditorImageFolder } from "../types";
import { PhotoPicker } from "./PhotoPicker";
import { hintClass, labelClass } from "./styles";

/**
 * A photograph for the invitation: picked, uploaded at once, and only its URL
 * kept in the draft — which is what "Enregistrer" then writes. The file is in
 * storage from the moment it is picked; discarding the draft simply leaves it
 * unreferenced, as the dashboard's other photo fields always have.
 */
export function ImageField({
  label,
  value,
  onChange,
  folder,
  aspect = "video",
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: EditorImageFolder;
  aspect?: "video" | "square";
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      <PhotoPicker
        value={value || undefined}
        onChange={(url) => onChange(url ?? "")}
        onUpload={async (file) => {
          const formData = new FormData();
          formData.set("file", file);
          formData.set("folder", folder);
          return uploadEditorImage(formData);
        }}
        aspect={aspect}
        className={aspect === "square" ? "max-w-[220px]" : "max-w-md"}
      />
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}
