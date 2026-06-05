"use client";

import { useMemo } from "react";
import { LogOutIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="hidden lg:block text-xs text-muted-foreground max-w-[160px] truncate"
        title={user.email}
      >
        {user.email}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        aria-label="로그아웃"
        title={`로그아웃 (${user.email})`}
      >
        <LogOutIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
