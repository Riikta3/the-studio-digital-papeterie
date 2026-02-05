"use client";

import { exportGuestsToExcel } from "@/actions/export-actions";
import { deleteHousehold } from "@/actions/guest-actions";
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
  Edit2,
  FileSpreadsheet,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AddHouseholdDialog } from "./AddHouseholdDialog";
import { EditGuestDialog } from "./EditGuestDialog";
import { GuestCard } from "./GuestCard";

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

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Génération de l'export Excel...");

    try {
      const result = await exportGuestsToExcel();

      if (result.success) {
        // Create blob and download - convert Buffer to Uint8Array for browser compatibility
        const uint8Array = new Uint8Array(result.data);
        const blob = new Blob([uint8Array], {
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

        toast.success("Export Excel réussi !", { id: toastId });
      } else {
        toast.error(result.error, { id: toastId });
      }
    } catch (_error) {
      toast.error("Erreur lors de l'export", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant='success'>{t("filter_confirmed")}</Badge>;
      case "declined":
        return <Badge variant='declined'>{t("filter_declined")}</Badge>;
      case "partial":
        return <Badge variant='warning'>Partiel</Badge>;
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
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-border shadow-sm'>
        <div className='relative w-full sm:max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder={t("search_placeholder")}
            className='pl-9 bg-gray-50/50 border-gray-200'
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
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant='outline'
          size='sm'
          className='gap-2 whitespace-nowrap'
        >
          <FileSpreadsheet className='h-4 w-4' />
          {isExporting ? "Export en cours..." : "Exporter Excel"}
        </Button>
      </div>

      {/* Table */}
      <div className='hidden md:block rounded-xl border bg-white shadow-sm overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50/50 hover:bg-gray-50/50'>
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
                  className='h-32 text-center text-muted-foreground'
                >
                  {t("no_results")}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedHouseholds.map((household) => (
                <TableRow
                  key={household.id}
                  className='group hover:bg-gray-50/80 transition-colors'
                >
                  <TableCell className='font-medium'>
                    <div className='flex items-center gap-3'>
                      <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-lg'>
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
                        <Users className='w-4 h-4 text-muted-foreground' />
                        {t("guest_count", { count: household.guestCount })}
                      </div>
                      <div className='flex flex-wrap gap-1.5 max-w-[250px]'>
                        {household.guests.map((guest: Guest) => (
                          <button
                            key={guest.id}
                            onClick={() => setEditingGuest(guest)}
                            className='group flex items-center gap-1.5 bg-gray-50 hover:bg-primary/10 px-2.5 py-1.5 rounded-md text-xs transition-all hover:shadow-sm border border-transparent hover:border-primary/20 cursor-pointer'
                          >
                            <span className='text-gray-700 group-hover:text-primary font-medium'>
                              {guest.first_name}
                            </span>
                            <Pencil className='w-3 h-3 text-gray-400 group-hover:text-primary transition-colors' />
                          </button>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='space-y-1 text-sm text-muted-foreground'>
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
                          className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
                        >
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='bg-white border-border shadow-lg'
                      >
                        <DropdownMenuItem
                          onClick={() => setEditingHousehold(household)}
                        >
                          <Edit2 className='mr-2 h-4 w-4' /> {t("edit")}
                        </DropdownMenuItem>
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
          <div className='text-center p-8 text-muted-foreground bg-white rounded-xl border border-dashed'>
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
    </div>
  );
}
