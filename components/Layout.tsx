
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, Calendar, Wallet, FileBarChart, 
  Menu, X, LogOut, Pill, FileText, Star, Clock, AlertTriangle 
} from 'lucide-react';
import { MenuItem, User } from '../types';
import { dataService } from '../services/dataService';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: FileBarChart, path: '/' },
  { id: 'employees', label: 'Nhân sự', icon: Users, path: '/employees' },
  { id: 'shifts', label: 'Lịch trực', icon: Clock, path: '/shifts' },
  { id: 'attendance', label: 'Chấm công', icon: Calendar, path: '/attendance' },
  { id: 'funds', label: 'Quỹ Khoa', icon: Wallet, path: '/funds' },
  { id: 'reports', label: 'Báo cáo đơn', icon: Pill, path: '/reports' },
  { id: 'evaluation', label: 'Đánh giá năm', icon: Star, path: '/evaluation' },
  { id: 'proposals', label: 'Tờ trình', icon: FileText, path: '/proposals' },
];

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isDemo = dataService.isDemo();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-700 bg-slate-900">
          <Pill className="w-8 h-8 text-teal-400 mr-2" />
          <h1 className="text-xl font-bold tracking-wider">PHARMA<span className="text-teal-400">HR</span></h1>
        </div>

        <div className="p-4">
          <div className="flex items-center space-x-3 mb-6 p-3 bg-slate-700 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center font-bold text-lg">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-slate-400 uppercase">{user.role}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-teal-600 text-white shadow-md' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700 bg-slate-900">
          <button 
            onClick={onLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white shadow-sm flex items-center justify-between px-4 z-10">
          <button onClick={toggleSidebar} className="text-gray-600 focus:outline-none">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-gray-800">PharmaHR Manager</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        {/* Demo Banner */}
        {isDemo && (
          <div className="bg-yellow-100 px-4 py-2 text-yellow-800 text-sm font-medium text-center flex items-center justify-center border-b border-yellow-200">
             <AlertTriangle size={16} className="mr-2" />
             Đang chạy chế độ DEMO (Dữ liệu giả lập - Không lưu vào Server)
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
