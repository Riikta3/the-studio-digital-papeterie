"use client";

import {
  createRsvpResponse,
  deleteRsvpResponse,
  deleteRsvpResponses,
  updateRsvpResponse,
  type Participant,
} from "@/actions/rsvp-response-actions";
import {
  downloadRsvpTemplate,
  exportRsvpToExcel,
  importRsvpFromExcel,
} from "@/actions/rsvp-excel-actions";
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
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  MessageSquare,
  NotebookPen,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
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
import { DIETARY_OPTIONS_FR } from "@shared/data/dietary-options";
import { useLocale, useTranslations } from "next-intl";
import React, { useRef, useState } from "react";
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

// ─── Dietary Select ───────────────────────────────────────────────────────────

function DietarySelect({
  value,
  onChange,
  inputCls,
}: {
  value: string;
  onChange: (v: string) => void;
  inputCls?: string;
}) {
  const selected = value
    ? value.split(",").map((v) => v.trim()).filter(Boolean)
    : [];

  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((v) => v !== option)
      : [...selected, option];
    // Keep any custom "Autre: ..." value at the end
    const custom = selected.find((v) => !DIETARY_OPTIONS_FR.includes(v as any));
    const base = next.filter((v) => DIETARY_OPTIONS_FR.includes(v as any));
    onChange([...base, ...(custom && !base.includes(custom) ? [custom] : [])].join(", "));
  };

  const customValue = selected.find((v) => !DIETARY_OPTIONS_FR.includes(v as any)) ?? "";

  const handleCustom = (raw: string) => {
    const base = selected.filter((v) => DIETARY_OPTIONS_FR.includes(v as any));
    const parts = raw.trim() ? [...base, raw.trim()] : base;
    onChange(parts.join(", "));
  };

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap gap-1.5'>
        {DIETARY_OPTIONS_FR.map((opt) => (
          <button
            key={opt}
            type='button'
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
              selected.includes(opt)
                ? "bg-primary/10 border-primary/40 text-primary font-medium"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <input
        type='text'
        value={customValue}
        onChange={(e) => handleCustom(e.target.value)}
        placeholder='Autre (précisez)...'
        className={inputCls ?? "w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/40"}
      />
    </div>
  );
}

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
  const [dietary, setDietary] = useState(response.dietary ?? "");
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
        dietary,
        participants,
        respondent_first_name: respondentFirstName,
        respondent_last_name: respondentLastName,
        attendance,
      });
      onSaved({
        admin_note: note,
        dietary,
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
        colSpan={9}
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

                <div>
                  <p className='text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2'>
                    {t("col.dietary")}
                  </p>
                  <DietarySelect value={dietary} onChange={setDietary} />
                </div>
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
  const locale = useLocale();
  const [responses, setResponses] = useState(initialResponses);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
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

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filtered = responses
    .filter((r) => {
      if (filter === "attending") return r.attendance === true;
      if (filter === "declined") return r.attendance === false;
      if (filter === "pending") return r.attendance === null;
      return true;
    })
    .filter((r) => {
      const q = search.toLowerCase();
      if (!q) return true;
      const respondentName = `${r.respondent_first_name ?? ""} ${r.respondent_last_name ?? ""}`.toLowerCase();
      if (r.name.toLowerCase().includes(q) || respondentName.includes(q)) return true;
      if (Array.isArray(r.participants)) {
        return r.participants.some(
          (p) =>
            p.first_name?.toLowerCase().includes(q) ||
            p.last_name?.toLowerCase().includes(q) ||
            `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase().includes(q),
        );
      }
      return false;
    })
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

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

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
      {/* Toolbar */}
      <div className='bg-white rounded-xl border border-border shadow-sm p-4 space-y-3'>
        {/* Row 1 — Search + Filters */}
        <div className='flex flex-col sm:flex-row gap-3 items-center'>
          <div className='relative w-full sm:max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_placeholder")}
              className='w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
            />
          </div>
          <div className='flex gap-2 flex-wrap sm:ml-auto'>
            {(["all", "attending", "declined", "pending"] as Filter[]).map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size='sm' onClick={() => setFilter(f)} className='whitespace-nowrap'>
                {t(`filter.${f}`)}
              </Button>
            ))}
          </div>
        </div>

        {/* Row 2 — Actions */}
        <div className='flex flex-wrap gap-2 border-t border-border pt-3'>
          {/* Export */}
          <Button variant="outline" size="sm" disabled={isExporting} className="gap-2"
            onClick={async () => {
              setIsExporting(true);
              try {
                const result = await exportRsvpToExcel(locale);
                if (result.success) {
                  const bytes = Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0));
                  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `rsvp-${new Date().toISOString().slice(0, 10)}.xlsx`;
                  a.click();
                  URL.revokeObjectURL(url);
                } else {
                  toast.error(result.error);
                }
              } finally {
                setIsExporting(false);
              }
            }}
          >
            <FileSpreadsheet className="h-4 w-4" />
            {isExporting ? t("exporting") : t("export")}
          </Button>

          {/* Import */}
          <div className="relative">
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isImporting}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsImporting(true);
                const id = toast.loading(t("importing"));
                const formData = new FormData();
                formData.append("file", file);
                try {
                  const result = await importRsvpFromExcel(formData);
                  if (result.success) {
                    toast.success(result.message, { id });
                    window.location.reload();
                  } else {
                    toast.error(result.error, { id });
                  }
                } catch {
                  toast.error(t("import_error"), { id });
                } finally {
                  setIsImporting(false);
                  e.target.value = "";
                }
              }}
            />
            <Button variant="outline" size="sm" disabled={isImporting} className="gap-2 pointer-events-none">
              <Upload className="h-4 w-4" />
              {isImporting ? t("importing") : t("import")}
            </Button>
          </div>

          {/* Template */}
          <Button variant="outline" size="sm" className="gap-2"
            onClick={async () => {
              const result = await downloadRsvpTemplate(locale);
              if (result.success) {
                const bytes = Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0));
                const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "modele-rsvp.xlsx";
                a.click();
                URL.revokeObjectURL(url);
              }
            }}
          >
            <Download className="h-4 w-4" />
            {t("template")}
          </Button>

          {/* Ajouter — séparé à droite */}
          <Button size='sm' onClick={() => setCreateOpen(true)} className='gap-2 ml-auto'>
            <Plus className='h-4 w-4' />
            {t("add_response")}
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className='flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3'
          >
            <span className='text-sm font-medium text-red-700'>
              {selected.size} réponse{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""}
            </span>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' onClick={() => setSelected(new Set())}>
                Annuler
              </Button>
              <Button
                size='sm'
                className='bg-red-500 hover:bg-red-600 text-white gap-2'
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className='h-4 w-4' />
                Supprimer la sélection
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <th className='w-10 px-3 py-3.5'>
                    <input
                      type='checkbox'
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className='h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer'
                    />
                  </th>
                  <th className='w-10 px-2 py-3.5' />
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
                      className={`border-b border-border hover:bg-gray-50/50 transition-colors cursor-pointer ${expanded === r.id ? "bg-gray-50/50" : ""} ${selected.has(r.id) ? "bg-primary/5" : ""}`}
                      onClick={() =>
                        setExpanded(expanded === r.id ? null : r.id)
                      }
                    >
                      {/* Checkbox */}
                      <td className='px-3 py-4'>
                        <input
                          type='checkbox'
                          checked={selected.has(r.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleSelect(r.id)}
                          className='h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer'
                        />
                      </td>

                      {/* Chevron */}
                      <td className='px-2 py-4 text-muted-foreground/60'>
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

      {/* Bulk delete confirmation dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={(open) => { if (!open) setBulkDeleteOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer {selected.size} réponse{selected.size > 1 ? "s" : ""} ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Les {selected.size} réponse{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""} seront définitivement supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' onClick={() => setBulkDeleteOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              className='bg-red-500 hover:bg-red-600 text-white'
              disabled={bulkDeleting}
              onClick={async () => {
                setBulkDeleting(true);
                try {
                  await deleteRsvpResponses(Array.from(selected));
                  setResponses((prev) => prev.filter((r) => !selected.has(r.id)));
                  toast.success(`${selected.size} réponse${selected.size > 1 ? "s" : ""} supprimée${selected.size > 1 ? "s" : ""}`);
                  setSelected(new Set());
                  setBulkDeleteOpen(false);
                } catch {
                  toast.error(t("delete_error"));
                } finally {
                  setBulkDeleting(false);
                }
              }}
            >
              {bulkDeleting ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : null}
              {bulkDeleting ? t("deleting") : t("confirm_delete")}
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
              <DietarySelect
                value={createForm.dietary}
                onChange={(v) => setCreateForm({ ...createForm, dietary: v })}
                inputCls="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
              />
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
