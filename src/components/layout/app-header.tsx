import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { HeaderPageTitle } from "@/components/layout/header-page-title";
import { QuickAddButton } from "@/components/layout/quick-add-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 sm:px-6">
      <MobileSidebar />
      <HeaderPageTitle />
      <div className="ml-auto flex items-center gap-2">
        <QuickAddButton />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
