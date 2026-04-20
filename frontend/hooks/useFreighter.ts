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

  async function checkConnection() {
    try {
      const connected = await freighterApi.isConnected();
      if (connected.isConnected) {
        const result = await freighterApi.getAddress();
        if (!result.error) setPublicKey(result.address);
      }
    } catch {
      // Freighter not installed, ignore
    }
  }

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await freighterApi.getAddress();
      if (result.error) throw new Error(String(result.error));
      setPublicKey(result.address);
    } catch (e: any) {
      setError(e.message);
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