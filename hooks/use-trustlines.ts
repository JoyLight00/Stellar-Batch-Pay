"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Horizon } from "stellar-sdk";
import { horizonService } from "@/services/horizon";

export type TrustlineCheckResult = {
  address: string;
  hasTrustline: boolean;
};

export function useTrustlines(assetCode: string, assetIssuer?: string) {
  const { publicKey, network } = useWallet();
  const [results, setResults] = useState<TrustlineCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkTrustlines = useCallback(async (addresses: string[]) => {
    if (!publicKey || !network || addresses.length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const horizonNetwork = network === 'testnet' || network === 'mainnet' ? network : 'testnet';
      const server = horizonService.getServer(horizonNetwork);

      // We'll check each address sequentially for simplicity.
      // In production, we might want to batch or use parallel requests with a limit.
      const trustlineResults: TrustlineCheckResult[] = [];

      for (const address of addresses) {
        try {
          const account = await server.loadAccount(address);
          const hasTrustline = account.balances.some(
            (balance) =>
              balance.asset_type !== "native" &&
              balance.asset_code === assetCode &&
              balance.asset_issuer === assetIssuer
          );
          trustlineResults.push({ address, hasTrustline });
        } catch (err) {
          // If we can't load the account, assume no trustline (or handle error)
          console.warn(`Failed to load account ${address}:`, err);
          trustlineResults.push({ address, hasTrustline: false });
        }
      }

      setResults(trustlineResults);
    } catch (err) {
      console.error("Failed to check trustlines:", err);
      setError(
        err instanceof Error ? err.message : "Failed to check trustlines"
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey, network, assetCode, assetIssuer]);

  // Refetch when wallet reconnects (publicKey changes) or when asset changes
  const refetch = useCallback((addresses: string[]) => {
    checkTrustlines(addresses);
  }, [checkTrustlines]);

  return { results, loading, error, refetch };
}