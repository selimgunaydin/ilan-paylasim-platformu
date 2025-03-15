'use client'

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@app/components/ui/table";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@app/components/ui/pagination";
import Link from "next/link";

// Tip tanımlaması - schema.ts'deki yapıyla uyumlu
interface ConversationWithDetails {
  id: number;
  listingId: number;
  listingTitle: string;
  sender: {
    id: number;
    username: string;
  };
  receiver: {
    id: number;
    username: string;
  };
  messageCount: number;
  createdAt: string;
}

interface PaginatedResponse {
  data: ConversationWithDetails[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export default function AllMessages() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const limit = 10;

  // Tüm konuşmaları getir
  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["/api/admin/conversations", page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/admin/conversations?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const conversations = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tüm Mesajlar</h2>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>İlan Başlığı</TableHead>
              <TableHead>Gönderici</TableHead>
              <TableHead>Alıcı</TableHead>
              <TableHead className="text-center">Mesaj Sayısı</TableHead>
              <TableHead className="text-center">Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.map((conversation) => (
              <TableRow key={conversation.id}>
                <TableCell>{conversation.listingTitle}</TableCell>
                <TableCell>{conversation.sender.username}</TableCell>
                <TableCell>{conversation.receiver.username}</TableCell>
                <TableCell className="text-center">{conversation.messageCount}</TableCell>
                <TableCell className="text-center">
                  {new Date(conversation.createdAt).toLocaleString("tr-TR")}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/yonetim/ilanmesajdetayi/${conversation.id}`}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Detayları Göster
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              >
                <PaginationPrevious className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setPage(p)}
                      isActive={page === p}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                </React.Fragment>
              ))}

            <PaginationItem>
              <PaginationLink
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                className={page === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
              >
                <PaginationNext className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}