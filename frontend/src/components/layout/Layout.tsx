import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileTabBar } from './MobileTabBar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-flow-yellow/70">
      {/* Fixed sidebar on large screens, slide-in drawer below that */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setIsSidebarOpen(o => !o)} isSidebarOpen={isSidebarOpen} />
        {/* Bottom padding on phones leaves room for the tab bar */}
        <main className="flex-1 overflow-y-auto min-w-0 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
};
