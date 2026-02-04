import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card";
import { CheckCircle, Clock, Users, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("GuestStats");

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <Card className='bg-white/50 border-gray-100 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            {t("total")}
          </CardTitle>
          <Users className='h-4 w-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold font-heading'>{totalGuests}</div>
          <p className='text-xs text-muted-foreground'>{t("invited")}</p>
        </CardContent>
      </Card>

      <Card className='bg-green-50/50 border-green-100 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-green-700'>
            {t("confirmed")}
          </CardTitle>
          <CheckCircle className='h-4 w-4 text-green-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold font-heading text-green-700'>
            {confirmedGuests}
          </div>
          <p className='text-xs text-green-600/80'>{t("attending")}</p>
        </CardContent>
      </Card>

      <Card className='bg-orange-50/50 border-orange-100 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-orange-700'>
            {t("pending")}
          </CardTitle>
          <Clock className='h-4 w-4 text-orange-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold font-heading text-orange-700'>
            {pendingGuests}
          </div>
          <p className='text-xs text-orange-600/80'>{t("waiting")}</p>
        </CardContent>
      </Card>

      <Card className='bg-red-50/50 border-red-100 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-red-700'>
            {t("declined")}
          </CardTitle>
          <XCircle className='h-4 w-4 text-red-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold font-heading text-red-700'>
            {declinedGuests}
          </div>
          <p className='text-xs text-red-600/80'>{t("not_coming")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
