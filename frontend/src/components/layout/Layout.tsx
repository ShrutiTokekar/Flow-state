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
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-flow-yellow">
      <Header onMenuToggle={() => setIsSidebarOpen(o => !o)} isSidebarOpen={isSidebarOpen} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        {/* Bottom padding on phones leaves room for the tab bar */}
        <main className="flex-1 overflow-y-auto min-w-0 p-3 sm:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
};