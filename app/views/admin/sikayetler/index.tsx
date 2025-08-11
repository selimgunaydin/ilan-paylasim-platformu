"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@app/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@app/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@app/components/ui/select";
import { Badge } from "@app/components/ui/badge";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@app/components/ui/button";
import { useToast } from "@app/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@app/components/ui/tooltip";

const statusOptions = [
  { value: "pending", label: "Beklemede" },
  { value: "reviewed", label: "İncelendi" },
  { value: "resolved", label: "Çözüldü" },
];

type ReportItem = {
  id: number;
  reportType: "listing" | "message";
  contentId: number;
  reason: string;
  status: string;
  createdAt: string;
  reporterId: number;
  reportedUserId: number;
  reporterUsername: string | null;
  reportedUsername: string | null;
  reporterLink: string;
  reportedLink: string;
  contentLink: string;
};

async function fetchReports(params: { type?: "listing" | "message"; status?: string; page?: number; perPage?: number }) {
  const usp = new URLSearchParams();
  if (params.type) usp.set("type", params.type);
  if (params.status) usp.set("status", params.status);
  if (params.page) usp.set("page", String(params.page));
  if (params.perPage) usp.set("perPage", String(params.perPage));
  const res = await fetch(`/api/admin/reports?${usp.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Şikayetler yüklenemedi");
  return (await res.json()) as { items: ReportItem[] };
}

async function updateReportStatus(id: number, status: string) {
  const res = await fetch(`/api/admin/reports`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Güncelleme başarısız");
  return await res.json();
}

const StatusBadge = ({ value }: { value: string }) => {
  const label = statusOptions.find(s => s.value === value)?.label ?? value;
  const cls: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    reviewed: "bg-blue-100 text-blue-800 border-blue-200",
    resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return (
    <Badge className={`border pointer-events-none select-none transition-none ${cls[value] ?? ""}`}>{label}</Badge>
  );
};

export default function ReportsAdminView() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"listing" | "message">("listing");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchReports({ type: activeTab, status: statusFilter === "all" ? undefined : statusFilter });
      setItems(data.items);
    } catch (e: any) {
      toast({ title: "Yüklenemedi", description: e.message || "Şikayetler alınırken bir sorun oluştu", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter]);

  

  const onChangeStatus = async (id: number, next: string) => {
    const prev = items.slice();
    setItems((list) => list.map((it) => (it.id === id ? { ...it, status: next } : it)));
    try {
      await updateReportStatus(id, next);
      toast({ title: "Güncellendi", description: "Şikayet durumu güncellendi." });
    } catch (e: any) {
      setItems(prev);
      toast({ title: "Güncellenemedi", description: e.message || "Durum güncellenirken hata oluştu", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Şikayetler</h2>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Duruma göre filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="gap-2">
          <TabsTrigger
            value="listing"
            className="px-4 py-2 text-sm md:text-base data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border transition-transform data-[state=active]:-translate-y-px"
          >
            İlan Şikayetleri
          </TabsTrigger>
          <TabsTrigger
            value="message"
            className="px-4 py-2 text-sm md:text-base data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border transition-transform data-[state=active]:-translate-y-px"
          >
            Mesaj Şikayetleri
          </TabsTrigger>
        </TabsList>
        <TabsContent value="listing">
          <ReportsTable items={items} loading={loading} onChangeStatus={onChangeStatus} />
        </TabsContent>
        <TabsContent value="message">
          <ReportsTable items={items} loading={loading} onChangeStatus={onChangeStatus} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportsTable({ items, loading, onChangeStatus }: { items: ReportItem[]; loading: boolean; onChangeStatus: (id: number, s: string) => void }) {
  return (
    <div className="border rounded-md overflow-hidden overflow-x-auto">
      <Table className="w-full min-w-[900px] md:min-w-0 table-auto">
        <colgroup>
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-3 text-left">#</TableHead>
            <TableHead className="px-4 py-3 text-left">Tür</TableHead>
            <TableHead className="px-4 py-3 text-left">Neden</TableHead>
            <TableHead className="px-4 py-3 text-left">Raporlayan</TableHead>
            <TableHead className="px-4 py-3 text-left">Raporlanan</TableHead>
            <TableHead className="px-4 py-3 text-left whitespace-nowrap">İçerik</TableHead>
            <TableHead className="px-4 py-3 text-left">Durum</TableHead>
            <TableHead className="px-4 py-3 text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8}>Yükleniyor...</TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>Kayıt bulunamadı</TableCell>
            </TableRow>
          ) : (
            items.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="px-4 py-3 align-middle">{r.id}</TableCell>
                <TableCell className="px-4 py-3 align-middle capitalize">{r.reportType === "message" ? "Mesaj" : "İlan"}</TableCell>
                <TableCell className="px-4 py-3 align-middle whitespace-normal min-w-0">
                  {r.reason && r.reason.length > 70 ? (
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate" aria-label={r.reason}>{r.reason}</span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm break-words whitespace-normal">
                          {r.reason}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="block truncate">{r.reason}</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 align-middle whitespace-normal break-words min-w-0">
                  <Link className="text-primary font-medium px-1.5 py-1 rounded hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={r.reporterLink}>{r.reporterUsername ?? r.reporterId}</Link>
                </TableCell>
                <TableCell className="px-4 py-3 align-middle whitespace-normal break-words min-w-0">
                  <Link className="text-primary font-medium px-1.5 py-1 rounded hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={r.reportedLink}>{r.reportedUsername ?? r.reportedUserId}</Link>
                </TableCell>
                <TableCell className="px-4 py-3 align-middle whitespace-nowrap">
                  <Link className="inline-flex items-center text-primary underline underline-offset-1 font-medium px-1.5 py-0.5 rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={r.contentLink}>
                    Detaya git
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3 align-middle">
                  <StatusBadge value={r.status} />
                </TableCell>
                <TableCell className="px-4 py-3 align-middle text-right">
                  <Select value={r.status} onValueChange={(v) => onChangeStatus(r.id, v)}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
