"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

async function getWeddingId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Profil introuvable");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", profile.id)
    .single();
  if (!wedding) throw new Error("Mariage introuvable");

  return wedding.id;
}

export async function uploadGalleryImage(formData: FormData): Promise<{ url: string }> {
  const file = formData.get("file") as File;
  if (!file) throw new Error("Aucun fichier fourni");

  if (file.size > MAX_FILE_SIZE) throw new Error("Le fichier dépasse 5 Mo");
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Format non supporté (JPG ou PNG uniquement)");

  const weddingId = await getWeddingId();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${weddingId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from("gallery")
    .upload(filename, buffer, { contentType: file.type, upsert: false });

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("gallery")
    .getPublicUrl(filename);

  return { url: publicUrl };
}

export async function deleteGalleryImage(url: string): Promise<void> {
  const weddingId = await getWeddingId();

  // Extract path from URL: .../gallery/weddingId/filename
  const match = url.match(/gallery\/(.+)$/);
  if (!match) throw new Error("URL invalide");

  const path = match[1];
  // Security: ensure the path belongs to this wedding
  if (!path.startsWith(weddingId + "/")) throw new Error("Accès refusé");

  const { error } = await supabaseAdmin.storage.from("gallery").remove([path]);
  if (error) throw new Error(error.message);
}

export async function saveGalleryConfig(imageUrls: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, sites(id)")
    .eq("user_id", user.id)
    .single();
  if (!wedding) throw new Error("Mariage introuvable");

  const site = (wedding.sites as { id: string }[])?.[0];
  if (!site) throw new Error("Site introuvable");

  const { data: existing } = await supabase
    .from("site_modules")
    .select("id")
    .eq("site_id", site.id)
    .eq("module_id", "gallery")
    .maybeSingle();

  if (!existing) {
    await supabase.from("site_modules").insert({
      site_id: site.id,
      module_id: "gallery",
      config: { images: imageUrls },
      position: 0,
    });
  } else {
    await supabase.from("site_modules").update({ config: { images: imageUrls } }).eq("id", existing.id);
  }

  for (const locale of ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"]) {
    revalidatePath(`/${locale}/invitation`);
  }
  revalidatePath("/modules/gallery");
}
