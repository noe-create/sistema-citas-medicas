

"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading: boolean;
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  emptyState: {
      icon: LucideIcon;
      title: string;
      description: string;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  pageCount,
  currentPage,
  onPageChange,
  emptyState,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <div>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                    return (
                        <TableHead key={header.id}>
                        {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            )}
                        </TableHead>
                    );
                    })}
                </TableRow>
                ))}
            </TableHeader>
             <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="h-64 text-center">
                             <div className="flex justify-center items-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        </TableCell>
                    </TableRow>
                ) : table.getRowModel().rows?.length ? (
                     <AnimatePresence>
                        {table.getRowModel().rows.map((row) => (
                            <motion.tr
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                layout
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                                className="border-b transition-colors hover:bg-muted/50"
                            >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="p-4 align-middle">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                ) : (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <emptyState.icon className="h-12 w-12 mb-4" />
                            <h3 className="text-xl font-semibold">{emptyState.title}</h3>
                            <p className="text-sm">{emptyState.description}</p>
                        </div>
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
            <span className="text-sm text-muted-foreground">
                Página {currentPage} de {pageCount || 1}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= pageCount}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    </div>
  );
}
