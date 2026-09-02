"use client";

import {
  downloadImportTemplate,
  exportGuestsToExcel,
} from "@/actions/export-actions";
import { deleteHousehold } from "@/actions/guest-actions";
import { importGuestsFromExcel } from "@/actions/import-actions";
import { Guest } from "@/types";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Input } from "@shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Edit2,
  FileSpreadsheet,
  Info,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AddHouseholdDialog } from "./AddHouseholdDialog";
import { EditGuestDialog } from "./EditGuestDialog";
import { GuestCard } from "./GuestCard";
import { SendMagicLinkMenuItem } from "./SendMagicLinkMenuItem";

interface GuestsTableProps {
  households: any[];
}

export function GuestsTable({ households }: GuestsTableProps) {
  const t = useTranslations("GuestsTable");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [editingHousehold, setEditingHousehold] = useState<any>(null);
  const [deletingHousehold, setDeletingHousehold] = useState<any>(null);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Handle Sort Click
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  };

  // Filter & Sort Logic
  const filteredAndSortedHouseholds = households
    .filter((h) => {
      const matchesSearch =
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.email?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || h.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle specifics like guestCount or status string comparison
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

  const handleDelete = async () => {
    if (!deletingHousehold) return;
    const toastId = toast.loading(t("toast_deleting"));
    try {
      const result = await deleteHousehold(deletingHousehold.id);
      if (result.success) {
        toast.success(t("toast_deleted"), { id: toastId });
        setDeletingHousehold(null);
        router.refresh();
      } else {
        toast.error(result.error, { id: toastId });
      }
    } catch (e) {
      toast.error(t("error_tech"), { id: toastId });
    }
  };

  const locale = useLocale();

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading(t("toast_exporting"));

    try {
      const result = await exportGuestsToExcel(locale);

      if (result.success) {
        // Convert Base64 string to Uint8Array
        const binaryString = window.atob(result.data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const date = new Date().toISOString().split("T")[0];
        a.download = `invites-mariage-${date}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success(t("toast_export_success"), { id: toastId });
      } else {
        toast.error(result.error, { id: toastId });
      }
    } catch (_error) {
      toast.error(t("toast_export_error"), { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const toastId = toast.loading(t("toast_generating_template"));
    try {
      const result = await downloadImportTemplate(locale);
      if (result.success) {
        const binaryString = window.atob(result.data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const date = new Date().toISOString().split("T")[0];
        a.download = `modele-import-invites-${date}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(t("toast_template_downloaded"), { id: toastId });
      } else {
        toast.error(result.error, { id: toastId });
      }
    } catch (error) {
      toast.error(t("toast_template_error"), { id: toastId });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant='success'>{t("filter_confirmed")}</Badge>;
      case "declined":
        return <Badge variant='declined'>{t("filter_declined")}</Badge>;
      case "partial":
        return <Badge variant='warning'>{t("filter_partial")}</Badge>;
      default:
        return <Badge variant='pending'>{t("filter_pending")}</Badge>;
    }
  };

  // Render Sort Icon
  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey)
      return <ArrowUpDown className='ml-2 h-4 w-4 opacity-50' />;
    if (sortConfig.direction === "asc")
      return <ArrowUp className='ml-2 h-4 w-4' />;
    return <ArrowDown className='ml-2 h-4 w-4' />;
  };

  return (
    <div className='space-y-4'>
      {/* Toolbar */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-studio-lavande/40 shadow-sm'>
        <div className='relative w-full sm:max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-studio-violet/50' />
          <Input
            placeholder={t("search_placeholder")}
            className='pl-9 bg-studio-lavande/5 border-studio-lavande/30'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className='flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0'>
          {(["all", "pending", "confirmed", "declined"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size='sm'
              onClick={() => setStatusFilter(s)}
              className='capitalize whitespace-nowrap'
            >
              {s === "all"
                ? t("filter_all")
                : s === "confirmed"
                  ? t("filter_confirmed")
                  : s === "declined"
                    ? t("filter_declined")
                    : t("filter_pending")}
            </Button>
          ))}
        </div>
        <div className='flex gap-2'>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant='outline'
            size='sm'
            className='gap-2 whitespace-nowrap'
          >
            <FileSpreadsheet className='h-4 w-4' />
            {isExporting ? t("exporting") : t("export")}
          </Button>
          <div className='relative'>
            <input
              type='file'
              accept='.xlsx, .xls'
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setIsImporting(true);
                const toastId = toast.loading(t("toast_importing"));

                const formData = new FormData();
                formData.append("file", file);

                try {
                  const result = await importGuestsFromExcel(formData);
                  if (result.success) {
                    toast.success(result.message, { id: toastId });
                    router.refresh();
                  } else {
                    toast.error(result.error || t("toast_import_error"), {
                      id: toastId,
                    });
                  }
                } catch (err) {
                  toast.error(t("error_tech"), { id: toastId });
                } finally {
                  setIsImporting(false);
                  // Reset input
                  e.target.value = "";
                }
              }}
              className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 peer'
              disabled={isImporting}
            />
            <Button
              variant='outline'
              size='sm'
              className='gap-2 whitespace-nowrap peer-hover:bg-accent peer-hover:text-accent-foreground'
              disabled={isImporting}
            >
              <Upload className='h-4 w-4' />
              {isImporting ? t("importing") : t("import")}
            </Button>
          </div>
          <div className='flex items-center'>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => setShowHelp(true)}
            >
              <Info className='h-4 w-4 text-studio-violet/50 cursor-help' />
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className='hidden md:block rounded-2xl border border-studio-lavande/40 bg-white shadow-sm overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='bg-studio-lavande/5 hover:bg-studio-lavande/5'>
              <TableHead className='w-[300px]'>
                <Button
                  variant='ghost'
                  onClick={() => handleSort("name")}
                  className='-ml-4 h-8 data-[state=open]:bg-accent'
                >
                  {t("header_household")}
                  <SortIcon columnKey='name' />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  onClick={() => handleSort("guestCount")}
                  className='-ml-4 h-8 data-[state=open]:bg-accent'
                >
                  {t("header_guests")}
                  <SortIcon columnKey='guestCount' />
                </Button>
              </TableHead>
              <TableHead>{t("header_contact")}</TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  onClick={() => handleSort("status")}
                  className='-ml-4 h-8 data-[state=open]:bg-accent'
                >
                  {t("header_status")}
                  <SortIcon columnKey='status' />
                </Button>
              </TableHead>
              <TableHead className='text-right'>
                {t("header_actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedHouseholds.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='h-32 text-center text-studio-violet/60'
                >
                  {t("no_results")}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedHouseholds.map((household) => (
                <TableRow
                  key={household.id}
                  className='group hover:bg-studio-lavande/5 transition-colors'
                >
                  <TableCell className='font-medium'>
                    <div className='flex items-center gap-3'>
                      <div className='h-10 w-10 rounded-full bg-studio-violet/10 flex items-center justify-center text-studio-violet font-heading font-bold text-lg'>
                        {household.name.charAt(0)}
                      </div>
                      <div>
                        <div className='font-heading text-lg'>
                          {household.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-1 text-sm font-medium'>
                        <Users className='w-4 h-4 text-studio-violet/50' />
                        {t("guest_count", { count: household.guestCount })}
                      </div>
                      <div className='flex flex-wrap gap-1.5 max-w-[250px]'>
                        {household.guests.map((guest: Guest) => (
                          <button
                            key={guest.id}
                            onClick={() => setEditingGuest(guest)}
                            className='group flex items-center gap-1.5 bg-studio-lavande/10 hover:bg-studio-violet/10 px-2.5 py-1.5 rounded-md text-xs transition-all hover:shadow-sm border border-transparent hover:border-studio-violet/20 cursor-pointer'
                          >
                            <span className='text-studio-violet/70 group-hover:text-studio-violet font-medium'>
                              {guest.first_name}
                            </span>
                            <Pencil className='w-3 h-3 text-studio-violet/40 group-hover:text-studio-violet transition-colors' />
                          </button>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='space-y-1 text-sm text-studio-violet/60'>
                      {household.email && (
                        <div className='flex items-center gap-2'>
                          <Mail className='w-3 h-3' /> {household.email}
                        </div>
                      )}
                      {household.phone && (
                        <div className='flex items-center gap-2'>
                          <Phone className='w-3 h-3' /> {household.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(household.status)}</TableCell>
                  <TableCell className='text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          className='h-8 w-8 p-0 text-studio-violet/60 hover:text-studio-violet'
                        >
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='bg-white border-studio-lavande/40 shadow-lg'
                      >
                        <DropdownMenuItem
                          onClick={() => setEditingHousehold(household)}
                        >
                          <Edit2 className='mr-2 h-4 w-4' /> {t("edit")}
                        </DropdownMenuItem>
                        <SendMagicLinkMenuItem
                          householdId={household.id}
                          householdName={household.name}
                          email={household.email}
                        />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className='text-red-600 focus:text-red-600 focus:bg-red-50'
                          onClick={() => setDeletingHousehold(household)}
                        >
                          <Trash2 className='mr-2 h-4 w-4' /> {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View (Cards) */}
      <div className='md:hidden space-y-4'>
        {filteredAndSortedHouseholds.length === 0 ? (
          <div className='text-center p-8 text-studio-violet/60 bg-white rounded-2xl border border-dashed border-studio-lavande/40'>
            {t("no_results")}
          </div>
        ) : (
          filteredAndSortedHouseholds.map((household) => (
            <GuestCard
              key={household.id}
              id={household.id}
              name={household.name}
              email={household.email}
              phone={household.phone}
              guests={household.guests}
              guestCount={household.guestCount}
              status={
                household.status as
                  | "pending"
                  | "confirmed"
                  | "declined"
                  | "partial"
              }
              onEditGuest={setEditingGuest}
            />
          ))
        )}
      </div>

      {/* Edit Dialog */}
      {editingHousehold && (
        <AddHouseholdDialog
          open={!!editingHousehold}
          onOpenChange={(open) => !open && setEditingHousehold(null)}
          household={{
            ...editingHousehold,
            status: editingHousehold.status,
          }}
          hideTrigger
        />
      )}

      {/* Delete Confirmation */}
      <Dialog
        open={!!deletingHousehold}
        onOpenChange={(open) => !open && setDeletingHousehold(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete_title")}</DialogTitle>
            <DialogDescription>
              {t("delete_desc", { name: deletingHousehold?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDeletingHousehold(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              className='bg-red-600 text-white hover:bg-red-700'
              onClick={handleDelete}
            >
              {t("confirm_delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Guest Dialog */}
      <EditGuestDialog
        guest={editingGuest}
        open={!!editingGuest}
        onOpenChange={(open) => {
          if (!open) {
            setEditingGuest(null);
            router.refresh();
          }
        }}
      />

      {/* Help / Import Dialog */}
      <Dialog
        open={showHelp}
        onOpenChange={setShowHelp}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("help_dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("help_dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <ol className='list-decimal list-inside space-y-2 text-sm text-studio-violet/60'>
              <li>{t("help_dialog.step_1")}</li>
              <li>{t("help_dialog.step_2")}</li>
              <li>{t("help_dialog.step_3")}</li>
              <li>{t("help_dialog.step_4")}</li>
            </ol>
            <div className='bg-studio-lavande/10 p-3 rounded-md text-xs text-studio-violet flex gap-2'>
              <Info className='h-4 w-4 shrink-0' />
              <p>{t("help_dialog.tip")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowHelp(false)}
            >
              {t("help_dialog.close")}
            </Button>
            <Button
              onClick={handleDownloadTemplate}
              className='gap-2'
            >
              <Download className='h-4 w-4' />
              {t("help_dialog.download_template")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
