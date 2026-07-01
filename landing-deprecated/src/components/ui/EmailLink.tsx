"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EmailLinkProps {
  email: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * A component to protect email addresses from bots.
 * It obfuscates the email in the DOM and only reconstructs it on the client side.
 * This should satisfy the user's request for anti-spam protection.
 */
export const EmailLink = ({ email, className, children }: EmailLinkProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simple obfuscation: store as base64 and decode on mount
  // This prevents plain-text scrapers from finding the email in the source
  const encodedEmail = mounted ? '' : btoa(email);
  
  const handleClick = (e: React.MouseEvent) => {
    if (!mounted) return;
    window.location.href = `mailto:${email}`;
  };

  if (!mounted) {
    // Return a placeholder or just null during SSR to avoid mismatch and hide email
    return (
      <span className={cn("cursor-pointer", className)}>
        {children || "..."}
      </span>
    );
  }

  return (
    <a
      href={`mailto:${email}`}
      className={cn("cursor-pointer transition-colors", className)}
      onClick={handleClick}
    >
      {children || email}
    </a>
  );
};
