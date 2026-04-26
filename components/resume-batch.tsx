"use client";

/**
 * ResumeBatch — surface prior incomplete batches and let the user retry
 * only the unconfirmed transactions (#255).
 */

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listBatches,
  deleteBatch,
  getPendingTransactions,
  type PersistedBatch,
} from "@/lib/batch-persistence";

interface ResumeBatchProps {
  /** Called when the user chooses to resume a specific batch. */
  onResume: (batch: PersistedBatch) => void;
}

export function ResumeBatch({ onResume }: ResumeBatchProps) {
  const [batches, setBatches] = useState<PersistedBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listBatches()
      .then((all) => {
        // Only show batches that still have unconfirmed transactions
        setBatches(all.filter((b) => getPendingTransactions(b).length > 0));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || batches.length === 0) return null;

  async function handleDiscard(jobId: string) {
    await deleteBatch(jobId);
    setBatches((prev) => prev.filter((b) => b.jobId !== jobId));
  }

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
          <AlertTriangle className="size-4" />
          Incomplete batch{batches.length > 1 ? "es" : ""} detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-slate-400">
          A previous submission did not complete. Resuming will retry only the
          transactions that were not confirmed — already-confirmed transactions
          will be skipped.
        </p>
        {batches.map((batch) => {
          const pending = getPendingTransactions(batch);
          return (
            <div
              key={batch.jobId}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-white">
                  {batch.network === "mainnet" ? "Mainnet" : "Testnet"} batch
                </p>
                <p className="text-[0.65rem] text-slate-500">
                  {pending.length} of {batch.transactions.length} transaction
                  {batch.transactions.length > 1 ? "s" : ""} pending ·{" "}
                  {new Date(batch.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-white/10 text-xs"
                  onClick={() => onResume(batch)}
                >
                  <RefreshCw className="mr-1 size-3" />
                  Resume
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-slate-500 hover:text-red-400"
                  onClick={() => handleDiscard(batch.jobId)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
