"use client";

import { useRouter } from "@/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Check,
  ChevronRight,
  CreditCard,
  Globe,
  Image as ImageIcon,
  Users,
} from "lucide-react";
import { useState } from "react";

// --- Data ---
const plans = [
  {
    id: "discovery",
    name: "Découverte",
    price: "0€",
    features: ["15 Jours d'essai", "Thème Standard", "1 Langue"],
    recommended: false,
  },
  {
    id: "essential",
    name: "Essentiel",
    price: "120€",
    features: ["Accès 1 an", "Tous les Thèmes", "2 Langues", "Support Email"],
    recommended: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "190€",
    features: [
      "Accès Illimité",
      "Nom de Domaine",
      "Toutes Langues",
      "Support Prioritaire",
    ],
    recommended: false,
  },
];

const themes = [
  {
    id: "floral",
    name: "Le Champêtre",
    image: "/images/landing/theme-floral.png",
  },
  {
    id: "modern",
    name: "Le Minimaliste",
    image: "/images/landing/theme-modern.png",
  },
  {
    id: "romantic",
    name: "Le Romantique",
    image: "/images/landing/theme-boho.png",
  },
];

const modules = [
  { id: "rsvp", name: "Gestion RSVP", icon: Users },
  { id: "gallery", name: "Galerie Photo", icon: ImageIcon },
  { id: "program", name: "Programme", icon: Calendar },
  { id: "travel", name: "Infos Voyage", icon: Globe },
];

export default function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    plan: "essential",
    theme: "",
    modules: ["rsvp", "program"] as string[],
    name1: "",
    name2: "",
    email: "",
    date: "",
  });

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

  const handleFinalize = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const bypass = process.env.NEXT_PUBLIC_BYPASS_PAYMENT === "true";

    if (bypass) {
      // Redirect directly to dashboard
      router.push("/dashboard");
    } else {
      // Here we would redirect to Stripe
      alert("Redirection vers le paiement (Stripe)...");
      setLoading(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto'>
      {/* Progress Bar */}
      <div className='flex items-center justify-between mb-12 px-4 relative'>
        <div className='absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 rounded-full' />
        <div
          className='absolute top-1/2 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-500'
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />

        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              step >= s
                ? "bg-primary text-white scale-110 shadow-lg"
                : "bg-white border-2 border-gray-200 text-gray-400"
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      <AnimatePresence mode='wait'>
        {/* STEP 1: PLAN */}
        {step === 1 && (
          <motion.div
            key='step1'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className='space-y-8'
          >
            <div className='text-center space-y-2'>
              <h1 className='font-heading text-4xl text-foreground'>
                Choisissez votre expérience
              </h1>
              <p className='text-muted-foreground'>
                Une offre adaptée à chaque besoin.
              </p>
            </div>

            <div className='grid md:grid-cols-3 gap-6'>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setFormData({ ...formData, plan: plan.id })}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all relative ${
                    formData.plan === plan.id
                      ? "border-primary bg-white shadow-xl scale-[1.02]"
                      : "border-transparent bg-white shadow-sm hover:border-gray-200"
                  }`}
                >
                  {plan.recommended && (
                    <div className='absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider'>
                      Recommandé
                    </div>
                  )}
                  <h3 className='font-heading text-2xl mb-2'>{plan.name}</h3>
                  <div className='text-3xl font-bold mb-4'>{plan.price}</div>
                  <ul className='space-y-2 mb-6'>
                    {plan.features.map((f, i) => (
                      <li
                        key={i}
                        className='flex items-center gap-2 text-sm text-gray-600'
                      >
                        <Check className='w-4 h-4 text-green-500' /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className='flex justify-end pt-8'>
              <button
                onClick={nextStep}
                className='bg-primary text-white px-8 py-3 rounded-full font-semibold hover:brightness-110 transition-all flex items-center gap-2'
              >
                Continuer <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: THEME */}
        {step === 2 && (
          <motion.div
            key='step2'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className='space-y-8'
          >
            <div className='text-center space-y-2'>
              <h1 className='font-heading text-4xl text-foreground'>
                L'ambiance visuelle
              </h1>
              <p className='text-muted-foreground'>
                Sélectionnez le thème qui vous ressemble.
              </p>
            </div>

            <div className='grid md:grid-cols-3 gap-6'>
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => setFormData({ ...formData, theme: theme.id })}
                  className={`group cursor-pointer relative rounded-xl overflow-hidden aspect-[3/4] border-4 transition-all ${
                    formData.theme === theme.id
                      ? "border-primary shadow-2xl scale-[1.02]"
                      : "border-transparent shadow-md hover:shadow-xl"
                  }`}
                >
                  <div
                    className='absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110'
                    style={{ backgroundImage: `url(${theme.image})` }}
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
                  <div className='absolute bottom-6 left-0 w-full text-center text-white'>
                    <h3 className='font-heading text-2xl italic'>
                      {theme.name}
                    </h3>
                    {formData.theme === theme.id && (
                      <div className='mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full'>
                        <Check className='w-3 h-3' /> Sélectionné
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className='flex justify-between pt-8'>
              <button
                onClick={prevStep}
                className='text-muted-foreground font-medium hover:text-foreground'
              >
                Retour
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.theme}
                className='bg-primary text-white px-8 py-3 rounded-full font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                Continuer <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: MODULES */}
        {step === 3 && (
          <motion.div
            key='step3'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className='space-y-8'
          >
            <div className='text-center space-y-2'>
              <h1 className='font-heading text-4xl text-foreground'>
                Les fonctionnalités
              </h1>
              <p className='text-muted-foreground'>
                De quoi avez-vous besoin pour votre site ?
              </p>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {modules.map((mod) => (
                <div
                  key={mod.id}
                  onClick={() => toggleModule(mod.id)}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-4 text-center ${
                    formData.modules.includes(mod.id)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-100 bg-white hover:border-gray-200 text-gray-500"
                  }`}
                >
                  <mod.icon className='w-8 h-8' />
                  <span className='font-medium'>{mod.name}</span>
                  {formData.modules.includes(mod.id) && (
                    <Check className='w-5 h-5 absolute top-3 right-3 text-primary' />
                  )}
                </div>
              ))}
            </div>

            <div className='flex justify-between pt-8'>
              <button
                onClick={prevStep}
                className='text-muted-foreground font-medium hover:text-foreground'
              >
                Retour
              </button>
              <button
                onClick={nextStep}
                className='bg-primary text-white px-8 py-3 rounded-full font-semibold hover:brightness-110 transition-all flex items-center gap-2'
              >
                Continuer <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: ACCOUNT */}
        {step === 4 && (
          <motion.div
            key='step4'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className='space-y-8 max-w-lg mx-auto'
          >
            <div className='text-center space-y-2'>
              <h1 className='font-heading text-4xl text-foreground'>
                C'est presque fini !
              </h1>
              <p className='text-muted-foreground'>
                Entrez vos informations pour sécuriser votre espace.
              </p>
            </div>

            <div className='bg-white p-8 rounded-3xl shadow-xl border border-border/20 space-y-6'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Votre Prénom
                  </label>
                  <input
                    type='text'
                    className='w-full px-4 py-3 rounded-xl border border-border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                    placeholder='Ex: Sarah'
                    value={formData.name1}
                    onChange={(e) =>
                      setFormData({ ...formData, name1: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Son Prénom
                  </label>
                  <input
                    type='text'
                    className='w-full px-4 py-3 rounded-xl border border-border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                    placeholder='Ex: Thomas'
                    value={formData.name2}
                    onChange={(e) =>
                      setFormData({ ...formData, name2: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Date du Mariage
                </label>
                <input
                  type='date'
                  className='w-full px-4 py-3 rounded-xl border border-border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Email
                </label>
                <input
                  type='email'
                  className='w-full px-4 py-3 rounded-xl border border-border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                  placeholder='votre@email.com'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className='pt-4'>
                <button
                  onClick={handleFinalize}
                  disabled={!formData.name1 || !formData.email || loading}
                  className='w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:brightness-110 shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {loading ? (
                    "Création en cours..."
                  ) : (
                    <>
                      {process.env.NEXT_PUBLIC_BYPASS_PAYMENT === "true"
                        ? "Créer mon espace (Mode Démo)"
                        : "Procéder au paiement"}
                      <CreditCard className='w-5 h-5' />
                    </>
                  )}
                </button>
                <p className='text-center text-xs text-muted-foreground mt-4'>
                  Paiement sécurisé via Stripe. Satisfait ou remboursé.
                </p>
              </div>
            </div>

            <button
              onClick={prevStep}
              className='w-full text-center text-muted-foreground hover:text-foreground text-sm font-medium'
            >
              Retour aux options
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
