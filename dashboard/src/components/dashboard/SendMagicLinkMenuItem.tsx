"use client";

import { sendMagicLinkToHousehold } from "@/actions/email-actions";
import { DropdownMenuItem } from "@shared/components/ui/dropdown-menu";
import { Mail } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

interface SendMagicLinkMenuItemProps {
  householdId: string;
  householdName: string;
  email?: string;
  onSelect?: () => void;
}

export function SendMagicLinkMenuItem({
  householdId,
  householdName,
  email,
}: SendMagicLinkMenuItemProps) {
  const [isPending, startTransition] = useTransition();

  const handleSend = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent menu from closing immediately if we want to show loading, though usually it closes.
    // Actually standard dropdown behavior is to close. We can trigger toast and that's it.

    if (!email) {
      toast.error(`Aucun email pour ${householdName}`);
      return;
    }

    toast.loading(`Envoi du lien magique à ${householdName}...`, {
      id: "send-magic-link",
    });

    startTransition(async () => {
      const result = await sendMagicLinkToHousehold(householdId);
      if (result.success) {
        toast.success(`Lien envoyé à ${email} !`, { id: "send-magic-link" });
      } else {
        toast.error(`Erreur: ${result.error}`, { id: "send-magic-link" });
      }
    });
  };

  return (
    <DropdownMenuItem
      onClick={handleSend}
      disabled={isPending || !email}
      className='cursor-pointer'
    >
      <Mail className='mr-2 h-4 w-4' />
      {isPending ? "Envoi..." : "Envoyer lien de connexion"}
    </DropdownMenuItem>
  );
}
