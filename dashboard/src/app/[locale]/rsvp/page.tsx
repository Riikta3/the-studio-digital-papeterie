"use client";

import {
  registerNewHousehold,
  searchHousehold,
  updateHouseholdRsvp,
  validateWeddingCode,
} from "@/actions/rsvp-actions";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export default function RsvpPage() {
  const t = useTranslations("RsvpForm");
  const [step, setStep] = useState<
    "code" | "search" | "form" | "register" | "success"
  >("code");
  const [loading, setLoading] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [coupleNames, setCoupleNames] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<any | null>(null);

  // Registration State
  const [newGuests, setNewGuests] = useState<
    Array<{
      id: number;
      firstName: string;
      lastName: string;
      status: string;
      dietary: string;
    }>
  >([{ id: 0, firstName: "", lastName: "", status: "confirmed", dietary: "" }]);

  // STEP 1: Validate Code
  async function handleCodeSubmit(formData: FormData) {
    setLoading(true);
    const code = formData.get("code") as string;
    try {
      const result = await validateWeddingCode(code);
      if (result.success && result.weddingId) {
        setWeddingId(result.weddingId);
        setCoupleNames(result.coupleNames || t("code_step.default_couple_names"));
        setStep("search");
      } else {
        toast.error(result.message || t("code_step.invalid_code"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("code_step.generic_error"));
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
        setSearchResults(result.households || []);
        if (result.households?.length === 0) {
          toast.info(t("search_step.no_household_found"), { duration: 4000 });
        }
      }
    } catch (e) {
      console.error(e);
      toast.error(t("search_step.search_error"));
    } finally {
      setLoading(false);
    }
  }

  function selectHousehold(household: any) {
    setSelectedHousehold(household);
    setStep("form");
  }

  // STEP 3: Submit Update (Existing Household)
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
        toast.error(result.error || t("form_step.generic_error"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("form_step.technical_error"));
    } finally {
      setLoading(false);
    }
  }

  // STEP 4: Submit New Registration
  async function handleRegisterSubmit(formData: FormData) {
    if (!weddingId) return;
    setLoading(true);

    // Check if at least one guest name
    if (!newGuests[0].firstName) {
      toast.error(t("register_step.missing_guest_name"));
      setLoading(false);
      return;
    }

    try {
      const result = await registerNewHousehold(weddingId, formData);
      if (result.success) {
        setStep("success");
      } else {
        toast.error(result.error || t("register_step.generic_error"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("register_step.technical_error"));
    } finally {
      setLoading(false);
    }
  }

  // Helper for new guests
  const addGuestField = () => {
    setNewGuests([
      ...newGuests,
      {
        id: newGuests.length,
        firstName: "",
        lastName: "",
        status: "confirmed",
        dietary: "",
      },
    ]);
  };

  const removeGuestField = (index: number) => {
    if (newGuests.length > 1) {
      const updated = newGuests.filter((_, i) => i !== index);
      setNewGuests(updated);
    }
  };

  // RENDER

  if (step === "code") {
    return (
      <div className='min-h-screen flex items-center justify-center bg-studio-creme p-4'>
        <div className='max-w-md w-full space-y-8 text-center'>
          <div>
            <h1 className='font-heading text-h1 text-studio-violet'>
              {t("code_step.title")}
            </h1>
            <p className='mt-2 text-studio-violet/70'>
              {t("code_step.subtitle")}
            </p>
          </div>
          <form
            action={handleCodeSubmit}
            className='mt-8 space-y-6 bg-white p-8 rounded-xl shadow-sm border border-studio-lavande/30'
          >
            <div className='space-y-2 text-left'>
              <Label htmlFor='code'>{t("code_step.code_label")}</Label>
              <Input
                id='code'
                name='code'
                placeholder={t("code_step.code_placeholder")}
                className='text-center uppercase tracking-widest text-lg h-12'
                required
              />
            </div>
            <Button
              type='submit'
              className='w-full h-12 font-heading text-lg'
              disabled={loading}
            >
              {loading ? <Loader2 className='animate-spin mr-2' /> : null}{" "}
              {t("code_step.submit")}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (step === "search") {
    return (
      <div className='min-h-screen flex items-center justify-center bg-studio-creme p-4'>
        <div className='max-w-md w-full space-y-8 text-center'>
          <div>
            <h1 className='font-heading text-h1 text-studio-violet'>
              {coupleNames}
            </h1>
            <p className='mt-2 text-studio-violet/70'>
              {t("search_step.subtitle")}
            </p>
          </div>

          <form
            action={handleSearch}
            className='mt-4 space-y-4 bg-white p-6 rounded-xl shadow-sm border border-studio-lavande/30'
          >
            <div className='space-y-2 text-left'>
              <Label htmlFor='name'>{t("search_step.name_label")}</Label>
              <Input
                id='name'
                name='name'
                placeholder={t("search_step.name_placeholder")}
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
                t("search_step.submit")
              )}
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className='space-y-2 text-left animate-in fade-in slide-in-from-bottom-2'>
              <p className='text-sm text-muted-foreground ml-1'>
                {t("search_step.select_household")}
              </p>
              {searchResults.map((h) => (
                <button
                  key={h.id}
                  onClick={() => selectHousehold(h)}
                  className='w-full text-left p-4 bg-white border border-studio-lavande/40 rounded-lg hover:border-primary hover:bg-primary/5 transition-all group'
                >
                  <span className='font-medium text-lg block group-hover:text-primary'>
                    {h.name}
                  </span>
                  <span className='text-sm text-studio-violet/60'>
                    {t("search_step.guests_count", {
                      count: h.guests?.length || 0,
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className='relative pt-4'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t border-studio-lavande/40' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-studio-creme px-2 text-studio-violet/60'>
                {t("search_step.or")}
              </span>
            </div>
          </div>

          <Button
            variant='outline'
            className='w-full'
            onClick={() => setStep("register")}
          >
            {t("search_step.not_in_list")}
          </Button>
        </div>
      </div>
    );
  }

  // REGISTER NEW HOUSEHOLD
  if (step === "register") {
    return (
      <div className='min-h-screen bg-studio-creme py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-2xl mx-auto'>
          <div className='text-center mb-10'>
            <h2 className='text-sm font-semibold text-primary tracking-widest uppercase'>
              {t("register_step.eyebrow")}
            </h2>
            <h1 className='font-heading text-h1 mt-2 text-studio-violet'>
              {t("register_step.title")}
            </h1>
          </div>

          <form
            action={handleRegisterSubmit}
            className='bg-white shadow-sm rounded-xl border border-studio-lavande/30 overflow-hidden'
          >
            <div className='p-8 space-y-10'>
              {/* Main Details */}
              <div className='space-y-4'>
                <h3 className='font-heading text-h3 text-studio-violet border-b border-studio-lavande/30 pb-2'>
                  {t("register_step.coordinates")}
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>{t("register_step.household_name_label")}</Label>
                    <Input
                      name='name'
                      placeholder={t("register_step.household_name_placeholder")}
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>{t("register_step.email_label")}</Label>
                    <Input
                      name='email'
                      placeholder={t("register_step.email_placeholder")}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Guests */}
              <div className='space-y-6'>
                <div className='flex justify-between items-center border-b border-studio-lavande/30 pb-2'>
                  <h3 className='font-heading text-h3 text-studio-violet'>
                    {t("register_step.guests")}
                  </h3>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={addGuestField}
                  >
                    <Plus className='w-4 h-4 mr-2' />{" "}
                    {t("register_step.add_guest")}
                  </Button>
                </div>

                {newGuests.map((guest, index) => (
                  <div
                    key={index}
                    className='p-4 bg-studio-lavande/5 rounded-lg border border-studio-lavande/30 space-y-4 relative group'
                  >
                    {index > 0 && (
                      <button
                        type='button'
                        onClick={() => removeGuestField(index)}
                        className='absolute top-4 right-4 text-studio-violet/40 hover:text-red-500'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    )}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label>{t("register_step.first_name_label")}</Label>
                        <Input
                          name={`guest_${index}_firstname`}
                          required
                          onChange={(e) => {
                            const updated = [...newGuests];
                            updated[index].firstName = e.target.value;
                            setNewGuests(updated);
                          }}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label>{t("register_step.last_name_label")}</Label>
                        <Input
                          name={`guest_${index}_lastname`}
                          placeholder={t("register_step.last_name_placeholder")}
                        />
                      </div>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label>{t("register_step.presence_label")}</Label>
                        <select
                          name={`guest_${index}_status`}
                          className='w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm'
                        >
                          <option value='confirmed'>
                            {t("register_step.presence_confirmed")}
                          </option>
                          <option value='declined'>
                            {t("register_step.presence_declined")}
                          </option>
                        </select>
                      </div>
                      <div className='space-y-2'>
                        <Label>{t("register_step.dietary_label")}</Label>
                        <Input
                          name={`guest_${index}_dietary`}
                          placeholder={t("register_step.dietary_placeholder")}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Common Details (Same as update) */}
              <div className='space-y-6'>
                <div className='space-y-2'>
                  <Label>{t("register_step.song_label")}</Label>
                  <Input
                    name='song'
                    placeholder={t("register_step.song_placeholder")}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>{t("register_step.message_label")}</Label>
                  <textarea
                    name='message'
                    className='w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm'
                    placeholder={t("register_step.message_placeholder")}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className='bg-studio-lavande/5 px-8 py-6 border-t border-studio-lavande/30 flex justify-between items-center'>
              <button
                type='button'
                onClick={() => setStep("search")}
                className='text-sm text-studio-violet/60 hover:underline'
              >
                {t("register_step.cancel")}
              </button>
              <Button
                type='submit'
                size='lg'
                className='px-8'
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  t("register_step.submit")
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // FORM UPDATE EXISTING (Step "form")
  if (step === "form" && selectedHousehold) {
    return (
      <div className='min-h-screen bg-studio-creme py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-2xl mx-auto'>
          {/* ... Header similar to register ... */}
          <div className='text-center mb-10'>
            <h2 className='text-sm font-semibold text-primary tracking-widest uppercase'>
              {t("form_step.eyebrow")}
            </h2>
            <h1 className='font-heading text-h1 mt-2 text-studio-violet'>
              {selectedHousehold.name}
            </h1>
          </div>

          <form
            action={handleRsvpSubmit}
            className='bg-white shadow-sm rounded-xl border border-studio-lavande/30 overflow-hidden'
          >
            <div className='p-8 space-y-10'>
              {/* Contact */}
              <div className='space-y-4'>
                <h3 className='font-heading text-h3 text-studio-violet border-b border-studio-lavande/30 pb-2'>
                  {t("form_step.contact_email")}
                </h3>
                <Input
                  id='email'
                  name='email'
                  defaultValue={selectedHousehold.email || ""}
                  placeholder={t("form_step.email_placeholder")}
                  required
                />
              </div>

              {/* Guests Loop */}
              <div className='space-y-6'>
                <h3 className='font-heading text-h3 text-studio-violet border-b border-studio-lavande/30 pb-2'>
                  {t("form_step.guests")}
                </h3>
                {selectedHousehold.guests?.map((guest: any) => (
                  <div
                    key={guest.id}
                    className='p-4 bg-studio-lavande/5 rounded-lg border border-studio-lavande/30 space-y-4'
                  >
                    <div className='flex justify-between items-center'>
                      <span className='font-medium text-lg'>
                        {guest.first_name}{" "}
                        {guest.last_name !== "." ? guest.last_name : ""}
                      </span>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label>{t("form_step.presence_label")}</Label>
                        <select
                          name={`guest_${guest.id}_status`}
                          className='w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm'
                          defaultValue={
                            guest.status === "pending"
                              ? "confirmed"
                              : guest.status
                          }
                        >
                          <option value='confirmed'>
                            {t("form_step.presence_confirmed")}
                          </option>
                          <option value='declined'>
                            {t("form_step.presence_declined")}
                          </option>
                        </select>
                      </div>
                      <div className='space-y-2'>
                        <Label>{t("form_step.dietary_label")}</Label>
                        <Input
                          name={`guest_${guest.id}_dietary`}
                          placeholder={t("form_step.dietary_placeholder")}
                          defaultValue={guest.dietary_requirements || ""}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Common */}
              <div className='space-y-6'>
                <div className='space-y-2'>
                  <Label>{t("form_step.song_label")}</Label>
                  <Input
                    name='song'
                    placeholder={t("form_step.song_placeholder")}
                    defaultValue={selectedHousehold.song_request || ""}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>{t("form_step.transport_label")}</Label>
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
                      <span>{t("form_step.transport_shuttle")}</span>
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
                      <span>{t("form_step.transport_own")}</span>
                    </label>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>{t("form_step.message_label")}</Label>
                  <textarea
                    name='message'
                    className='w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm'
                    defaultValue={selectedHousehold.message_to_couple || ""}
                  />
                </div>
              </div>
            </div>

            <div className='bg-studio-lavande/5 px-8 py-6 border-t border-studio-lavande/30 flex justify-end'>
              <Button
                type='submit'
                size='lg'
                className='px-8'
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  t("form_step.submit")
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className='min-h-screen flex items-center justify-center bg-studio-creme p-4'>
        <div className='max-w-md w-full text-center space-y-6'>
          <div className='w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto text-teal-600'>
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
          <h2 className='font-heading text-h1 text-studio-violet'>
            {t("success_step.title")}
          </h2>
          <p className='text-studio-violet/70'>{t("success_step.subtitle")}</p>
          <Button
            variant='outline'
            onClick={() => setStep("code")}
          >
            {t("success_step.back_home")}
          </Button>
        </div>
      </div>
    );
  }

  return <div>{t("loading")}</div>;
}
