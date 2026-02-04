"use client";

import { deleteHousehold } from "@/actions/guest-actions";
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
  DropdownMenuLabel,
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
  Edit2,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AddHouseholdDialog } from "./AddHouseholdDialog";

interface GuestsTableProps {
  households: any[];
}

export function GuestsTable({ households }: GuestsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [editingHousehold, setEditingHousehold] = useState<any>(null);
  const [deletingHousehold, setDeletingHousehold] = useState<any>(null);

  // Filter Logic
  const filteredHouseholds = households.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (!deletingHousehold) return;
    const toastId = toast.loading("Suppression en cours...");
    try {
      const result = await deleteHousehold(deletingHousehold.id);
      if (result.success) {
        toast.success("Foyer supprimé !", { id: toastId });
        setDeletingHousehold(null);
        router.refresh();
      } else {
        toast.error(result.error, { id: toastId });
      }
    } catch (e) {
      toast.error("Erreur technique", { id: toastId });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant='success'>Confirmé</Badge>;
      case "declined":
        return <Badge variant='destructive'>Décliné</Badge>;
      case "partial":
        return <Badge variant='warning'>Partiel</Badge>;
      default:
        return <Badge variant='pending'>En attente</Badge>;
    }
  };

  return (
    <div className='space-y-4'>
      {/* Toolbar */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-border shadow-sm'>
        <div className='relative w-full sm:max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Rechercher un foyer...'
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
                ? "Tous"
                : s === "confirmed"
                  ? "Confirmés"
                  : s === "declined"
                    ? "Déclinés"
                    : "En attente"}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className='rounded-xl border bg-white shadow-sm overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50/50 hover:bg-gray-50/50'>
              <TableHead className='w-[300px]'>Foyer / Famille</TableHead>
              <TableHead>Invités</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHouseholds.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='h-32 text-center text-muted-foreground'
                >
                  Aucun résultat trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredHouseholds.map((household) => (
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
                        <div className='text-xs text-muted-foreground flex items-center gap-1'>
                          Since {new Date().getFullYear()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-1 text-sm font-medium'>
                        <Users className='w-4 h-4 text-muted-foreground' />
                        {household.guestCount} invité(s)
                      </div>
                      <div className='text-xs text-muted-foreground truncate max-w-[200px]'>
                        {household.guests
                          .map((g: any) => g.first_name)
                          .join(", ")}
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
                          className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                        >
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setEditingHousehold(household)}
                        >
                          <Edit2 className='mr-2 h-4 w-4' /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className='text-red-600 focus:text-red-600 focus:bg-red-50'
                          onClick={() => setDeletingHousehold(household)}
                        >
                          <Trash2 className='mr-2 h-4 w-4' /> Supprimer
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

      {/* Edit Dialog */}
      {editingHousehold && (
        <AddHouseholdDialog
          open={!!editingHousehold}
          onOpenChange={(open) => !open && setEditingHousehold(null)}
          household={editingHousehold}
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
            <DialogTitle>Supprimer ce foyer ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le foyer "{deletingHousehold?.name}
              " sera supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDeletingHousehold(null)}
            >
              Annuler
            </Button>
            <Button
              className='bg-red-600 text-white hover:bg-red-700'
              onClick={handleDelete}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
