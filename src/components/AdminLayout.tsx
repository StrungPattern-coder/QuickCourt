import React, { useEffect } from 'react';
import BrandNav from '@/components/BrandNav';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle }) => {
  // Force light theme for admin pages
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    
    // Also ensure body has proper background
    document.body.style.backgroundColor = '#f9fafb'; // gray-50
    
    return () => {
      // Clean up on unmount
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 light">
      <BrandNav />
      <div className="pt-20 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
