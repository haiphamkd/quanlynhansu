
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, Calendar, Wallet, FileBarChart, 
  Menu, LogOut, Pill, FileText, Star, Clock, AlertTriangle, Sparkles, Building, Settings, ShieldAlert,
  ChevronDown, ChevronUp, KeyRound, Lock, User as UserIcon, X, CheckCircle
} from 'lucide-react';
import { MenuItem, User } from '../types';
import { dataService } from '../services/dataService';
import { AppButton } from './AppButton';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: FileBarChart, path: '/' },
  { id: 'employees', label: 'Nhân sự', icon: Users, path: '/employees', allowedRoles: ['admin', 'operator', 'manager'] },
  { id: 'shifts', label: 'Lịch trực', icon: Clock, path: '/shifts' },
  { id: 'attendance', label: 'Chấm công', icon: Calendar, path: '/attendance' },
  { id: 'funds', label: 'Quỹ Khoa', icon: Wallet, path: '/funds', allowedRoles: ['admin', 'operator', 'manager'] },
  { id: 'reports', label: 'Báo cáo đơn', icon: Pill, path: '/reports' },
  { id: 'evaluation', label: 'Đánh giá năm', icon: Star, path: '/evaluation', allowedRoles: ['admin', 'operator', 'manager'] },
  { id: 'proposals', label: 'Tờ trình', icon: FileText, path: '/proposals' },
  { id: 'accounts', label: 'Hệ thống', icon: ShieldAlert, path: '/accounts', allowedRoles: ['admin', 'operator'] },
  { id: 'categories', label: 'Danh mục', icon: Settings, path: '/categories', allowedRoles: ['admin', 'operator'] },
  { id: 'ai', label: 'Trợ lý AI', icon: Sparkles, path: '/ai-assistant', allowedRoles: ['admin', 'operator', 'manager'] },
];

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const location = useLocation();
  const isDemo = dataService.isDemo();
  const menuRef = useRef<HTMLDivElement>(null);

  // Change Password State
  const [passForm, setPassForm] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [passLoading, setPassLoading] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMenu = MENU_ITEMS.filter(item => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(user.role);
  });

  const getRoleName = (role: string) => {
    switch(role) {
        case 'admin': return 'Quản trị viên';
        case 'operator': return 'Người điều hành';
        case 'manager': return 'Trưởng khoa';
        case 'staff': return 'Nhân viên';
        default: return role;
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (passForm.newPass !== passForm.confirmPass) {
          alert("Mật khẩu mới và xác nhận không khớp.");
          return;
      }
      if (passForm.newPass.length < 1) { // In prod, check length > 6
          alert("Mật khẩu mới quá ngắn.");
          return;
      }

      setPassLoading(true);
      try {
          // 1. Verify old password by trying to login
          const verify = await dataService.login(user.username, passForm.oldPass);
          if (!verify.success) {
              alert("Mật khẩu cũ không chính xác.");
              setPassLoading(false);
              return;
          }

          // 2. Change password
          const res = await dataService.changePassword(user.username, passForm.newPass);
          if (res.success) {
              alert("Đổi mật khẩu thành công!");
              setIsChangePassOpen(false);
              setPassForm({ oldPass: '', newPass: '', confirmPass: '' });
          } else {
              alert("Lỗi: " + res.error);
          }
      } catch (error) {
          console.error(error);
          alert("Đã xảy ra lỗi hệ thống.");
      } finally {
          setPassLoading(false);
      }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive Drawer */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col shadow-lg md:shadow-none`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <div className="bg-teal-600 p-1.5 rounded-lg mr-3 shadow-sm">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">PHARMA<span className="text-teal-600">HR</span></h1>
        </div>

        {/* User Profile Dropdown */}
        <div className="p-4 border-b border-gray-100 shrink-0 relative" ref={menuRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`w-full flex items-center p-2 rounded-xl border transition-all duration-200 ${isUserMenuOpen ? 'bg-teal-50 border-teal-200 ring-2 ring-teal-100' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 mx-3 text-left">
              <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 font-medium uppercase truncate">{getRoleName(user.role)}</p>
            </div>
            {isUserMenuOpen ? <ChevronUp size={16} className="text-teal-600"/> : <ChevronDown size={16} className="text-gray-400"/>}
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
               <div className="px-4 py-2 border-b border-gray-50 mb-1">
                   <p className="text-xs text-gray-400">Đang đăng nhập:</p>
                   <p className="text-sm font-bold text-gray-800 truncate">{user.username}</p>
                   {user.department && <p className="text-[10px] text-teal-600 mt-0.5 flex items-center"><Building size={10} className="mr-1"/>{user.department}</p>}
               </div>
               
               <button 
                 onClick={() => { setIsChangePassOpen(true); setIsUserMenuOpen(false); }}
                 className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
               >
                 <KeyRound size={16} className="mr-2 text-gray-400" /> Đổi mật khẩu
               </button>
               
               <div className="h-px bg-gray-100 my-1 mx-2"></div>
               
               <button 
                 onClick={onLogout}
                 className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
               >
                 <LogOut size={16} className="mr-2" /> Đăng xuất
               </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          <nav className="space-y-1">
            {filteredMenu.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-200' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        {/* Mobile Header (Hidden on md+) */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10 sticky top-0 shadow-sm">
          <button onClick={toggleSidebar} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-gray-800 text-lg">PharmaHR</span>
          <div className="w-6" /> 
        </header>

        {/* Demo Banner */}
        {isDemo && (
          <div className="bg-amber-50 px-4 py-2 text-amber-800 text-xs font-medium text-center flex items-center justify-center border-b border-amber-100 shadow-sm z-10">
             <AlertTriangle size={14} className="mr-2" />
             Chế độ Demo - Dữ liệu sẽ không được lưu vào hệ thống
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {isChangePassOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                   <h3 className="font-bold text-gray-800 flex items-center">
                      <Lock size={18} className="mr-2 text-teal-600"/> Đổi mật khẩu
                   </h3>
                   <button onClick={() => setIsChangePassOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Mật khẩu cũ</label>
                      <input 
                         type="password" required
                         value={passForm.oldPass}
                         onChange={e => setPassForm({...passForm, oldPass: e.target.value})}
                         className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                         placeholder="••••••"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Mật khẩu mới</label>
                      <input 
                         type="password" required
                         value={passForm.newPass}
                         onChange={e => setPassForm({...passForm, newPass: e.target.value})}
                         className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                         placeholder="••••••"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Xác nhận mật khẩu mới</label>
                      <input 
                         type="password" required
                         value={passForm.confirmPass}
                         onChange={e => setPassForm({...passForm, confirmPass: e.target.value})}
                         className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                         placeholder="••••••"
                      />
                   </div>

                   <div className="pt-2">
                      <AppButton type="submit" variant="primary" icon={CheckCircle} loading={passLoading} className="w-full">
                         Xác nhận đổi
                      </AppButton>
                   </div>
                </form>
             </div>
         </div>
      )}
    </div>
  );
};

export default Layout;
