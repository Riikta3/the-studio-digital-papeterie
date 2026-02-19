"use client";

import { createWedding } from "@/actions/create-wedding";
import { ALL_LANGUAGES, POPULAR_LANGUAGE_IDS } from "@/data/languages";
import { Link, useRouter } from "@/navigation";
import { ModuleSelector } from "@shared/components/modules/ModuleSelector";
import { Spinner } from "@shared/components/ui/spinner";
import { APP_MODULES } from "@shared/data/modules";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  CreditCard,
  Gem,
  Globe,
  Heart,
  Image as ImageIcon,
  LifeBuoy,
  MapPin,
  Music,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// --- Data ---
const POPULAR_LANGUAGES = ALL_LANGUAGES.filter((l) =>
  POPULAR_LANGUAGE_IDS.includes(l.id),
);
const OTHER_LANGUAGES = ALL_LANGUAGES.filter(
  (l) => !POPULAR_LANGUAGE_IDS.includes(l.id),
);

const plans = [
  {
    id: "discovery",
    name: "Découverte",
    price: 0,
    period: "15 jours",
    features: [
      "15 Jours d'essai",
      "Thème Standard",
      "1 Langue",
      "50 invités max",
    ],
    recommended: false,
  },
  {
    id: "essential",
    name: "Essentiel",
    price: 120,
    period: "1 an",
    features: [
      "Accès 1 an",
      "Tous les Thèmes",
      "2 Langues",
      "Support Email",
      "200 invités",
    ],
    recommended: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 190,
    period: "illimité",
    features: [
      "Accès Illimité",
      "Nom de Domaine",
      "Toutes Langues",
      "Support Prioritaire",
      "Invités illimités",
      "Statistiques avancées",
    ],
    recommended: false,
  },
];

const themes = [
  {
    id: "floral",
    name: "Le Champêtre",
    image: "/images/landing/theme-floral.png",
    description: "Élégance florale et naturelle",
  },
  {
    id: "modern",
    name: "Le Minimaliste",
    image: "/images/landing/theme-modern.png",
    description: "Épuré et contemporain",
  },
  {
    id: "romantic",
    name: "Le Romantique",
    image: "/images/landing/theme-boho.png",
    description: "Douceur et poésie",
  },
];

// Modules moved to shared/data/modules.ts

const FREE_MODULES_LIMIT = 4;
const EXTRA_MODULE_PRICE = 10;
const FREE_LANGUAGES_LIMIT = 2;
const EXTRA_LANGUAGE_PRICE = 20;

const EXTRAS = [
  {
    id: "domain",
    name: "Nom de Domaine",
    price: 65,
    description: "Votre adresse unique (ex: mariage-sophie-marc.com).",
    icon: Globe,
    badge: "Populaire",
  },
  {
    id: "illustration",
    name: "Photo en Arrière-plan",
    price: 20,
    description: "Ajoutez votre propre photo en fond pour un rendu 100% vous.",
    icon: ImageIcon,
    badge: null,
  },
  {
    id: "video",
    name: "Animation Vidéo",
    price: 55,
    description:
      "Une animation élégante qui surprendra vos invités à l'ouverture.",
    icon: Video,
    badge: "Populaire",
  },
  {
    id: "music",
    name: "Musique Personnalisée",
    price: 10,
    description: "La chanson de votre choix à l'ouverture du site.",
    icon: Music,
    badge: null,
  },
  {
    id: "vip",
    name: "Support VIP Prioritaire",
    price: 25,
    description: "Assistance dédiée WhatsApp et modifications prioritaires.",
    icon: LifeBuoy,
    badge: "Sérénité",
  },
];

export default function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    plan: "essential",
    theme: "",
    languages: ["fr"] as string[],
    modules: ["rsvp", "program", "gallery"] as string[],
    extras: [] as string[],
    // Personalization
    name1: "",
    name2: "",
    date: "",
    // Billing
    billingFirstName: "",
    billingLastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "France",
    termsAccepted: false,
  });

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const toggleModule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.includes(id)
        ? prev.modules.filter((m) => m !== id)
        : [...prev.modules, id],
    }));
  };

  const removeModule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m !== id),
    }));
  };

  const toggleLanguage = (id: string) => {
    // Prevent removing the last language
    if (formData.languages.includes(id) && formData.languages.length === 1) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(id)
        ? prev.languages.filter((l) => l !== id)
        : [...prev.languages, id],
    }));
  };

  const toggleExtra = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      extras: prev.extras.includes(id)
        ? prev.extras.filter((e) => e !== id)
        : [...prev.extras, id],
    }));
  };

  // Calculations
  const selectedPlan = plans.find((p) => p.id === formData.plan);
  // Modules Calculation
  const extraModulesCount = Math.max(
    0,
    formData.modules.length - FREE_MODULES_LIMIT,
  );
  const extraModulesPrice = extraModulesCount * EXTRA_MODULE_PRICE;
  const freeModulesRemaining = Math.max(
    0,
    FREE_MODULES_LIMIT - formData.modules.length,
  );

  // Languages Calculation
  const isPremium = selectedPlan?.id === "premium";
  const extraLanguagesCount = isPremium
    ? 0
    : Math.max(0, formData.languages.length - FREE_LANGUAGES_LIMIT);
  const extraLanguagesPrice = extraLanguagesCount * EXTRA_LANGUAGE_PRICE;

  const extrasPrice = formData.extras.reduce((acc, id) => {
    const extra = EXTRAS.find((e) => e.id === id);
    return acc + (extra?.price || 0);
  }, 0);

  const totalPrice =
    (selectedPlan?.price || 0) +
    extraModulesPrice +
    extraLanguagesPrice +
    extrasPrice;

  const handleFinalize = async () => {
    setLoading(true);

    const bypass = true; // Forced for Demo/MVP as requested

    if (bypass) {
      // PROVISIONING (Real DB Creation)
      try {
        const result = await createWedding({
          email: formData.email,
          firstName: formData.name1,
          lastName: formData.billingLastName || formData.name1, // Fallback
          partnerName: formData.name2,
          weddingDate: formData.date,
          themeId: formData.theme,
          modules: formData.modules,
          extras: formData.extras,
          languages: formData.languages,
          plan: formData.plan,
        });

        if (result.success) {
          toast.success("Votre espace a été créé avec succès ! 💍");

          if (result.inviteLink) {
            toast.info("Lien d'accès (DEV)", {
              description: "Cliquez pour définir votre mot de passe",
              action: {
                label: "Accéder",
                onClick: () => window.open(result.inviteLink!, "_self"),
              },
              duration: Infinity,
            });
          } else {
            toast.info("📩 Email envoyé !", {
              description: `Un lien d'activation a été envoyé à ${formData.email}. Vérifiez vos spams !`,
              duration: Infinity,
            });
          }
        } else {
          toast.error("Une erreur est survenue lors de la création.", {
            description: result.error,
          });
        }
      } catch (e) {
        console.error(e);
        toast.error("Erreur technique inattendue.");
      } finally {
        setLoading(false);
      }
    } else {
      toast.info("Le paiement Stripe n'est pas encore activé.");
      setLoading(false);
    }
  };

  const totalSteps = 6;
  const progress = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className='max-w-6xl mx-auto px-4 pb-40 pt-8'>
      {/* --- Stepper UI --- */}
      <div className='max-w-3xl mx-auto mb-16 px-4'>
        <div className='relative flex items-center justify-between'>
          {/* Track */}
          <div className='absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2 rounded-full' />

          {/* Active Progress */}
          <motion.div
            className='absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full'
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              onClick={() => s < step && setStep(s)}
              className={`relative flex flex-col items-center gap-2 ${s < step ? "cursor-pointer group" : ""}`}
            >
              <motion.div
                animate={{ scale: step === s ? 1.15 : 1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-4 ${
                  step >= s
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                    : "bg-white border-gray-100 text-gray-300"
                } ${s < step ? "group-hover:bg-primary/80 group-hover:border-primary/80" : ""}`}
              >
                {step > s ? <Check className='w-5 h-5' /> : s}
              </motion.div>
              <span
                className={`text-[10px] uppercase tracking-widest font-bold transition-colors duration-300 ${
                  step >= s ? "text-primary" : "text-gray-300"
                } ${s < step ? "group-hover:text-primary/80" : ""}`}
              >
                {s === 1 && "Offre"}
                {s === 2 && "Design"}
                {s === 3 && "Langues"}
                {s === 4 && "Modules"}
                {s === 5 && "Extras"}
                {s === 6 && "Finale"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode='wait'>
        {/* --- STEP 1: PLANS --- */}
        {step === 1 && (
          <motion.div
            key='step1'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='space-y-12'
          >
            <div className='text-center space-y-4'>
              <h1 className='font-heading text-5xl md:text-6xl text-foreground italic'>
                L'aventure commence ici
              </h1>
              <p className='text-muted-foreground text-lg'>
                Choisissez l'offre qui accompagnera votre plus beau jour.
              </p>
            </div>

            <div className='grid md:grid-cols-3 gap-8'>
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  onClick={() => setFormData({ ...formData, plan: plan.id })}
                  whileHover={{ y: -8 }}
                  className={`relative p-8 rounded-[2rem] border transition-all cursor-pointer flex flex-col h-full bg-white group ${
                    formData.plan === plan.id
                      ? "border-primary shadow-2xl shadow-primary/10 ring-1 ring-primary"
                      : "border-gray-100 shadow-xl shadow-gray-200/50 md:hover:border-primary/30"
                  }`}
                >
                  {plan.recommended && (
                    <div className='absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1'>
                      <Sparkles className='w-3 h-3' /> Recommandé
                    </div>
                  )}

                  <div className='text-center mb-8 pt-4'>
                    <h3 className='font-heading text-3xl mb-2'>{plan.name}</h3>
                    <div className='text-4xl font-bold text-gray-900 mb-1'>
                      {plan.price === 0 ? "Gratuit" : `${plan.price}€`}
                    </div>
                    <div className='text-sm font-medium text-muted-foreground bg-gray-50 inline-block px-3 py-1 rounded-full'>
                      {plan.period}
                    </div>
                  </div>

                  <div className='flex-1 space-y-4'>
                    {plan.features.map((f, i) => (
                      <div
                        key={i}
                        className='flex items-start gap-3 text-sm text-gray-600'
                      >
                        <div className='w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5'>
                          <Check className='w-3 h-3 text-green-600' />
                        </div>
                        {f}
                      </div>
                    ))}
                  </div>

                  <div
                    className={`mt-8 w-full py-3 rounded-xl border text-center font-semibold transition-colors ${
                      formData.plan === plan.id
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-900 border-gray-200 md:group-hover:bg-primary md:group-hover:text-white md:group-hover:border-primary"
                    }`}
                  >
                    {formData.plan === plan.id ? "Sélectionné" : "Choisir"}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* --- STEP 2: THEMES --- */}
        {step === 2 && (
          <motion.div
            key='step2'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='space-y-12'
          >
            <div className='text-center space-y-4'>
              <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2'>
                Design
              </div>
              <h1 className='font-heading text-5xl md:text-6xl text-foreground italic'>
                L'ambiance visuelle
              </h1>
              <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
                Sélectionnez le thème qui correspond à votre style. Vous pourrez
                le personnaliser plus tard.
              </p>
            </div>

            <div className='grid md:grid-cols-3 gap-8'>
              {themes.map((theme) => (
                <motion.div
                  key={theme.id}
                  onClick={() => setFormData({ ...formData, theme: theme.id })}
                  whileHover={{ y: -8 }}
                  className={`group cursor-pointer relative rounded-[2rem] overflow-hidden aspect-[3/4] shadow-2xl transition-all ${
                    formData.theme === theme.id
                      ? "ring-4 ring-primary ring-offset-4"
                      : "md:hover:ring-2 md:hover:ring-primary/50 md:hover:ring-offset-2"
                  }`}
                >
                  <div
                    className='absolute inset-0 bg-cover bg-center transition-transform duration-700 md:group-hover:scale-110'
                    style={{ backgroundImage: `url(${theme.image})` }}
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10' />

                  {/* Hover Overlay Button */}
                  <div className='absolute inset-0 flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/demo/${theme.id}`, "_blank");
                      }}
                      className='pointer-events-auto bg-white/90 backdrop-blur-md text-gray-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl hover:scale-105 transition-transform flex items-center gap-2'
                    >
                      <Globe className='w-4 h-4' /> Aperçu en direct
                    </button>
                  </div>

                  <div className='absolute bottom-0 left-0 w-full p-8 text-white bg-gradient-to-t from-black/80 via-black/40 to-transparent'>
                    <div className='flex flex-col gap-1 mb-3'>
                      <h3 className='font-heading text-3xl italic'>
                        {theme.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/demo/${theme.id}`, "_blank");
                        }}
                        className='self-start text-xs font-bold uppercase tracking-widest text-white/80 hover:text-white hover:underline flex items-center gap-1 mt-1 md:hidden'
                      >
                        <Globe className='w-3 h-3' /> Voir le modèle
                      </button>
                    </div>
                    <p className='text-white/80 text-sm font-light'>
                      {theme.description}
                    </p>

                    {formData.theme === theme.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='mt-4 inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider'
                      >
                        <Check className='w-3 h-3' /> Sélectionné
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* --- STEP 3: LANGUAGES --- */}
        {step === 3 && (
          <motion.div
            key='step3'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='space-y-12'
          >
            <div className='text-center space-y-4'>
              <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2'>
                International
              </div>
              <h1 className='font-heading text-5xl md:text-6xl text-foreground italic'>
                Vos Langues
              </h1>
              <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
                Sélectionnez les langues de votre site. Traduction automatique
                par IA incluse.
              </p>
            </div>

            {/* Smart Counter */}
            <div className='max-w-xl mx-auto bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-1 flex items-center justify-between border border-gray-100'>
              <div className='px-6 py-3'>
                <span className='block text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1'>
                  Sélection
                </span>
                <div className='text-2xl font-bold text-gray-900'>
                  {formData.languages.length}{" "}
                  <span className='text-sm font-normal text-gray-500'>
                    langues
                  </span>
                </div>
              </div>
              <div
                className={`px-6 py-3 rounded-xl flex-1 text-center mx-1 ${
                  isPremium || formData.languages.length <= FREE_LANGUAGES_LIMIT
                    ? "bg-green-50 text-green-700"
                    : "bg-orange-50 text-orange-700"
                }`}
              >
                {isPremium ? (
                  <>
                    <span className='font-bold block text-lg'>Illimité</span>
                    <span className='text-xs opacity-80'>
                      Inclus dans Premium
                    </span>
                  </>
                ) : formData.languages.length <= FREE_LANGUAGES_LIMIT ? (
                  <>
                    <span className='font-bold block text-lg'>
                      {FREE_LANGUAGES_LIMIT - formData.languages.length}{" "}
                      Gratuites
                    </span>
                    <span className='text-xs opacity-80'>restantes</span>
                  </>
                ) : (
                  <>
                    <span className='font-bold block text-lg'>
                      Suppléments actifs
                    </span>
                    <span className='text-xs opacity-80'>
                      +{EXTRA_LANGUAGE_PRICE}€ / langue
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {[
                ...POPULAR_LANGUAGES,
                ...OTHER_LANGUAGES.filter((l) =>
                  formData.languages.includes(l.id),
                ),
              ].map((lang) => {
                const isSelected = formData.languages.includes(lang.id);
                const langIndex = formData.languages.indexOf(lang.id);
                const isPaid =
                  !isPremium && isSelected && langIndex >= FREE_LANGUAGES_LIMIT;

                return (
                  <motion.div
                    key={lang.id}
                    onClick={() => toggleLanguage(lang.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-6 pt-8 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 text-center group bg-white ${
                      isSelected
                        ? isPaid
                          ? "border-orange-200 shadow-xl shadow-orange-100/50"
                          : "border-primary/50 shadow-xl shadow-primary/10"
                        : "border-transparent shadow-md md:hover:shadow-lg md:hover:border-gray-200"
                    }`}
                  >
                    {/* Status Badge */}
                    {isSelected && (
                      <div
                        className={`absolute top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          isPaid
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isPaid ? `+${EXTRA_LANGUAGE_PRICE}€` : "Inclus"}
                      </div>
                    )}

                    <div className='text-4xl mb-2'>{lang.flag}</div>

                    <div className='space-y-1'>
                      <span
                        className={`font-semibold text-lg block ${isSelected ? "text-gray-900" : "text-gray-600"}`}
                      >
                        {lang.name}
                      </span>
                    </div>

                    {/* Checkmark corner */}
                    {isSelected && (
                      <div
                        className={`absolute bottom-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${
                          isPaid ? "bg-orange-500" : "bg-primary"
                        }`}
                      >
                        <Check className='w-3 h-3 text-white' />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Extra Languages Selector */}
            <div className='flex justify-center mt-6'>
              <div className='relative inline-block w-64'>
                <select
                  className='w-full appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-primary shadow-sm hover:border-gray-300 transition-colors cursor-pointer font-medium'
                  onChange={(e) => {
                    if (e.target.value) {
                      toggleLanguage(e.target.value);
                      e.target.value = ""; // Reset
                    }
                  }}
                  defaultValue=''
                >
                  <option
                    value=''
                    disabled
                  >
                    Ajouter une autre langue...
                  </option>
                  {OTHER_LANGUAGES.filter(
                    (l) => !formData.languages.includes(l.id),
                  ).map((lang) => (
                    <option
                      key={lang.id}
                      value={lang.id}
                    >
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500'>
                  <ChevronRight className='w-4 h-4 rotate-90' />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- STEP 4: MODULES --- */}
        {step === 4 && (
          <motion.div
            key='step4'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='space-y-12'
          >
            <div className='text-center space-y-4'>
              <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2'>
                Fonctionnalités
              </div>
              <h1 className='font-heading text-5xl md:text-6xl text-foreground italic'>
                Vos Modules
              </h1>
              <p className='text-muted-foreground text-lg'>
                Créez une expérience sur mesure pour vos invités.
              </p>
            </div>

            {/* Smart Counter */}
            <div className='max-w-xl mx-auto bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-1 flex items-center justify-between border border-gray-100'>
              <div className='px-6 py-3'>
                <span className='block text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1'>
                  Sélection
                </span>
                <div className='text-2xl font-bold text-gray-900'>
                  {formData.modules.length}{" "}
                  <span className='text-sm font-normal text-gray-500'>
                    modules
                  </span>
                </div>
              </div>
              <div
                className={`px-6 py-3 rounded-xl flex-1 text-center mx-1 ${
                  freeModulesRemaining > 0
                    ? "bg-green-50 text-green-700"
                    : "bg-orange-50 text-orange-700"
                }`}
              >
                {freeModulesRemaining > 0 ? (
                  <>
                    <span className='font-bold block text-lg'>
                      {freeModulesRemaining} Gratuits
                    </span>
                    <span className='text-xs opacity-80'>
                      restants avant supplément
                    </span>
                  </>
                ) : (
                  <>
                    <span className='font-bold block text-lg'>
                      Suppléments actifs
                    </span>
                    <span className='text-xs opacity-80'>
                      +{EXTRA_MODULE_PRICE}€ / module supplémentaire
                    </span>
                  </>
                )}
              </div>
            </div>

            <ModuleSelector
              modules={APP_MODULES}
              selectedIds={formData.modules}
              onToggle={toggleModule}
              freeLimit={FREE_MODULES_LIMIT}
              extraPrice={EXTRA_MODULE_PRICE}
            />
          </motion.div>
        )}

        {/* --- STEP 5: EXTRAS --- */}
        {step === 5 && (
          <motion.div
            key='step5'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='space-y-8'
          >
            <div className='text-center space-y-4'>
              <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2'>
                Services Premium
              </div>
              <h1 className='font-heading text-5xl md:text-6xl text-foreground italic'>
                Petites touches en plus ?
              </h1>
              <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
                Ajoutez des options exclusives pour rendre votre invitation
                encore plus unique.
              </p>
            </div>

            <div className='grid grid-cols-1 gap-4 max-w-2xl mx-auto'>
              {EXTRAS.map((extra) => {
                const isSelected = formData.extras.includes(extra.id);
                return (
                  <motion.div
                    key={extra.id}
                    onClick={() => toggleExtra(extra.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 group bg-white ${
                      isSelected
                        ? "border-primary shadow-lg shadow-primary/10 bg-primary/5"
                        : "border-gray-100 shadow-sm md:hover:border-primary/50 md:hover:shadow-md"
                    }`}
                  >
                    {/* Icon container */}
                    <div
                      className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-gray-50 text-gray-400 group-hover:text-primary group-hover:bg-primary/10"
                      }`}
                    >
                      <extra.icon className='w-8 h-8' />
                    </div>

                    {/* Content */}
                    <div className='flex-1 text-left'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h3
                          className={`font-bold text-lg ${isSelected ? "text-primary" : "text-gray-900"}`}
                        >
                          {extra.name}
                        </h3>
                        {extra.badge && (
                          <span className='px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-widest rounded-full'>
                            {extra.badge}
                          </span>
                        )}
                      </div>
                      <p className='text-gray-500 text-sm leading-relaxed'>
                        {extra.description}
                      </p>
                    </div>

                    {/* Price & Check */}
                    <div className='text-right shrink-0 flex flex-col items-end gap-2'>
                      <span className='font-heading text-2xl text-gray-900 italic'>
                        +{extra.price}€
                      </span>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-transparent group-hover:bg-gray-200"
                        }`}
                      >
                        <Check className='w-4 h-4' />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* --- STEP 6: SUMMARY & FORM --- */}
        {step === 6 && (
          <motion.div
            key='step6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='space-y-12'
          >
            <div className='text-center space-y-4'>
              <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2'>
                Finalisation
              </div>
              <h1 className='font-heading text-5xl md:text-6xl text-foreground italic'>
                Dernière étape !
              </h1>
              <p className='text-muted-foreground text-lg'>
                Vérifiez votre sélection avant de créer votre espace.
              </p>
            </div>

            <div className='grid lg:grid-cols-2 gap-12'>
              {/* --- Summary Card --- */}
              <div className='space-y-6'>
                <div className='bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden'>
                  <div className='bg-gray-50 px-8 py-6 border-b border-gray-100 flex items-center justify-between'>
                    <h2 className='font-heading text-2xl italic text-gray-900'>
                      Récapitulatif
                    </h2>
                    <Gem className='w-5 h-5 text-primary' />
                  </div>

                  <div className='p-8 space-y-8'>
                    {/* Plan & Theme */}
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='p-4 bg-gray-50 rounded-2xl border border-gray-100'>
                        <p className='text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-bold'>
                          Offre
                        </p>
                        <p className='font-semibold text-gray-900'>
                          {selectedPlan?.name}
                        </p>
                        <p className='text-primary font-bold text-sm'>
                          {selectedPlan?.price}€
                        </p>
                      </div>
                      <div className='p-4 bg-gray-50 rounded-2xl border border-gray-100'>
                        <p className='text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-bold'>
                          Thème
                        </p>
                        <p className='font-semibold text-gray-900 truncate'>
                          {themes.find((t) => t.id === formData.theme)?.name}
                        </p>
                      </div>
                    </div>

                    {/* Languages List */}
                    <div className='p-4 bg-gray-50 rounded-2xl border border-gray-100'>
                      <div className='flex justify-between items-start mb-2'>
                        <p className='text-[10px] uppercase tracking-wider text-muted-foreground font-bold'>
                          Langues ({formData.languages.length})
                        </p>
                        <button
                          onClick={() => setStep(3)}
                          className='text-xs text-primary font-medium hover:underline'
                        >
                          Modifier
                        </button>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {formData.languages.map((lid) => {
                          const lang = ALL_LANGUAGES.find((l) => l.id === lid);
                          return (
                            <span
                              key={lid}
                              className='text-sm font-semibold bg-white border px-2 py-1 rounded-lg text-gray-700 flex items-center gap-1 shadow-sm'
                            >
                              {lang?.flag} {lang?.name}
                            </span>
                          );
                        })}
                      </div>
                      {extraLanguagesCount > 0 && (
                        <p className='text-orange-600 font-bold text-xs mt-2 text-right'>
                          +{extraLanguagesPrice}€ (Suppléments)
                        </p>
                      )}
                    </div>

                    {/* Extras List */}
                    {formData.extras.length > 0 && (
                      <div className='p-4 bg-gray-50 rounded-2xl border border-gray-100 mt-4'>
                        <div className='flex justify-between items-start mb-2'>
                          <p className='text-[10px] uppercase tracking-wider text-muted-foreground font-bold'>
                            Extras ({formData.extras.length})
                          </p>
                          <button
                            onClick={() => setStep(5)}
                            className='text-xs text-primary font-medium hover:underline'
                          >
                            Modifier
                          </button>
                        </div>
                        <div className='space-y-2'>
                          {formData.extras.map((eid) => {
                            const extra = EXTRAS.find((e) => e.id === eid);
                            if (!extra) return null;
                            return (
                              <div
                                key={eid}
                                className='flex justify-between items-center text-sm'
                              >
                                <div className='flex items-center gap-2'>
                                  {extra?.icon && (
                                    <extra.icon className='w-4 h-4 text-gray-400' />
                                  )}
                                  <span className='font-semibold text-gray-700'>
                                    {extra?.name}
                                  </span>
                                </div>
                                <span className='text-gray-900 font-bold'>
                                  +{extra?.price}€
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Modules List */}
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <h3 className='font-bold text-sm text-gray-900 uppercase tracking-wide'>
                          Modules ({formData.modules.length})
                        </h3>
                        <button
                          onClick={() => setStep(4)}
                          className='text-xs text-primary font-medium hover:underline'
                        >
                          Modifier
                        </button>
                      </div>

                      <div className='space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar'>
                        {formData.modules.map((moduleId, index) => {
                          const module = APP_MODULES.find(
                            (m) => m.id === moduleId,
                          );
                          if (!module) return null;
                          const isPaid = index >= FREE_MODULES_LIMIT;

                          return (
                            <motion.div
                              key={moduleId}
                              layout
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className={`flex items-center gap-3 p-3 rounded-xl border group transition-all ${
                                isPaid
                                  ? "bg-orange-50/50 border-orange-100"
                                  : "bg-white border-gray-100 hover:border-gray-200"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  isPaid
                                    ? "bg-orange-100 text-orange-600"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                <module.icon className='w-4 h-4' />
                              </div>

                              <div className='flex-1 min-w-0'>
                                <p className='font-semibold text-sm text-gray-900 truncate'>
                                  {module.name}
                                </p>
                                {isPaid && (
                                  <p className='text-[10px] text-orange-600 font-bold uppercase tracking-wider'>
                                    + {EXTRA_MODULE_PRICE}€
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => removeModule(moduleId)}
                                className='w-6 h-6 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100'
                                title='Retirer'
                              >
                                <X className='w-3 h-3' />
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pricing Breakdown inside Card */}
                    <div className='pt-6 border-t border-gray-100 space-y-3'>
                      <div className='flex justify-between text-sm text-gray-600'>
                        <span>Offre {selectedPlan?.name}</span>
                        <span>{selectedPlan?.price}€</span>
                      </div>
                      {extraModulesCount > 0 && (
                        <div className='flex justify-between text-sm text-orange-600'>
                          <span>Suppléments ({extraModulesCount} modules)</span>
                          <span>+{extraModulesPrice}€</span>
                        </div>
                      )}
                      {extraLanguagesCount > 0 && (
                        <div className='flex justify-between text-sm text-orange-600'>
                          <span>
                            Suppléments Langues ({extraLanguagesCount})
                          </span>
                          <span>+{extraLanguagesPrice}€</span>
                        </div>
                      )}
                      {extrasPrice > 0 && (
                        <div className='flex justify-between text-sm text-orange-600'>
                          <span>Extras ({formData.extras.length})</span>
                          <span>+{extrasPrice}€</span>
                        </div>
                      )}
                      <div className='flex justify-between items-center pt-2 text-xl font-bold text-gray-900'>
                        <span>Total</span>
                        <span className='font-heading italic text-3xl text-primary'>
                          {totalPrice}€
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- User Form --- */}
              <div className='bg-white p-8 rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 h-fit'>
                <h2 className='font-heading text-3xl italic text-gray-900 mb-8'>
                  Finalisation
                </h2>

                <div className='space-y-8'>
                  {/* --- 1. Personnalisation (Couple) --- */}
                  <div className='space-y-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Heart className='w-4 h-4 text-primary' />
                      <h3 className='font-bold text-sm uppercase tracking-widest text-gray-500'>
                        Personnalisation
                      </h3>
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                          Prénom 1 (Marié·e) *
                        </label>
                        <input
                          type='text'
                          required
                          className='w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
                          placeholder='Ex: Sophie'
                          value={formData.name1}
                          onChange={(e) =>
                            setFormData({ ...formData, name1: e.target.value })
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                          Prénom 2 (Marié·e) *
                        </label>
                        <input
                          type='text'
                          required
                          className='w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
                          placeholder='Ex: Thomas'
                          value={formData.name2}
                          onChange={(e) =>
                            setFormData({ ...formData, name2: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <label className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                        Date de l'événement *
                      </label>
                      <input
                        type='date'
                        required
                        className='w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <hr className='border-gray-100' />

                  {/* --- 2. Facturation --- */}
                  <div className='space-y-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <CreditCard className='w-4 h-4 text-primary' />
                      <h3 className='font-bold text-sm uppercase tracking-widest text-gray-500'>
                        Facturation
                      </h3>
                    </div>

                    {/* Nom / Prénom */}
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                          Prénom *
                        </label>
                        <input
                          type='text'
                          required
                          className='w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
                          placeholder='Jean'
                          value={formData.billingFirstName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              billingFirstName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                          Nom *
                        </label>
                        <input
                          type='text'
                          required
                          className='w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
                          placeholder='Dupont'
                          value={formData.billingLastName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              billingLastName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Email / Phone */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                          Email *
                        </label>
                        <input
                          type='email'
                          required
                          className='w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
                          placeholder='jean@exemple.com'
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                          Téléphone *
                        </label>
                        <input
                          type='tel'
                          required
                          className='w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
                          placeholder='06 12 34 56 78'
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className='space-y-2'>
                      <label className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                        Adresse *
                      </label>
                      <input
                        type='text'
                        required
                        className='w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
                        placeholder='123 Avenue des Champs-Élysées'
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                    </div>

                    {/* Zip / City */}
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                          Code Postal *
                        </label>
                        <input
                          type='text'
                          required
                          className='w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
                          placeholder='75008'
                          value={formData.postalCode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              postalCode: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                          Ville *
                        </label>
                        <input
                          type='text'
                          required
                          className='w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
                          placeholder='Paris'
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Country */}
                    <div className='space-y-2'>
                      <label className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                        Pays *
                      </label>
                      <div className='relative'>
                        <select
                          required
                          className='w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              country: e.target.value,
                            })
                          }
                        >
                          <option value='France'>France</option>
                          <option value='Belgique'>Belgique</option>
                          <option value='Suisse'>Suisse</option>
                          <option value='Canada'>Canada</option>
                          <option value='Autre'>Autre</option>
                        </select>
                        <MapPin className='absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none' />
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className='flex items-start gap-3 mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100'>
                      <div className='relative flex items-center pt-0.5'>
                        <input
                          type='checkbox'
                          id='terms'
                          className='peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:bg-primary checked:border-primary'
                          checked={formData.termsAccepted}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              termsAccepted: e.target.checked,
                            })
                          }
                        />
                        <Check className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity' />
                      </div>
                      <label
                        htmlFor='terms'
                        className='text-xs text-gray-500 leading-relaxed cursor-pointer select-none'
                      >
                        J'accepte les{" "}
                        <Link
                          href='/legal/cgv'
                          target='_blank'
                          className='underline hover:text-primary'
                        >
                          Conditions Générales de Vente
                        </Link>{" "}
                        et la{" "}
                        <Link
                          href='/legal/privacy'
                          target='_blank'
                          className='underline hover:text-primary'
                        >
                          Politique de Confidentialité
                        </Link>
                        . Je reconnais que la production commence immédiatement
                        après la commande.
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleFinalize}
                    disabled={
                      loading ||
                      !formData.name1 ||
                      !formData.name2 ||
                      !formData.date ||
                      !formData.billingFirstName ||
                      !formData.billingLastName ||
                      !formData.email ||
                      !formData.phone ||
                      !formData.address ||
                      !formData.postalCode ||
                      !formData.city ||
                      !formData.termsAccepted
                    }
                    className='w-full mt-4 py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none'
                  >
                    {loading ? (
                      <div className='flex items-center gap-2'>
                        <Spinner className='text-white' />
                        <span>Création de votre univers...</span>
                      </div>
                    ) : (
                      <>
                        <span>Créer & Accéder</span>
                        <ChevronRight className='w-5 h-5' />
                      </>
                    )}
                  </button>
                  <p className='text-center text-xs text-gray-400 mt-4'>
                    Accès immédiat sans carte bancaire (Demo).
                  </p>
                </div>
              </div>
            </div>

            <div className='text-center'>
              <button
                onClick={prevStep}
                className='text-gray-500 hover:text-primary font-medium text-sm transition-colors flex items-center justify-center gap-2 mx-auto py-2 px-4 hover:bg-gray-50 rounded-full'
              >
                ← Revenir aux modifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Fixed Footer Bar --- */}
      <AnimatePresence>
        {step !== 6 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className='fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40'
          >
            <div className='max-w-6xl mx-auto px-6 py-4 flex items-center justify-between'>
              <div className='flex items-center gap-8'>
                <div>
                  <p className='text-[10px] uppercase tracking-wider text-gray-500 font-bold'>
                    Total Estimé
                  </p>
                  <motion.div
                    key={totalPrice}
                    initial={{ scale: 1.2, color: "#D4A574" }}
                    animate={{ scale: 1, color: "#000000" }}
                    className='text-3xl font-heading font-bold italic'
                  >
                    {totalPrice}€
                  </motion.div>
                </div>
                <div className='hidden md:block h-8 w-px bg-gray-200'></div>
                <div className='hidden md:block text-xs text-gray-500 space-y-0.5'>
                  <p>Offre : {selectedPlan?.name}</p>
                  <p>
                    Modules : {formData.modules.length} ({extraModulesCount}{" "}
                    payants)
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                {step > 1 && (
                  <button
                    onClick={prevStep}
                    className='text-gray-500 hover:text-gray-900 font-medium px-4 py-2 transition-colors'
                  >
                    Retour
                  </button>
                )}

                <button
                  onClick={nextStep}
                  disabled={step === 2 && !formData.theme}
                  className='bg-primary text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg hover:brightness-110 transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center gap-2'
                >
                  Suivant
                  <ChevronRight className='w-4 h-4' />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
