"use client";

import { validateWeddingCode } from "@/actions/rsvp-actions";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function RsvpPage() {
  const [step, setStep] = useState<"code" | "search" | "form" | "success">(
    "code",
  );
  const [loading, setLoading] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [coupleNames, setCoupleNames] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<any | null>(null);

  // STEP 1: Validate Code
  async function handleCodeSubmit(formData: FormData) {
    setLoading(true);
    const code = formData.get("code") as string;

    try {
      const result = await validateWeddingCode(code);
      if (result.success && result.weddingId) {
        setWeddingId(result.weddingId);
        setCoupleNames(result.coupleNames || "Mariés");
        setStep("search");
      } else {
        toast.error(result.message || "Code invalide");
      }
    } catch (e) {
      console.error(e);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: Search Household
  async function handleSearch(formData: FormData) {
    if (!weddingId) return;
    setLoading(true);
    const query = formData.get("name") as string;

    try {
      const result = await searchHousehold(weddingId, query as string);
      if (result.success && result.households) {
        if (result.households.length === 0) {
          toast.error("Aucun foyer trouvé. Essayez juste le nom de famille.");
        } else {
          setSearchResults(result.households);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur de recherche");
    } finally {
      setLoading(false);
    }
  }

  function selectHousehold(household: any) {
    setSelectedHousehold(household);
    setStep("form");
  }

  // STEP 3: Submit Update
  async function handleRsvpSubmit(formData: FormData) {
    if (!weddingId || !selectedHousehold) return;
    setLoading(true);

    try {
      const result = await updateHouseholdRsvp(
        weddingId,
        selectedHousehold.id,
        formData,
      );
      if (result.success) {
        setStep("success");
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur technique");
    } finally {
      setLoading(false);
    }
  }

  // ... RENDER STEPS ...

  if (step === "code") {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4'>
        <div className='max-w-md w-full space-y-8 text-center'>
          <div>
            <h1 className='font-heading text-4xl text-gray-900'>Bienvenue</h1>
            <p className='mt-2 text-gray-600'>
              Entrez votre code invité pour accéder au formulaire.
            </p>
          </div>
          <form
            action={handleCodeSubmit}
            className='mt-8 space-y-6 bg-white p-8 rounded-xl shadow-sm border border-stone-100'
          >
            <div className='space-y-2 text-left'>
              <Label htmlFor='code'>Code Mariage</Label>
              <Input
                id='code'
                name='code'
                placeholder='Ex: AMOUR2026'
                className='text-center uppercase tracking-widest text-lg h-12'
                required
              />
            </div>
            <Button
              type='submit'
              className='w-full h-12 font-heading text-lg'
              disabled={loading}
            >
              {loading ? <Loader2 className='animate-spin mr-2' /> : null}
              Accéder
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (step === "search") {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4'>
        <div className='max-w-md w-full space-y-8 text-center'>
          <div>
            <h1 className='font-heading text-4xl text-gray-900'>
              {coupleNames}
            </h1>
            <p className='mt-2 text-gray-600'>Retrouvez votre invitation.</p>
          </div>

          <form
            action={handleSearch}
            className='mt-4 space-y-4 bg-white p-6 rounded-xl shadow-sm border border-stone-100'
          >
            <div className='space-y-2 text-left'>
              <Label htmlFor='name'>Votre Nom / Famille</Label>
              <Input
                id='name'
                name='name'
                placeholder='Ex: Dupont'
                required
              />
            </div>
            <Button
              type='submit'
              className='w-full'
              disabled={loading}
            >
              {loading ? (
                <Loader2 className='animate-spin mr-2' />
              ) : (
                "Rechercher"
              )}
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className='space-y-2 text-left'>
              <p className='text-sm text-muted-foreground ml-1'>
                Sélectionnez votre foyer :
              </p>
              {searchResults.map((h) => (
                <button
                  key={h.id}
                  onClick={() => selectHousehold(h)}
                  className='w-full text-left p-4 bg-white border border-stone-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all group'
                >
                  <span className='font-medium text-lg block group-hover:text-primary'>
                    {h.name}
                  </span>
                  <span className='text-sm text-gray-500'>
                    {h.guests?.length || 0} invité(s)
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "form" && selectedHousehold) {
    return (
      <div className='min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-2xl mx-auto'>
          <div className='text-center mb-10'>
            <h2 className='text-sm font-semibold text-primary tracking-widest uppercase'>
              Réponse pour
            </h2>
            <h1 className='font-heading text-5xl mt-2 text-gray-900'>
              {selectedHousehold.name}
            </h1>
          </div>

          <form
            action={handleRsvpSubmit}
            className='bg-white shadow-sm rounded-xl border border-stone-100 overflow-hidden'
          >
            <div className='p-8 space-y-10'>
              {/* Section Update Main Contact */}
              <div className='space-y-4'>
                <h3 className='font-heading text-2xl text-gray-800 border-b border-stone-100 pb-2'>
                  Email de contact
                </h3>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email pour recevoir les infos</Label>
                  <Input
                    id='email'
                    name='email'
                    defaultValue={selectedHousehold.email || ""}
                    placeholder='votre@email.com'
                  />
                </div>
              </div>

              {/* Section Guests Loop */}
              <div className='space-y-6'>
                <h3 className='font-heading text-2xl text-gray-800 border-b border-stone-100 pb-2'>
                  Invités
                </h3>

                {selectedHousehold.guests?.map((guest: any) => (
                  <div
                    key={guest.id}
                    className='p-4 bg-stone-50 rounded-lg border border-stone-100 space-y-4'
                  >
                    <div className='flex justify-between items-center'>
                      <span className='font-medium text-lg'>
                        {guest.first_name}{" "}
                        {guest.last_name !== "." ? guest.last_name : ""}
                      </span>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label>Présence *</Label>
                        <select
                          name={`guest_${guest.id}_status`}
                          className='w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm'
                          defaultValue={
                            guest.status === "pending"
                              ? "confirmed"
                              : guest.status
                          }
                        >
                          <option value='confirmed'>Je serai là</option>
                          <option value='declined'>
                            Je ne pourrai pas venir
                          </option>
                        </select>
                      </div>
                      <div className='space-y-2'>
                        <Label>Régime / Allergies</Label>
                        <Input
                          name={`guest_${guest.id}_dietary`}
                          placeholder='Ex: Végétarien'
                          defaultValue={guest.dietary_requirements || ""}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Section Common Details */}
              <div className='space-y-6'>
                {/* Song */}
                <div className='space-y-2'>
                  <Label className='flex items-center gap-2'>
                    <span>🎵</span> Une chanson incontournable ?
                  </Label>
                  <Input
                    name='song'
                    placeholder='Artiste - Titre'
                    defaultValue={selectedHousehold.song_request || ""}
                  />
                </div>

                {/* Transport */}
                <div className='space-y-3'>
                  <Label>Transport</Label>
                  <div className='flex flex-col gap-2'>
                    <label className='flex items-center space-x-2'>
                      <input
                        type='radio'
                        name='transport'
                        value='bus'
                        className='w-4 h-4 text-primary'
                        defaultChecked={
                          selectedHousehold.transportation === "bus"
                        }
                      />
                      <span>Je prendrai la navette</span>
                    </label>
                    <label className='flex items-center space-x-2'>
                      <input
                        type='radio'
                        name='transport'
                        value='car'
                        className='w-4 h-4 text-primary'
                        defaultChecked={
                          selectedHousehold.transportation === "car"
                        }
                      />
                      <span>Je viendrai par mes propres moyens</span>
                    </label>
                  </div>
                </div>

                {/* Message */}
                <div className='space-y-2 pt-4'>
                  <Label htmlFor='message'>Message pour les mariés</Label>
                  <textarea
                    id='message'
                    name='message'
                    className='w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-ring'
                    defaultValue={selectedHousehold.message_to_couple || ""}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className='bg-gray-50 px-8 py-6 border-t border-gray-100 flex justify-end'>
              <Button
                type='submit'
                size='lg'
                className='px-8'
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Envoi en cours...
                  </>
                ) : (
                  "Confirmer ma réponse"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Success Step (Same as before)
  if (step === "success") {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4'>
        <div className='max-w-md w-full text-center space-y-6'>
          <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600'>
            <svg
              className='w-10 h-10'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          </div>
          <h2 className='font-heading text-4xl text-gray-900'>Merci !</h2>
          <p className='text-gray-600'>Votre réponse a bien été enregistrée.</p>
          <Button
            variant='outline'
            onClick={() => setStep("code")}
          >
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    );
  }

  return <div>Loading...</div>; // Should not happen
}
