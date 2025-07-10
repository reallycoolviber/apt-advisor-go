import { SidebarTrigger } from '@/components/ui/sidebar';

export const GlobalHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-start border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4">
      <SidebarTrigger className="h-8 w-8 flex items-center justify-center" />
    </header>
  );
};