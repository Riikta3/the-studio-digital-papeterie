"use client";

import { BillingRecord } from "@/actions/billing-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Filter,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

interface BillingHistoryProps {
  history: BillingRecord[];
}

type SortConfig = {
  key: keyof BillingRecord | null;
  direction: "asc" | "desc";
};

export function BillingHistory({ history }: BillingHistoryProps) {
  const t = useTranslations("Billing");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? fr : enUS;

  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "created_at",
    direction: "desc",
  });

  // Derive available years from history
  const years = useMemo(() => {
    const uniqueYears = Array.from(
      new Set(
        history.map((record) => new Date(record.created_at).getFullYear()),
      ),
    );
    return uniqueYears.sort((a, b) => b - a);
  }, [history]);

  // Generate months list
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2000, i, 1); // arbitrary year
      return {
        value: i.toString(),
        label: format(date, "MMMM", { locale: dateLocale }),
      };
    });
  }, [dateLocale]);

  // Filter & Sort logic
  const filteredHistory = useMemo(() => {
    // 1. Filter
    const filtered = history.filter((record) => {
      const date = new Date(record.created_at);
      const yearMatch =
        selectedYear === "all" ||
        date.getFullYear().toString() === selectedYear;
      const monthMatch =
        selectedMonth === "all" || date.getMonth().toString() === selectedMonth;
      return yearMatch && monthMatch;
    });

    // 2. Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aValue = a[sortConfig.key] ?? ""; // Handle nulls
        const bValue = b[sortConfig.key] ?? ""; // Handle nulls

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [history, selectedYear, selectedMonth, sortConfig]);

  const requestSort = (key: keyof BillingRecord) => {
    let direction: "asc" | "desc" = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      setSortConfig({ key: null, direction: "desc" }); // Reset to default state
      return;
    }

    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: keyof BillingRecord) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className='ml-2 h-4 w-4 opacity-50' />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className='ml-2 h-4 w-4' />
    ) : (
      <ArrowDown className='ml-2 h-4 w-4' />
    );
  };

  const clearFilters = () => {
    setSelectedYear("all");
    setSelectedMonth("all");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return (
          <Badge className='bg-green-100 text-green-700 hover:bg-green-200 border-green-200'>
            {t("status_succeeded")}
          </Badge>
        );
      case "pending":
        return (
          <Badge className='bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200'>
            {t("status_pending")}
          </Badge>
        );
      case "failed":
        return (
          <Badge className='bg-red-100 text-red-700 hover:bg-red-200 border-red-200'>
            {t("status_failed")}
          </Badge>
        );
      case "refunded":
        return (
          <Badge
            variant='outline'
            className='text-muted-foreground'
          >
            {t("status_refunded")}
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  const hasActiveFilters = selectedYear !== "all" || selectedMonth !== "all";

  const showEmptyState = history.length === 0;
  const showNoResults = !showEmptyState && filteredHistory.length === 0;

  if (showEmptyState) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200'>
        <div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4'>
          <Download className='w-8 h-8 text-primary' />
        </div>
        <h3 className='text-lg font-heading font-semibold text-gray-900 mb-2'>
          {t("no_invoices_title")}
        </h3>
        <p className='text-muted-foreground text-center max-w-md'>
          {t("no_invoices_desc")}
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Filters Bar */}
      <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
        <div className='flex items-center gap-2 w-full sm:w-auto'>
          {/* Year Select */}
          <Select
            value={selectedYear}
            onValueChange={setSelectedYear}
          >
            <SelectTrigger className='w-[180px] bg-white'>
              <SelectValue placeholder={t("filter_year_all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t("filter_year_all")}</SelectItem>
              {years.map((year) => (
                <SelectItem
                  key={year}
                  value={year.toString()}
                >
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Month Select */}
          <Select
            value={selectedMonth}
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger className='w-[140px] bg-white'>
              <SelectValue placeholder={t("filter_month_all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t("filter_month_all")}</SelectItem>
              {months.map((month) => (
                <SelectItem
                  key={month.value}
                  value={month.value}
                >
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant='ghost'
              size='sm'
              onClick={clearFilters}
              className='h-10 px-2 lg:px-3 text-muted-foreground hover:text-foreground'
            >
              <X className='mr-2 h-4 w-4' />
              {t("filter_clear")}
            </Button>
          )}
        </div>
        <div className='text-sm text-muted-foreground'>
          {t("results_count", { count: filteredHistory.length })}
        </div>
      </div>

      <div className='rounded-md border border-border bg-white overflow-hidden shadow-sm'>
        <div className='p-6 border-b border-border bg-gray-50/50 flex justify-between items-center'>
          <h3 className='font-heading text-lg font-semibold text-primary'>
            {t("history_title")}
          </h3>
        </div>

        {showNoResults ? (
          <div className='p-12 text-center text-muted-foreground'>
            <Filter className='w-12 h-12 mx-auto mb-4 opacity-20' />
            <p>{t("no_results_filters")}</p>
            <Button
              variant='link'
              onClick={clearFilters}
            >
              {t("filter_clear")}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead
                  className='cursor-pointer hover:bg-muted/50 transition-colors'
                  onClick={() => requestSort("created_at")}
                >
                  <div className='flex items-center'>
                    {t("date_label")}
                    {getSortIcon("created_at")}
                  </div>
                </TableHead>
                <TableHead
                  className='cursor-pointer hover:bg-muted/50 transition-colors'
                  onClick={() => requestSort("plan_name")}
                >
                  <div className='flex items-center'>
                    {t("plan_label")}
                    {getSortIcon("plan_name")}
                  </div>
                </TableHead>
                <TableHead
                  className='cursor-pointer hover:bg-muted/50 transition-colors'
                  onClick={() => requestSort("amount")}
                >
                  <div className='flex items-center'>
                    {t("amount_label")}
                    {getSortIcon("amount")}
                  </div>
                </TableHead>
                <TableHead
                  className='cursor-pointer hover:bg-muted/50 transition-colors'
                  onClick={() => requestSort("status")}
                >
                  <div className='flex items-center'>
                    {t("status_label")}
                    {getSortIcon("status")}
                  </div>
                </TableHead>
                <TableHead className='text-right'>
                  {t("invoice_label")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((record) => (
                <TableRow
                  key={record.id}
                  className='hover:bg-gray-50/50'
                >
                  <TableCell className='font-medium'>
                    {format(new Date(record.created_at), "dd MMM yyyy", {
                      locale: dateLocale,
                    })}
                  </TableCell>
                  <TableCell className='capitalize'>
                    {record.plan_name}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(record.amount, record.currency)}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell className='text-right'>
                    {record.invoice_url ? (
                      <a
                        href={record.invoice_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors'
                      >
                        <Download className='h-4 w-4' />
                        {t("download_invoice")}
                      </a>
                    ) : (
                      <span className='text-muted-foreground text-sm italic'>
                        -
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
