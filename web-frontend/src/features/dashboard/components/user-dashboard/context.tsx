import { createContext, useContext } from "react";
import type { AuthUser } from "@/src/types/auth";
import type { Company } from "@/src/types/company";

export type DashboardContextValue = {
  user: AuthUser;
  refreshUser: () => Promise<void>;
  openVerificationModal: () => void;
  verificationModalSignal: number;
  companies: Company[];
  activeCompany: Company | null;
  reloadCompanies: () => Promise<void>;
};

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within DashboardFrame");
  }
  return context;
};
