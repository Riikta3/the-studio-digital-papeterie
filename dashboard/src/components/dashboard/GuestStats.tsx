import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card";
import { CheckCircle, Clock, Users, XCircle } from "lucide-react";

interface GuestStatsProps {
  totalGuests: number;
  confirmedGuests: number;
  pendingGuests: number;
  declinedGuests: number;
}

export function GuestStats({
  totalGuests,
  confirmedGuests,
  pendingGuests,
  declinedGuests,
}: GuestStatsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <Card className='bg-white/50 border-gray-100 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            Total Invités
          </CardTitle>
          <Users className='h-4 w-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold font-heading'>{totalGuests}</div>
          <p className='text-xs text-muted-foreground'>Personnes invitées</p>
        </CardContent>
      </Card>

      <Card className='bg-green-50/50 border-green-100 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-green-700'>
            Confirmés
          </CardTitle>
          <CheckCircle className='h-4 w-4 text-green-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold font-heading text-green-700'>
            {confirmedGuests}
          </div>
          <p className='text-xs text-green-600/80'>Seront présents</p>
        </CardContent>
      </Card>

      <Card className='bg-orange-50/50 border-orange-100 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-orange-700'>
            En attente
          </CardTitle>
          <Clock className='h-4 w-4 text-orange-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold font-heading text-orange-700'>
            {pendingGuests}
          </div>
          <p className='text-xs text-orange-600/80'>Pas encore de réponse</p>
        </CardContent>
      </Card>

      <Card className='bg-red-50/50 border-red-100 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-red-700'>
            Déclinés
          </CardTitle>
          <XCircle className='h-4 w-4 text-red-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold font-heading text-red-700'>
            {declinedGuests}
          </div>
          <p className='text-xs text-red-600/80'>Ne viendront pas</p>
        </CardContent>
      </Card>
    </div>
  );
}
