import { GuestCard } from "@/components/dashboard/GuestCard";
import { Button } from "@shared/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

// Mock Data
const MOCK_HOUSEHOLDS = [
  {
    id: "1",
    name: "Famille Dupont",
    email: "jean.dupont@email.com",
    guestCount: 4,
    status: "confirmed" as const,
  },
  {
    id: "2",
    name: "Thomas & Sarah",
    guestCount: 2,
    status: "pending" as const,
  },
  {
    id: "3",
    name: "Grand-mère Yvette",
    guestCount: 1,
    status: "confirmed" as const,
  },
  {
    id: "4",
    name: "Famille Martin",
    email: "martin.p@pro.com",
    guestCount: 5,
    status: "declined" as const,
  },
  {
    id: "5",
    name: "Les Cousins du Sud",
    guestCount: 3,
    status: "partial" as const,
  },
];

export default function GuestsPage() {
  return (
    <div className='min-h-screen p-8 md:p-12 max-w-7xl mx-auto space-y-8'>
      {/* Header */}
      <header className='flex justify-between items-center pb-8 border-b border-border'>
        <div className='space-y-1'>
          <Link
            href='/'
            className='text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors mb-2'
          >
            <ArrowLeft className='w-4 h-4' /> Retour à l&apos;accueil
          </Link>
          <h1 className='text-4xl font-heading font-light text-foreground'>
            Vos Invités
          </h1>
          <p className='text-muted-foreground'>
            Gérez votre liste et suivez les réponses.
          </p>
        </div>
        <div className='flex gap-3'>
          <Button className='bg-primary text-primary-foreground hover:bg-primary/90'>
            <Plus className='w-4 h-4 mr-2' /> Ajouter manuellement
          </Button>
        </div>
      </header>

      {/* Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {MOCK_HOUSEHOLDS.map((household) => (
          <GuestCard
            key={household.id}
            id={household.id}
            name={household.name}
            email={household.email}
            guestCount={household.guestCount}
            status={household.status}
          />
        ))}
      </div>
    </div>
  );
}
