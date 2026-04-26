"use client";

/**
 * TransactionProgress — real-time progress visualizer for batch submission (#259).
 *
 * Tracks each stage of a multi-transaction batch:
 *   Building → Signing → Submitting → Confirming
 * and shows per-transaction progress (e.g. "Submitting transaction 3 of 7")
 * with a link to the block explorer for the current hash.
 */

import { CheckCircle2, Circle, Loader2, XCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type BatchStage = "building" | "signing" | "submitting" | "confirming" | "done" | "error";

export interface TransactionProgressProps {
  stage: BatchStage;
  /** Current 1-based transaction index (for multi-tx batches). */
  currentTx?: number;
  /** Total number of transactions in the batch. */
  totalTx?: number;
  /** Hash of the transaction currently being submitted / confirmed. */
  currentHash?: string;
  /** Human-readable error message when stage === "error". */
  errorMessage?: string;
  /** Stellar network for block explorer links. */
  network?: "testnet" | "mainnet";
  className?: string;
}

const STAGES: { key: BatchStage; label: string }[] = [
  { key: "building", label: "Building" },
  { key: "signing", label: "Signing" },
  { key: "submitting", label: "Submitting" },
  { key: "confirming", label: "Confirming" },
];

const STAGE_ORDER: Record<BatchStage, number> = {
  building: 0,
  signing: 1,
  submitting: 2,
  confirming: 3,
  done: 4,
  error: 4,
};

function explorerUrl(hash: string, network: "testnet" | "mainnet"): string {
  const base =
    network === "mainnet"
      ? "https://stellar.expert/explorer/public/tx"
      : "https://stellar.expert/explorer/testnet/tx";
  return `${base}/${hash}`;
}

export function TransactionProgress({
  stage,
  currentTx,
  totalTx,
  currentHash,
  errorMessage,
  network = "testnet",
  className,
}: TransactionProgressProps) {
  const currentStageOrder = STAGE_ORDER[stage];
  const isError = stage === "error";
  const isDone = stage === "done";

  return (
    <div className={cn("rounded-xl border border-white/10 bg-white/5 p-4 space-y-4", className)}>
      {/* Stage stepper */}
      <ol className="flex items-center gap-0">
        {STAGES.map((s, i) => {
          const order = STAGE_ORDER[s.key];
          const isActive = s.key === stage;
          const isComplete = !isError && currentStageOrder > order;
          const isPending = !isError && currentStageOrder < order;

          return (
            <li key={s.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    isActive && !isError
                      ? "bg-emerald-500 text-white"
                      : isComplete
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isError && isActive
                          ? "bg-red-500/20 text-red-400"
                          : "bg-white/10 text-white/30",
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="size-4" />
                  ) : isActive && !isError ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isError && i === currentStageOrder ? (
                    <XCircle className="size-4" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[0.6rem] font-semibold uppercase tracking-wider",
                    isActive && !isError
                      ? "text-emerald-400"
                      : isComplete
                        ? "text-emerald-400/60"
                        : "text-white/30",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={cn(
                    "mb-5 h-px flex-1 mx-1 transition-colors",
                    isComplete ? "bg-emerald-500/40" : "bg-white/10",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Per-transaction progress */}
      {totalTx !== undefined && currentTx !== undefined && totalTx > 1 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-white/50">
            <span>
              Transaction {currentTx} of {totalTx}
            </span>
            <span>{Math.round((currentTx / totalTx) * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(currentTx / totalTx) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Current hash */}
      {currentHash && !isError && (
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
          <span className="truncate font-mono text-[0.6rem] text-white/40">
            {currentHash}
          </span>
          <a
            href={explorerUrl(currentHash, network)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-emerald-400 hover:text-emerald-300"
            aria-label="View on block explorer"
          >
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}

      {/* Error message */}
      {isError && errorMessage && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {errorMessage}
        </p>
      )}

      {/* Done state */}
      {isDone && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 className="size-3.5" />
          All transactions confirmed successfully.
        </p>
      )}
    </div>
  );
}
