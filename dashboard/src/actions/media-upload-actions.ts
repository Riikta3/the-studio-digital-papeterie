"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

async function getWeddingId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!wedding) throw new Error("Mariage introuvable");

  return wedding.id;
}

export async function uploadVenueImage(formData: FormData): Promise<{ url: string }> {
  const file = formData.get("file") as File;
  if (!file) throw new Error("Aucun fichier fourni");

  const MAX = 10 * 1024 * 1024;
  const ALLOWED = ["image/jpeg", "image/jpg", "image/png"];
  if (file.size > MAX) throw new Error("Le fichier dépasse 10 Mo");
  if (!ALLOWED.includes(file.type)) throw new Error("Format non supporté (JPG ou PNG uniquement)");

  const weddingId = await getWeddingId();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${weddingId}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabaseAdmin.storage.from("venue").upload(filename, buffer, { contentType: file.type, upsert: true });
  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabaseAdmin.storage.from("venue").getPublicUrl(filename);
  return { url: publicUrl };
}

export async function uploadIntroVideo(formData: FormData): Promise<{ url: string }> {
  const file = formData.get("file") as File;
  if (!file) throw new Error("Aucun fichier fourni");

  const MAX = 100 * 1024 * 1024;
  const ALLOWED = ["video/mp4", "video/quicktime", "video/webm"];
  if (file.size > MAX) throw new Error("La vidéo dépasse 100 Mo");
  if (!ALLOWED.includes(file.type)) throw new Error("Format non supporté (MP4, MOV ou WebM uniquement)");

  const weddingId = await getWeddingId();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const filename = `${weddingId}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabaseAdmin.storage.from("videos").upload(filename, buffer, { contentType: file.type, upsert: true });
  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabaseAdmin.storage.from("videos").getPublicUrl(filename);
  return { url: publicUrl };
}
