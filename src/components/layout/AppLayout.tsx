import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationsRealtime } from '@/hooks/useNotificationsRealtime';
import { fetchDashboardStats, fetchStockByCategory, fetchMovementsByDay } from '@/services/dashboard';
import { fetchRequests } from '@/services/requests';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('ebd-sidebar-collapsed') === 'true';
  });
  const location = useLocation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  useNotificationsRealtime();

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    void import('@/pages/DashboardPage');
    queryClient.prefetchQuery({ queryKey: ['dashboard-stats'], queryFn: fetchDashboardStats });
    queryClient.prefetchQuery({ queryKey: ['requests', 'all'], queryFn: fetchRequests });
    queryClient.prefetchQuery({ queryKey: ['stock-by-category'], queryFn: fetchStockByCategory });
    queryClient.prefetchQuery({ queryKey: ['movements-by-day'], queryFn: () => fetchMovementsByDay(14) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.role]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('ebd-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  if (!profile) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
      />
      <div
        className={`flex flex-1 flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div key={location.pathname} className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
