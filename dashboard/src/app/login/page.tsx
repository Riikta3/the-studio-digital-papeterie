"use client";

import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { useActionState } from "react";
import { login } from "./actions";

const initialState = {
  error: "",
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className='min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4'>
      <div className='w-full max-w-sm space-y-8 text-center'>
        <div className='space-y-2'>
          <h1 className='font-heading text-4xl font-light text-stone-800 italic'>
            The Studio
          </h1>
          <p className='text-stone-500'>Votre espace personnel</p>
        </div>

        <form
          action={formAction}
          className='space-y-6 text-left'
        >
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              placeholder='votre@email.com'
              required
              className='bg-white border-stone-200 focus:border-stone-400 focus:ring-stone-400'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='password'>Mot de passe</Label>
            <Input
              id='password'
              name='password'
              type='password'
              required
              className='bg-white border-stone-200 focus:border-stone-400 focus:ring-stone-400'
            />
          </div>

          {state?.error && (
            <p className='text-sm text-red-500 font-medium'>{state.error}</p>
          )}

          <Button
            type='submit'
            disabled={isPending}
            className='w-full bg-[#1B2A41] hover:bg-[#2C3E50] text-white py-6 text-lg font-light disabled:opacity-50'
          >
            {isPending ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
