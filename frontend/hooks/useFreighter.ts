"use client";
import { useState, useEffect, useCallback } from "react";
import freighterApi from "@stellar/freighter-api";

export function useFreighter() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  // Silent check on mount — only restores a session that's already approved.
  async function checkConnection() {
    try {
      const { isConnected } = await freighterApi.isConnected();
      if (!isConnected) return;
      const result = await freighterApi.getAddress();
      if (!result.error) setPublicKey(result.address);
    } catch {
      // Freighter not installed — ignore silently
    }
  }

  // Called on button click — must use requestAccess() to trigger the popup.
  // getAddress() alone never shows the permission prompt on new/unrecognised domains.
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { isConnected } = await freighterApi.isConnected();
      if (!isConnected) {
        throw new Error(
          "Freighter extension not found. Install it at freighter.app, switch to Testnet, then try again."
        );
      }
      // requestAccess() is what pops up the Freighter approval dialog
      const result = await freighterApi.requestAccess();
      if (result.error) throw new Error(String(result.error));
      setPublicKey(result.address);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Wallet connection failed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sign = useCallback(async (xdr: string): Promise<string> => {
    const result = await freighterApi.signTransaction(xdr, {
      networkPassphrase: "Test SDF Network ; September 2015",
    });
    if (result.error) throw new Error(String(result.error));
    return result.signedTxXdr;
  }, []);

  const shortKey = publicKey
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
    : null;

  return { publicKey, shortKey, connect, sign, isLoading, error };
}
