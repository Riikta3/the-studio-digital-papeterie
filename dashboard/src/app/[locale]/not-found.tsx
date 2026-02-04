import { Link } from "@/navigation";
import { Button } from "@shared/components/ui/button";
import { useTranslations } from "next-intl";

export default function NotFoundPage() {
  const t = useTranslations("NotFound");

  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6'>
      <h1 className='font-heading text-6xl text-primary'>404</h1>
      <div className='space-y-2'>
        <h2 className='text-2xl font-medium'>{t("title")}</h2>
        <p className='text-muted-foreground'>{t("description")}</p>
      </div>
      <Link href='/'>
        <Button>{t("back_home")}</Button>
      </Link>
    </div>
  );
}
