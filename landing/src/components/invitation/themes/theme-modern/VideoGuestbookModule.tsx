"use client";

import { motion } from "framer-motion";
import { Camera, RefreshCcw, Send, Trash2, Video, X } from "lucide-react";
import { useRef, useState } from "react";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export function VideoGuestbookModule({
  weddingId,
  config,
}: {
  weddingId: string;
  config?: Record<string, any> | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(
        "Désolé, ce format n'est pas supporté. Utilisez du MP4, MOV ou WEBM.",
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "La vidéo est trop lourde (max 50 Mo). Essayez une vidéo plus courte !",
      );
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemove = () => {
    setVideoFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;

    setStatus("submitting");
    // Simuler l'upload
    setTimeout(() => {
      setStatus("success");
    }, 2500);
  };

  if (status === "success") {
    return (
      <section className='w-full py-10'>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='max-w-2xl mx-auto bg-white rounded-[2.5rem] p-12 md:p-16 border border-[#D35400]/20 shadow-xl text-center'
        >
          <div className='w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-8 text-[#D35400]'>
            <Video
              className='w-8 h-8'
              fill='none'
              stroke='currentColor'
            />
          </div>
          <h3 className='font-heading text-4xl italic text-[#0E2F44] mb-4'>
            Souvenir Enregistré
          </h3>
          <p className='text-[#0E2F44]/60 text-lg font-light leading-relaxed'>
            Merci pour ce message vidéo ! Les mariés seront ravis de découvrir
            votre surprise.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className='mt-10 text-xs font-bold uppercase tracking-widest text-[#D35400] underline'
          >
            Envoyer une autre vidéo
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className='w-full'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-4xl mx-auto px-4 text-center'
      >
        <p className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#0E2F44]/60 mb-4'>
          Souvenir Inoubliable
        </p>
        <h2 className='font-heading text-5xl md:text-6xl text-[#0E2F44] mb-8'>
          Livre d'Or{" "}
          <span className='italic text-[#D35400] opacity-80'>Vidéo</span>
        </h2>

        <div className='bg-white rounded-[2.5rem] p-8 md:p-16 border border-[#D35400]/20 shadow-xl max-w-2xl mx-auto'>
          {!previewUrl ? (
            <div className='space-y-8'>
              <div className='w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto text-[#D35400]'>
                <Camera className='w-10 h-10' />
              </div>
              <div className='space-y-4 max-w-sm mx-auto'>
                <p className='text-[#0E2F44]/60 text-base md:text-lg leading-relaxed font-light'>
                  Laissez-nous un petit mot, une anecdote ou vos vœux
                  directement en vidéo.
                </p>
                <p className='text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground/50'>
                  Capture directe ou upload (Max 50Mo)
                </p>
              </div>

              <input
                type='file'
                ref={fileInputRef}
                accept='video/*'
                capture='user'
                onChange={handleFileChange}
                className='hidden'
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className='w-full bg-[#D35400] hover:bg-primary/90 text-white py-5 rounded-full font-bold text-xs uppercase tracking-[0.3em] transition-all duration-300 shadow-xl shadow-primary/10 flex items-center justify-center gap-3'
              >
                Cliquer pour Enregistrer
              </button>

              {error && (
                <p className='text-red-500 text-xs font-medium bg-red-50 py-3 px-4 rounded-xl border border-red-100'>
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className='space-y-8'>
              <div className='relative aspect-[9/16] max-w-[280px] mx-auto rounded-[2rem] overflow-hidden border-4 border-[#F5F7F5] bg-black shadow-2xl'>
                <video
                  src={previewUrl}
                  className='w-full h-full object-cover'
                  controls={false}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <button
                  onClick={handleRemove}
                  className='absolute top-4 right-4 w-10 h-10 bg-card/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              <div className='space-y-4'>
                <button
                  onClick={handleSubmit}
                  disabled={status === "submitting"}
                  className='w-full bg-[#D35400] hover:bg-primary/90 disabled:bg-[#CCCCCC] text-white py-5 rounded-full font-bold text-xs uppercase tracking-[0.3em] transition-all duration-100 flex items-center justify-center gap-3'
                >
                  {status === "submitting" ? (
                    <>
                      Envoi en cours...{" "}
                      <RefreshCcw className='w-4 h-4 animate-spin' />
                    </>
                  ) : (
                    <>
                      Envoyer mon message <Send className='w-4 h-4' />
                    </>
                  )}
                </button>

                <button
                  type='button'
                  onClick={handleRemove}
                  className='text-xs font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-red-500 transition-colors flex items-center justify-center gap-2 mx-auto'
                >
                  <Trash2 className='w-4 h-4' /> Recommencer
                </button>
              </div>
            </div>
          )}

          <p className='mt-12 text-[10px] text-muted-foreground/40 italic'>
            Votre vidéo sera envoyée en privé uniquement aux futurs mariés.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
