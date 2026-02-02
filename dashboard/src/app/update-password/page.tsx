"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we have a session (handled by Supabase implicitly via the link)
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // If the link is invalid or expired, redirect to login
        router.push("/login?error=invalid_link");
      }
    });
  }, [router]);

  const handleUpdate = async () => {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast.error("Erreur lors de la mise à jour", {
        description: error.message,
      });
      setLoading(false);
    } else {
      toast.success("Mot de passe défini avec succès !");
      router.push("/"); // Redirect to dashboard home
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
      <div className='max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 text-center'>
        <h1 className='font-heading text-3xl italic'>Bienvenue !</h1>
        <p className='text-gray-500'>
          Définissez votre mot de passe pour accéder à votre espace.
        </p>

        <input
          type='password'
          placeholder='Nouveau mot de passe'
          className='w-full px-4 py-3 rounded-xl border border-gray-200'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleUpdate}
          disabled={loading || !password}
          className='w-full py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50'
        >
          {loading ? "Chargement..." : "Accéder à mon espace"}
        </button>
      </div>
    </div>
  );
}
