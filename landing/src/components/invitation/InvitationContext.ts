"use client";
import { createContext, useContext } from "react";

interface InvitationContextValue {
  introDone: boolean;
}

export const InvitationContext = createContext<InvitationContextValue>({
  introDone: true,
});

export function useInvitationContext() {
  return useContext(InvitationContext);
}
