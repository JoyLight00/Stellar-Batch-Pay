"use client";

import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ParsedPaymentFile, PaymentValidationRow } from "@/lib/stellar/types";

interface BatchDryRunProps {
  result: ParsedPaymentFile;
  className?: string;
}

export function BatchDryRun({ result, className }: BatchDryRunProps) {
  const { rows, validPayments, invalidCount } = result;
  const duplicateCount = rows.filter(r => r.isDuplicate).length;
  
  // Calculate totals per asset
  const totals = validPayments.reduce((acc, curr) => {
    acc[curr.asset] = (acc[curr.asset] || 0) + Number(curr.amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Valid Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{validPayments.length}</div>
            <p className="text-xs text-slate-500 mt-1">Ready for submission</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Errors Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", invalidCount > 0 ? "text-red-500" : "text-slate-600")}>
              {invalidCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Require correction</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Duplicates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", duplicateCount > 0 ? "text-amber-500" : "text-slate-600")}>
              {duplicateCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Same recipient multiple times</p>
          </CardContent>
        </Card>
      </div>

      {/* Asset Summary */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Asset Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(totals).map(([asset, amount]) => (
              <div key={asset} className="bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase font-semibold">{asset}</div>
                <div className="text-lg font-bold text-white">{amount.toLocaleString()}</div>
              </div>
            ))}
            {Object.keys(totals).length === 0 && (
              <div className="text-slate-500 italic text-sm">No valid payments to summarize</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-lg text-white">Validation Details</CardTitle>
        </CardHeader>
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="bg-slate-900 sticky top-0 z-10">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="w-[80px]">Row</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <RowItem key={row.rowNumber} row={row} />
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function RowItem({ row }: { row: PaymentValidationRow }) {
  const { rowNumber, instruction, valid, isDuplicate, error } = row;
  
  return (
    <TableRow className={cn(
      "border-slate-800/50 transition-colors",
      !valid && "bg-red-500/[0.02]",
      isDuplicate && "bg-amber-500/[0.02]"
    )}>
      <TableCell className="font-mono text-slate-500">{rowNumber}</TableCell>
      <TableCell className="max-w-[200px] truncate">
        <div className="flex flex-col">
          <span className={cn("font-medium", !valid && "text-red-400")}>
            {instruction.address || <span className="italic opacity-50">Empty</span>}
          </span>
          {error && (
            <span className={cn("text-[10px] mt-0.5", isDuplicate ? "text-amber-500" : "text-red-500")}>
              {error}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="font-bold text-white">{instruction.amount}</TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300">
          {instruction.asset}
        </Badge>
      </TableCell>
      <TableCell>
        {valid ? (
          <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Valid
          </div>
        ) : isDuplicate ? (
          <div className="flex items-center gap-1.5 text-amber-500 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Duplicate
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-red-500 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            Invalid
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
