// src/pro/usePro.ts
import React from "react";
import { useEffect, useState, useCallback, createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ProCtx = {
  hasPro: boolean;
  setPro: (v: boolean) => Promise<void>;
  loading: boolean;
};

const Ctx = createContext<ProCtx>({ hasPro: false, setPro: async () => {}, loading: true });

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [hasPro, setHasPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("hasPro");
        setHasPro(raw === "1");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setPro = useCallback(async (v: boolean) => {
    setHasPro(v);
    await AsyncStorage.setItem("hasPro", v ? "1" : "0");
  }, []);

  return <Ctx.Provider value={{ hasPro, setPro, loading }}>{children}</Ctx.Provider>;
}

export function usePro() {
  return useContext(Ctx);
}
