"use client";

import {
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
  const selectCls =
    "bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground w-full";

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
                      <input
                        value={respondentFirstName}
                        onChange={(e) => setRespondentFirstName(e.target.value)}
                        placeholder={t("first_name")}
                        className={inputCls}
                      />
                      <input
                        value={respondentLastName}
                        onChange={(e) => setRespondentLastName(e.target.value)}
                        placeholder={t("last_name")}
                        className={inputCls}
                      />
                      <select
                        className={selectCls}
                        disabled
                      >
                        <option value=''>{t("organizer")}</option>
                      </select>
                      {/* spacer to align with trash buttons below */}
                      <div className='w-6' />
                    </div>

                    {/* Companions */}
                    {participants.map((p, i) => (
                      <div
                        key={i}
                        className='grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center min-w-0'
                      >
                        <input
                          value={p.first_name}
                          onChange={(e) =>
                            updateParticipant(i, "first_name", e.target.value)
                          }
                          placeholder={t("first_name")}
                          className={inputCls}
                        />
                        <input
                          value={p.last_name}
                          onChange={(e) =>
                            updateParticipant(i, "last_name", e.target.value)
                          }
                          placeholder={t("last_name")}
                          className={inputCls}
                        />
                        <select
                          value={p.relation_type ?? ""}
                          onChange={(e) =>
                            updateParticipant(
                              i,
                              "relation_type",
                              e.target.value,
                            )
                          }
                          className={selectCls}
                        >
                          {RELATION_OPTIONS.map((o) => (
                            <option
                              key={o.value}
                              value={o.value}
                            >
                              {o.label}
                            </option>
                          ))}
                        </select>
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
      <div className='flex flex-col sm:flex-row gap-3'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
            className='w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/40'
          />
        </div>
        <div className='flex gap-2'>
          {(["all", "attending", "declined", "pending"] as Filter[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
                }`}
              >
                {t(`filter.${f}`)}
              </button>
            ),
          )}
        </div>
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
                    className='text-left px-4 py-3.5 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
                    onClick={() => toggleSort("name")}
                  >
                    {t("col.name")} <SortIcon col='name' />
                  </th>
                  <th
                    className='text-left px-4 py-3.5 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
                    onClick={() => toggleSort("attendance")}
                  >
                    {t("col.attendance")} <SortIcon col='attendance' />
                  </th>
                  <th className='text-left px-4 py-3.5 font-medium text-muted-foreground'>
                    {t("col.guests")}
                  </th>
                  <th className='text-left px-4 py-3.5 font-medium text-muted-foreground hidden md:table-cell'>
                    {t("col.dietary")}
                  </th>
                  <th className='text-left px-4 py-3.5 font-medium text-muted-foreground hidden lg:table-cell'>
                    {t("col.note")}
                  </th>
                  <th
                    className='text-left px-4 py-3.5 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
                    onClick={() => toggleSort("submitted_at")}
                  >
                    {t("col.date")} <SortIcon col='submitted_at' />
                  </th>
                  <th className='px-4 py-3.5 w-10' />
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
                          {r.name}
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
                      <td className='px-4 py-4 text-muted-foreground hidden md:table-cell max-w-[160px]'>
                        <span className='truncate block'>
                          {r.dietary || (
                            <span className='text-muted-foreground/30'>—</span>
                          )}
                        </span>
                      </td>

                      {/* Admin note preview */}
                      <td className='px-4 py-4 text-muted-foreground hidden lg:table-cell max-w-[180px]'>
                        {r.admin_note ? (
                          <span className='inline-flex items-center gap-1.5'>
                            <MessageSquare className='h-3.5 w-3.5 shrink-0 text-primary/50' />
                            <span className='truncate'>{r.admin_note}</span>
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
    </div>
  );
}
