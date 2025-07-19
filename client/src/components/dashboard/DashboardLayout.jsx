import { useState } from 'react';
import { motion } from 'framer-motion';
import  {Sidebar } from './SideBar';
import { TopNavbar } from './TopNavbar';
import { Footer } from './Footer';

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        
        <motion.main 
          className="flex-1 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>

        <Footer />
      </div>
    </div>
  );
}
