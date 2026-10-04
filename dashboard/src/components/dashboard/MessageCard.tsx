"use client";

import { deleteGuestbookMessage } from "@/actions/guestbook-actions";
import { clearRsvpMessage } from "@/actions/rsvp-response-actions";
import { useRouter } from "@/navigation";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/components/ui/dialog";
import { Quote, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface MessageCardProps {
  id: string;
  name: string;
  message: string;
  date: string;
  /**
   * Where the message came from: left with an RSVP answer (`rsvp_responses`,
   * deleting removes only the message, the answer stays) or in the guestbook
   * (`guestbook_messages`).
   */
  source?: "rsvp" | "guestbook";
}

export function MessageCard({ id, name, message, date, source = "rsvp" }: MessageCardProps) {
  const t = useTranslations("MessageCard");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await (source === "guestbook" ? deleteGuestbookMessage(id) : clearRsvpMessage(id));
        toast.success(t("toast_deleted"));
        setOpen(false);
        router.refresh();
      } catch {
        toast.error(t("toast_delete_error"));
      }
    });
  };

  return (
    <div className="break-inside-avoid bg-white border border-studio-lavande/40 rounded-2xl p-6 shadow-studio-card flex flex-col gap-4 group">
      <div className="flex items-start justify-between gap-2">
        <Quote className="w-5 h-5 text-studio-violet/30 shrink-0" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            {/* Always visible on touch screens, where there is no hover. */}
            <button
              type="button"
              aria-label={t("delete_label", { name })}
              className="-m-2.5 p-2.5 md:-m-1 md:p-1 rounded-lg text-studio-violet/60 transition-opacity hover:text-red-500 hover:bg-red-50 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("confirm_title")}</DialogTitle>
              <DialogDescription>
                {t(source === "guestbook" ? "confirm_description_guestbook" : "confirm_description", { name })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isPending}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {isPending ? t("deleting") : t("delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-studio-violet font-light leading-relaxed italic text-sm flex-1 whitespace-pre-line break-words">
        {message}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-studio-lavande/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-studio-violet/10 flex items-center justify-center text-[11px] font-semibold text-studio-violet uppercase">
            {name.charAt(0)}
          </div>
          <span className="text-sm font-medium text-studio-violet">{name}</span>
        </div>
        <span className="text-[11px] text-studio-violet/50">{date}</span>
      </div>
    </div>
  );
}
