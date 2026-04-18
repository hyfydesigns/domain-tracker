"use client";

import { useEffect } from "react";
import { useDomainStore } from "@/store/domain-store";

export function StoreInitializer() {
  const loadAll = useDomainStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return null;
}
