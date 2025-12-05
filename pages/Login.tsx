
import React, { useState, useEffect } from 'react';
import { Pill, Lock, User as UserIcon, Settings, Globe, PlayCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Config State
  const [showConfig, setShowConfig] = useState(false);
  const [webAppUrl, setWebAppUrl] = useState(dataService.getApiUrl());
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'failed'>('none');
  const [statusMsg, setStatusMsg] = useState('');

  const handleTestConnection = async () => {
    setLoading(true);
    setConnectionStatus('none');
    dataService.setApiUrl(webAppUrl); // Update service with current input
    
    const result = await dataService.testConnection();
    setConnectionStatus(result.success ? 'success' : 'failed');
    setStatusMsg(result.message);
    setLoading(false);
  };

  const handleDemoMode = () => {
    dataService.setDemoMode(true);
    // Auto login as admin for demo
    const demoUser: User = { username: 'admin', role: 'admin', name: 'Quản trị viên (Demo)' };
    onLogin(demoUser);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    dataService.setDemoMode(false); // Reset demo mode
    dataService.setApiUrl(webAppUrl);
    
    try {
      const res = await dataService.login(username, password);
      if (res.success && res.user) {
        onLogin(res.user);
      } else {
        setError(res.error || 'Đăng nhập thất bại');
      }
    } catch (e: any) {
      setError(e.message || 'Lỗi kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden relative">
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-full transition-colors z-10"
        >
          <Settings size={20} />
        </button>

        <div className="bg-slate-800 p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-700 p-3 rounded-full">
              <Pill className="h-8 w-8 text-teal-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wider">PHARMA<span className="text-teal-400">HR</span></h2>
          <p className="text-slate-400 mt-2 text-sm">Hệ thống quản lý nhân lực Khoa Dược</p>
        </div>

        <div className="p-8">
          {/* Config Section */}
          {showConfig && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Đường dẫn Web App (Google Apps Script)</label>
              <div className="flex gap-2">
                 <div className="relative flex-1">
                    <Globe size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="text" 
                      value={webAppUrl}
                      onChange={(e) => setWebAppUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                      placeholder="https://script.google.com/..."
                    />
                 </div>
              </div>
              
              <div className="mt-2 flex justify-between items-center">
                 <button 
                   type="button"
                   onClick={handleTestConnection}
                   disabled={loading}
                   className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 font-medium"
                 >
                   {loading ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
                 </button>
                 {connectionStatus === 'success' && <span className="text-xs text-green-600 flex items-center font-bold"><CheckCircle size={12} className="mr-1"/> Kết nối OK</span>}
                 {connectionStatus === 'failed' && <span className="text-xs text-red-600 flex items-center font-bold"><AlertCircle size={12} className="mr-1"/> Lỗi</span>}
              </div>
              {statusMsg && <p className={`text-xs mt-1 ${connectionStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>{statusMsg}</p>}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">
                <p className="font-bold">Đăng nhập thất bại</p>
                <p>{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-teal-400' : 'bg-teal-600 hover:bg-teal-700'} focus:outline-none transition-colors`}
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button 
                 type="button"
                 onClick={handleDemoMode}
                 className="w-full flex items-center justify-center px-4 py-2 border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-md text-sm font-medium transition-colors"
              >
                 <PlayCircle size={18} className="mr-2" /> Dùng thử Offline (Demo)
              </button>
              <p className="mt-2 text-xs text-gray-400">Chế độ Demo sử dụng dữ liệu giả lập, không cần kết nối Server.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
