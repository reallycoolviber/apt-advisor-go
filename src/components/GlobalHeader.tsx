import { SidebarMenu } from '@/components/ui/sidebar-menu';

export const GlobalHeader = () => {
  return (
    <>
      <SidebarMenu />
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-start border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4">
        {/* Header content - the sidebar menu provides its own trigger */}
      </header>
    </>
  );
};