/**
 * Active-applicant context. Selecting an applicant anywhere (the list, a graph
 * peer) makes every applicant-scoped screen - 360, Timeline, Graph - follow the
 * same subject, so the console feels like one coherent investigation.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface ActiveApplicant {
  id: string | null;
  setId: (id: string | null) => void;
}

const Ctx = createContext<ActiveApplicant | null>(null);

export function ApplicantProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const value = useMemo(() => ({ id, setId }), [id]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActiveApplicant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useActiveApplicant must be used within provider");
  return ctx;
}
