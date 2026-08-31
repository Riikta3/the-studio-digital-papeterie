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
      <Card className='bg-white border-studio-lavande/40 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-studio-violet/60'>
            {t("total")}
          </CardTitle>
          <Users className='h-4 w-4 text-studio-violet' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold font-heading text-studio-violet'>{totalGuests}</div>
          <p className='text-xs text-studio-violet/50'>{t("invited")}</p>
        </CardContent>
      </Card>

      <Card className='bg-teal-50/50 border-teal-100 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-teal-600'>
            {t("confirmed")}
          </CardTitle>
          <CheckCircle className='h-4 w-4 text-teal-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold font-heading text-teal-600'>
            {confirmedGuests}
          </div>
          <p className='text-xs text-teal-600/80'>{t("attending")}</p>
        </CardContent>
      </Card>

      <Card className='bg-studio-jaune/20 border-studio-jaune shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-studio-pourpre'>
            {t("pending")}
          </CardTitle>
          <Clock className='h-4 w-4 text-studio-pourpre' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold font-heading text-studio-violet'>
            {pendingGuests}
          </div>
          <p className='text-xs text-studio-pourpre/80'>{t("waiting")}</p>
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
