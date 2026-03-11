"use client";

import {
  createRsvpResponse,
  deleteRsvpResponse,
  updateRsvpResponse,
  type Participant,
} from "@/actions/rsvp-response-actions";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  MessageSquare,
  NotebookPen,
  Plus,
  Save,
  Search,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { toast } from "sonner";

interface RsvpResponse {
  id: string;
  name: string;
  attendance: boolean | null;
  guest_count: number;
  dietary: string | null;
  message: string | null;
  admin_note: string | null;
  participants: Participant[] | null;
  respondent_first_name: string | null;
  respondent_last_name: string | null;
  submitted_at: string;
}

type SortKey = "submitted_at" | "name" | "attendance";
type SortDir = "asc" | "desc";
type Filter = "all" | "attending" | "declined" | "pending";

// ─── Expand Panel ─────────────────────────────────────────────────────────────

const RELATION_OPTIONS = [
  { value: "", label: "Non spécifié" },
  { value: "partner", label: "Conjoint(e)" },
  { value: "spouse", label: "Époux/Épouse" },
  { value: "child", label: "Enfant" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Frère/Sœur" },
  { value: "grandparent", label: "Grand-parent" },
  { value: "grandchild", label: "Petit-enfant" },
  { value: "family", label: "Famille élargie" },
  { value: "friend", label: "Ami(e)" },
  { value: "colleague", label: "Collègue" },
  { value: "plus_one", label: "Accompagnant(e)" },
  { value: "other", label: "Autre" },
];

function ExpandPanelContent({
  response,
  onSaved,
}: {
  response: RsvpResponse;
  onSaved: (updated: Partial<RsvpResponse>) => void;
}) {
  const t = useTranslations("RsvpResponses");

  const [note, setNote] = useState(response.admin_note ?? "");
  const [attendance, setAttendance] = useState<boolean | null>(
    response.attendance ?? null,
  );

  // Respondent editable name
  const [respondentFirstName, setRespondentFirstName] = useState(
    response.respondent_first_name ?? "",
  );
  const [respondentLastName, setRespondentLastName] = useState(
    response.respondent_last_name ?? "",
  );

  const [participants, setParticipants] = useState<Participant[]>(
    response.participants ?? [],
  );

  const [saving, setSaving] = useState(false);

  const addParticipant = () =>
    setParticipants((prev) => [
      ...prev,
      { first_name: "", last_name: "", relation_type: "" },
    ]);

  const removeParticipant = (i: number) =>
    setParticipants((prev) => prev.filter((_, idx) => idx !== i));

  const updateParticipant = (
    i: number,
    field: keyof Participant,
    value: string,
  ) =>
    setParticipants((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)),
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRsvpResponse({
        id: response.id,
        admin_note: note,
        participants,
        respondent_first_name: respondentFirstName,
        respondent_last_name: respondentLastName,
        attendance,
      });
      onSaved({
        admin_note: note,
        participants,
        guest_count: participants.length,
        respondent_first_name: respondentFirstName,
        respondent_last_name: respondentLastName,
        attendance,
      });
      toast.success(t("saved"));
    } catch {
      toast.error(t("save_error"));
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/40 w-full";

  return (
    <tr className='border-b border-border'>
      <td
        colSpan={8}
        className='p-0'
        style={{ width: "100%", maxWidth: 0 }}
      >
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: "hidden", width: "100%" }}
        >
          <div className='bg-gray-50/80 px-5 py-5'>
            <div
              className={`grid gap-6 text-sm w-full ${response.attendance ? "md:grid-cols-2" : "grid-cols-1"}`}
            >
              {/* Left: guest message + dietary + admin note */}
              <div className='space-y-4'>
                {/* Attendance selector */}
                <div>
                  <p className='text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2'>
                    {t("col.attendance")}
                  </p>
                  <div className='flex gap-2'>
                    {(
                      [
                        {
                          value: null,
                          label: t("pending"),
                          cls:
                            attendance === null
                              ? "bg-amber-50 border-amber-300 text-amber-700 font-medium"
                              : "border-border text-muted-foreground hover:border-amber-200",
                        },
                        {
                          value: true,
                          label: t("present"),
                          cls:
                            attendance === true
                              ? "bg-green-50 border-green-300 text-green-700 font-medium"
                              : "border-border text-muted-foreground hover:border-green-200",
                        },
                        {
                          value: false,
                          label: t("absent"),
                          cls:
                            attendance === false
                              ? "bg-red-50 border-red-300 text-red-700 font-medium"
                              : "border-border text-muted-foreground hover:border-red-200",
                        },
                      ] as {
                        value: boolean | null;
                        label: string;
                        cls: string;
                      }[]
                    ).map((opt) => (
                      <button
                        key={String(opt.value)}
                        type='button'
                        onClick={() => setAttendance(opt.value)}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${opt.cls}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {response.dietary && (
                  <div>
                    <p className='text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1'>
                      {t("col.dietary")}
                    </p>
                    <p className='text-foreground bg-white border border-border rounded-lg px-3 py-2'>
                      {response.dietary}
                    </p>
                  </div>
                )}
                {response.message && (
                  <div>
                    <p className='text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1'>
                      {t("col.message")}
                    </p>
                    <p className='text-foreground italic bg-white border border-border rounded-lg px-3 py-2'>
                      &ldquo;{response.message}&rdquo;
                    </p>
                  </div>
                )}
                <div>
                  <p className='text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1 flex items-center gap-1'>
                    <NotebookPen className='h-3 w-3' />
                    {t("admin_note")}
                  </p>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("admin_note_placeholder")}
                    className='w-full bg-white border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/40'
                  />
                </div>
              </div>

              {/* Right: nominal list */}
              {response.attendance && (
                <div>
                  <p className='text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2 flex items-center gap-1'>
                    <UserPlus className='h-3 w-3' />
                    {t("participants")} ({participants.length + 1})
                  </p>

                  <div className='space-y-2'>
                    {/* Respondent — editable */}
                    <div className='grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center min-w-0'>
                      <input value={respondentFirstName} onChange={(e) => setRespondentFirstName(e.target.value)} placeholder={t("first_name")} className={inputCls} />
                      <input value={respondentLastName} onChange={(e) => setRespondentLastName(e.target.value)} placeholder={t("last_name")} className={inputCls} />
                      <Select disabled>
                        <SelectTrigger className="bg-white h-9 text-muted-foreground">
                          <SelectValue placeholder={t("organizer")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="organizer">{t("organizer")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className='w-6' />
                    </div>

                    {/* Companions */}
                    {participants.map((p, i) => (
                      <div key={i} className='grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center min-w-0'>
                        <input value={p.first_name} onChange={(e) => updateParticipant(i, "first_name", e.target.value)} placeholder={t("first_name")} className={inputCls} />
                        <input value={p.last_name} onChange={(e) => updateParticipant(i, "last_name", e.target.value)} placeholder={t("last_name")} className={inputCls} />
                        <Select value={p.relation_type ?? ""} onValueChange={(v) => updateParticipant(i, "relation_type", v)}>
                          <SelectTrigger className="bg-white h-9">
                            <SelectValue placeholder={t("relation")} />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATION_OPTIONS.filter(o => o.value !== "").map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => removeParticipant(i)}
                          className='text-muted-foreground/40 hover:text-red-500 transition-colors'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                    ))}

                    {/* Always allow adding more */}
                    <button
                      onClick={addParticipant}
                      className='flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-1'
                    >
                      <Plus className='h-3.5 w-3.5' />
                      {t("add_participant")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Save */}
            <div className='mt-4 flex justify-end'>
              <button
                onClick={handleSave}
                disabled={saving}
                className='inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60'
              >
                {saving ? (
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Save className='h-3.5 w-3.5' />
                )}
                {saving ? t("saving") : t("save")}
              </button>
            </div>
          </div>
        </motion.div>
      </td>
    </tr>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export function RsvpResponsesTable({
  responses: initialResponses,
}: {
  responses: RsvpResponse[];
}) {
  const t = useTranslations("RsvpResponses");
  const [responses, setResponses] = useState(initialResponses);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "submitted_at",
    dir: "desc",
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    attendance: null as boolean | null,
    guestCount: "0",
    dietary: "",
    message: "",
    adminNote: "",
    participants: [] as Participant[],
  });

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" },
    );
  };

  const filtered = responses
    .filter((r) => {
      if (filter === "attending") return r.attendance === true;
      if (filter === "declined") return r.attendance === false;
      if (filter === "pending") return r.attendance === null;
      return true;
    })
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "name") return a.name.localeCompare(b.name) * dir;
      if (sort.key === "attendance") {
        // null=0, false=1, true=2 for stable ordering
        const rank = (v: boolean | null) =>
          v === null ? 0 : v === false ? 1 : 2;
        return (rank(a.attendance) - rank(b.attendance)) * dir;
      }
      return (
        (new Date(a.submitted_at).getTime() -
          new Date(b.submitted_at).getTime()) *
        dir
      );
    });

  const SortIcon = ({ col }: { col: SortKey }) =>
    sort.key === col ? (
      sort.dir === "asc" ? (
        <ChevronUp className='h-3 w-3 inline ml-1' />
      ) : (
        <ChevronDown className='h-3 w-3 inline ml-1' />
      )
    ) : (
      <ChevronDown className='h-3 w-3 inline ml-1 opacity-30' />
    );

  return (
    <div className='space-y-4'>
      {/* Search + Filters */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-border shadow-sm'>
        <div className='relative w-full sm:max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
            className='w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40'
          />
        </div>
        <div className='flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0'>
          {(["all", "attending", "declined", "pending"] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size='sm'
              onClick={() => setFilter(f)}
              className='whitespace-nowrap'
            >
              {t(`filter.${f}`)}
            </Button>
          ))}
        </div>
        <Button size='sm' onClick={() => setCreateOpen(true)} className='gap-2 whitespace-nowrap shrink-0'>
          <Plus className='h-4 w-4' />
          {t("add_response")}
        </Button>
      </div>

      {/* Table */}
      <div className='bg-white rounded-xl border border-border shadow-sm overflow-hidden'>
        {filtered.length === 0 ? (
          <div className='py-20 text-center text-muted-foreground text-sm'>
            {t("no_results")}
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table
              className='w-full text-sm'
              style={{ tableLayout: "fixed" }}
            >
              <thead>
                <tr className='border-b border-border bg-gray-50/50'>
                  <th className='w-10 px-3 py-3.5' />
                  <th
                    className='w-[18%] text-left px-4 py-3.5 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
                    onClick={() => toggleSort("name")}
                  >
                    {t("col.name")} <SortIcon col='name' />
                  </th>
                  <th
                    className='w-[16%] text-left px-4 py-3.5 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
                    onClick={() => toggleSort("attendance")}
                  >
                    {t("col.attendance")} <SortIcon col='attendance' />
                  </th>
                  <th className='w-[8%] text-left px-4 py-3.5 font-medium text-muted-foreground'>
                    {t("col.guests")}
                  </th>
                  <th className='w-[20%] text-left px-4 py-3.5 font-medium text-muted-foreground hidden md:table-cell'>
                    {t("col.dietary")}
                  </th>
                  <th className='w-[22%] text-left px-4 py-3.5 font-medium text-muted-foreground hidden lg:table-cell'>
                    {t("col.note")}
                  </th>
                  <th
                    className='w-[10%] text-left px-4 py-3.5 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
                    onClick={() => toggleSort("submitted_at")}
                  >
                    {t("col.date")} <SortIcon col='submitted_at' />
                  </th>
                  <th className='w-10 px-4 py-3.5' />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`border-b border-border hover:bg-gray-50/50 transition-colors cursor-pointer ${expanded === r.id ? "bg-gray-50/50" : ""}`}
                      onClick={() =>
                        setExpanded(expanded === r.id ? null : r.id)
                      }
                    >
                      {/* Chevron */}
                      <td className='px-3 py-4 text-muted-foreground/60'>
                        <motion.div
                          animate={{ rotate: expanded === r.id ? 180 : 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ChevronDown className='h-6 w-6' />
                        </motion.div>
                      </td>

                      {/* Name */}
                      <td className='px-4 py-4 font-medium text-foreground'>
                        <div className='flex items-center gap-2'>
                          {r.respondent_first_name && r.respondent_last_name
                            ? `${r.respondent_first_name} ${r.respondent_last_name}`
                            : r.name}
                          {r.admin_note && (
                            <NotebookPen className='h-3.5 w-3.5 text-primary/60 shrink-0' />
                          )}
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className='px-4 py-4'>
                        {r.attendance === true ? (
                          <span className='inline-flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-1 text-xs font-medium'>
                            <CheckCircle className='h-3.5 w-3.5' />
                            {t("present")}
                          </span>
                        ) : r.attendance === false ? (
                          <span className='inline-flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-100 rounded-full px-3 py-1 text-xs font-medium'>
                            <XCircle className='h-3.5 w-3.5' />
                            {t("absent")}
                          </span>
                        ) : (
                          <span className='inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 text-xs font-medium'>
                            <Clock className='h-3.5 w-3.5' />
                            {t("pending")}
                          </span>
                        )}
                      </td>

                      {/* Guest count */}
                      <td className='px-4 py-4 text-muted-foreground'>
                        {r.attendance !== false ? (
                          <span className='inline-flex items-center gap-1.5'>
                            <Users className='h-3.5 w-3.5' />
                            {r.participants && r.participants.length > 0
                              ? 1 + r.participants.length
                              : 1 + (r.guest_count ?? 0)}
                          </span>
                        ) : (
                          <span className='text-muted-foreground/40'>—</span>
                        )}
                      </td>

                      {/* Dietary */}
                      <td className='px-4 py-4 text-muted-foreground hidden md:table-cell'>
                        <span className='truncate block'>
                          {r.dietary
                            ? r.dietary.length > 30
                              ? r.dietary.slice(0, 30) + "…"
                              : r.dietary
                            : <span className='text-muted-foreground/30'>—</span>}
                        </span>
                      </td>

                      {/* Admin note preview */}
                      <td className='px-4 py-4 text-muted-foreground hidden lg:table-cell'>
                        {r.admin_note ? (
                          <span title={r.admin_note} className='inline-flex items-center gap-1.5 overflow-hidden cursor-help'>
                            <MessageSquare className='h-3.5 w-3.5 shrink-0 text-primary/50' />
                            <span className='truncate block'>
                              {r.admin_note.length > 30
                                ? r.admin_note.slice(0, 30) + "…"
                                : r.admin_note}
                            </span>
                          </span>
                        ) : (
                          <span className='text-muted-foreground/30'>—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className='px-4 py-4 text-muted-foreground text-xs'>
                        {new Intl.DateTimeFormat("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(r.submitted_at))}
                      </td>

                      {/* Delete */}
                      <td
                        className='px-4 py-4'
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setDeleteTarget({ id: r.id, name: r.name })
                          }
                          className='text-muted-foreground/30 hover:text-red-500 transition-colors'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </td>
                    </tr>

                    {/* Expand panel */}
                    <AnimatePresence>
                      {expanded === r.id && (
                        <ExpandPanelContent
                          key={r.id}
                          response={r}
                          onSaved={(updated) =>
                            setResponses((prev) =>
                              prev.map((x) =>
                                x.id === r.id ? { ...x, ...updated } : x,
                              ),
                            )
                          }
                        />
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className='text-xs text-muted-foreground text-right'>
        {filtered.length} / {responses.length} {t("responses")}
      </p>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete_dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("delete_dialog.description", {
                name: deleteTarget?.name ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={() => setDeleteTarget(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              className='bg-red-500 hover:bg-red-600 text-white'
              disabled={deleting}
              onClick={async () => {
                if (!deleteTarget) return;
                setDeleting(true);
                try {
                  await deleteRsvpResponse(deleteTarget.id);
                  setResponses((prev) =>
                    prev.filter((r) => r.id !== deleteTarget.id),
                  );
                  toast.success(t("deleted"));
                  setDeleteTarget(null);
                } catch {
                  toast.error(t("delete_error"));
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? t("deleting") : t("confirm_delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create response dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateOpen(false);
          setCreateForm({ firstName: "", lastName: "", attendance: null, guestCount: "0", dietary: "", message: "", adminNote: "", participants: [] });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("create_dialog.title")}</DialogTitle>
            <DialogDescription>{t("create_dialog.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Prénom / Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{t("first_name")}</label>
                <Input className="bg-white" value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} placeholder="Jean" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{t("last_name")}</label>
                <Input className="bg-white" value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} placeholder="Dupont" />
              </div>
            </div>

            {/* Présence */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{t("col.attendance")}</label>
              <div className="flex gap-2">
                {([
                  { value: null, label: t("pending"), cls: createForm.attendance === null ? "bg-white border-amber-300 text-amber-700 font-medium" : "bg-white border-border text-muted-foreground hover:border-amber-200" },
                  { value: true, label: t("present"), cls: createForm.attendance === true ? "bg-white border-green-300 text-green-700 font-medium" : "bg-white border-border text-muted-foreground hover:border-green-200" },
                  { value: false, label: t("absent"), cls: createForm.attendance === false ? "bg-white border-red-300 text-red-700 font-medium" : "bg-white border-border text-muted-foreground hover:border-red-200" },
                ] as { value: boolean | null; label: string; cls: string }[]).map((opt) => (
                  <button key={String(opt.value)} type="button" onClick={() => setCreateForm({ ...createForm, attendance: opt.value })} className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${opt.cls}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Régime */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{t("col.dietary")}</label>
              <Input className="bg-white" value={createForm.dietary} onChange={(e) => setCreateForm({ ...createForm, dietary: e.target.value })} placeholder="Végétarien, sans gluten..." />
            </div>

            {/* Note interne */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <NotebookPen className="h-3 w-3" />{t("admin_note")}
              </label>
              <Textarea className="bg-white" rows={2} value={createForm.adminNote} onChange={(e) => setCreateForm({ ...createForm, adminNote: e.target.value })} placeholder={t("admin_note_placeholder")} />
            </div>

            {/* Accompagnants */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <UserPlus className="h-3 w-3" />{t("add_participant")}
              </label>

              {/* Accompagnants */}
              {createForm.participants.map((p, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <Input className="bg-white" value={p.first_name} onChange={(e) => setCreateForm((f) => ({ ...f, participants: f.participants.map((x, idx) => idx === i ? { ...x, first_name: e.target.value } : x) }))} placeholder={t("first_name")} />
                  <Input className="bg-white" value={p.last_name} onChange={(e) => setCreateForm((f) => ({ ...f, participants: f.participants.map((x, idx) => idx === i ? { ...x, last_name: e.target.value } : x) }))} placeholder={t("last_name")} />
                  <Select
                    value={p.relation_type ?? ""}
                    onValueChange={(v) => setCreateForm((f) => ({ ...f, participants: f.participants.map((x, idx) => idx === i ? { ...x, relation_type: v } : x) }))}
                  >
                    <SelectTrigger className="bg-white h-9">
                      <SelectValue placeholder={t("relation")} />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATION_OPTIONS.filter(o => o.value !== "").map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button type="button" onClick={() => setCreateForm((f) => ({ ...f, participants: f.participants.filter((_, idx) => idx !== i) }))} className="text-muted-foreground/40 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button type="button" onClick={() => setCreateForm((f) => ({ ...f, participants: [...f.participants, { first_name: "", last_name: "", relation_type: "" }] }))} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-1">
                <Plus className="h-3.5 w-3.5" />{t("add_participant")}
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("cancel")}</Button>
            <Button
              disabled={creating || !createForm.firstName || !createForm.lastName}
              onClick={async () => {
                setCreating(true);
                try {
                  const newResponse = await createRsvpResponse({
                    firstName: createForm.firstName,
                    lastName: createForm.lastName,
                    attendance: createForm.attendance,
                    guestCount: createForm.participants.length,
                    dietary: createForm.dietary,
                    message: "",
                    adminNote: createForm.adminNote,
                    participants: createForm.participants,
                  });
                  setResponses((prev) => [newResponse, ...prev]);
                  toast.success(t("created"));
                  setCreateOpen(false);
                  setCreateForm({ firstName: "", lastName: "", attendance: null, guestCount: "0", dietary: "", message: "", adminNote: "", participants: [] });
                } catch {
                  toast.error(t("create_error"));
                } finally {
                  setCreating(false);
                }
              }}
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {creating ? t("creating") : t("create_dialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
