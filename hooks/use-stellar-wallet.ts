"use client";

import { useState, useCallback, useEffect } from "react";
import { useFreighter } from "./use-freighter";
import { isMobileDevice, generateSep7TxUri } from "@/lib/stellar/sep7";
import { useToast } from "./use-toast";
import { useLedger, type LedgerState } from "./use-ledger";

export type SigningMethod = "extension" | "sep7" | "ledger";

export interface UseStellarWalletReturn {
    publicKey: string | null;
    isConnecting: boolean;
    method: SigningMethod | null;
    signTx: (xdr: string, network: "testnet" | "mainnet") => Promise<string>;
    connect: () => Promise<void>;
    disconnect: () => void;
    // SEP-7 specific state for the UI to consume
    sep7Uri: string | null;
    isSep7ModalOpen: boolean;
    setSep7ModalOpen: (open: boolean) => void;
    // Ledger specific state
    ledger: LedgerState;
    connectLedger: () => Promise<void>;
}

export function useStellarWallet(): UseStellarWalletReturn {
    const freighter = useFreighter();
    const { toast } = useToast();
    const ledger = useLedger();

    const [method, setMethod] = useState<SigningMethod | null>(null);
    const [sep7Uri, setSep7Uri] = useState<string | null>(null);
    const [isSep7ModalOpen, setIsSep7ModalOpen] = useState(false);

    // Auto-detect recommended method on mount or connection
    useEffect(() => {
        if (freighter.publicKey) {
            setMethod("extension");
        } else if (ledger.publicKey) {
            setMethod("ledger");
        } else if (isMobileDevice()) {
            setMethod("sep7");
        }
    }, [freighter.publicKey, ledger.publicKey]);

    const connect = useCallback(async () => {
        if (isMobileDevice()) {
            setMethod("sep7");
            toast({
                title: "Mobile Mode",
                description: "SEP-7 deep-linking enabled. You will be prompted to sign in your mobile wallet.",
            });
            return;
        }

        try {
            await freighter.connect();
            setMethod("extension");
        } catch (err) {
            console.error("Freighter connection failed", err);
            setMethod("sep7"); // Fallback
        }
    }, [freighter, toast]);

    const connectLedger = useCallback(async () => {
        setMethod("ledger");
        const publicKey = await ledger.connect();
        if (!publicKey) {
            setMethod(null);
        }
    }, [ledger, toast]);

    const disconnect = useCallback(() => {
        freighter.disconnect();
        ledger.disconnect();
        setMethod(null);
        setSep7Uri(null);
    }, [freighter, ledger]);

    const signTx = useCallback(
        async (xdr: string, network: "testnet" | "mainnet"): Promise<string> => {
            // Ledger signing
            if (method === "ledger" && ledger.isConnected) {
                return await ledger.signTransaction(xdr);
            }

            // If we're on mobile or don't have Freighter, use SEP-7
            if (isMobileDevice() || method === "sep7" || !freighter.isInstalled) {
                const networkPassphrase =
                    network === "testnet"
                        ? "Test SDF Network ; September 2015"
                        : "Public Global Stellar Network ; September 2015";

                const uri = generateSep7TxUri({
                    xdr,
                    networkPassphrase,
                    msg: "Sign BatchPay Transaction",
                });

                setSep7Uri(uri);
                setIsSep7ModalOpen(true);

                // Return a promise that never resolves here because the user is 
                // redirecting away or using a QR code. The app will need to 
                // poll for the transaction completion separately.
                return new Promise(() => { });
            }

            // Default to Freighter if on desktop
            return await freighter.signTx(xdr, network);
        },
        [freighter, method, ledger]
    );

    return {
        publicKey: freighter.publicKey || ledger.publicKey,
        isConnecting: freighter.isConnecting || ledger.isConnecting,
        method,
        connect,
        disconnect,
        signTx,
        sep7Uri,
        isSep7ModalOpen,
        setSep7ModalOpen: setIsSep7ModalOpen,
        ledger,
        connectLedger,
    };
}
