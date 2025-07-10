import { SidebarTrigger } from '@/components/ui/sidebar';

export const GlobalHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <SidebarTrigger className="ml-2" />
    </header>
  );
};