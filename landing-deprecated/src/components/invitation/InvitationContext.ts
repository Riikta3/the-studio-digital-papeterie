"use client";
import { createContext, useContext } from "react";

interface InvitationContextValue {
  introDone: boolean;
  activeTheme: string;
}

export const InvitationContext = createContext<InvitationContextValue>({
  introDone: true,
  activeTheme: "",
});

export function useInvitationContext() {
  return useContext(InvitationContext);
}
