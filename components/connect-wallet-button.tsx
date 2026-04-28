"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * "Connect Wallet" button that integrates with Freighter, Ledger, or SEP-7 via WalletProvider.
 *
 * Shows:
 *  - "Connect Wallet" when disconnected (opens modal with options)
 *  - Truncated public key + Disconnect when connected
 *  - Loading spinner when connecting
 *  - Install prompt when Freighter is not detected
 */
export function ConnectWalletButton() {
    const { publicKey, isConnecting, isInstalled, error, connect, disconnect, ledger, connectLedger } =
        useWallet();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ── Freighter not installed ──────────────────────────────────
    if (isInstalled === false) {
        return (
            <div className="flex flex-col items-start gap-2">
                <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Button variant="outline" className="gap-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                        <WalletIcon className="h-4 w-4" />
                        Install Freighter
                    </Button>
                </a>
                <p className="text-xs text-muted-foreground">
                    Freighter browser extension is required to sign transactions.
                </p>
            </div>
        );
    }

    // ── Connected ────────────────────────────────────────────────
    if (publicKey) {
        const truncated = `${publicKey.slice(0, 4)}…${publicKey.slice(-4)}`;
        const methodLabel = ledger.isConnected ? "Ledger" : "Freighter";
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-mono text-emerald-300">{truncated}</span>
                    <span className="text-xs text-emerald-400/70">({methodLabel})</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnect}
                    className="text-muted-foreground hover:text-destructive"
                >
                    Disconnect
                </Button>
            </div>
        );
    }

    // ── Disconnected / Connecting ────────────────────────────────
    return (
        <>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button
                        disabled={isConnecting || ledger.isConnecting}
                        className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                    >
                        {isConnecting || ledger.isConnecting ? (
                            <>
                                <LoaderIcon className="h-4 w-4 animate-spin" />
                                Connecting…
                            </>
                        ) : (
                            <>
                                <WalletIcon className="h-4 w-4" />
                                Connect Wallet
                            </>
                        )}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Connect Wallet</DialogTitle>
                        <DialogDescription>
                            Choose how you want to connect to Stellar BatchPay
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Button
                            variant="outline"
                            className="gap-2 justify-start h-auto py-4"
                            onClick={() => {
                                connect();
                                setIsModalOpen(false);
                            }}
                        >
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                                <rect x="2" y="2" width="20" height="20" rx="5" fill="#6C5CE7" />
                                <path d="M7 12h10M12 7v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <div className="text-left">
                                <p className="font-semibold">Freighter</p>
                                <p className="text-xs text-muted-foreground">Browser extension wallet</p>
                            </div>
                        </Button>

                        {ledger.isWebUSBSupported && (
                            <Button
                                variant="outline"
                                className="gap-2 justify-start h-auto py-4"
                                onClick={() => {
                                    connectLedger();
                                    setIsModalOpen(false);
                                }}
                            >
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                                    <rect x="2" y="4" width="20" height="16" rx="2" fill="#1A1A2E" stroke="#4A4A6A" />
                                    <circle cx="12" cy="12" r="3" fill="#00D4AA" />
                                </svg>
                                <div className="text-left">
                                    <p className="font-semibold">Ledger</p>
                                    <p className="text-xs text-muted-foreground">Hardware wallet (USB)</p>
                                </div>
                            </Button>
                        )}

                        {ledger.error && (
                            <p className="text-xs text-destructive">{ledger.error}</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </>
    );
}

/* ── Inline SVG icons ────────────────────────────────────────── */

function WalletIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </svg>
    );
}

function LoaderIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}
