

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Pencil, Trash2, Key, Search, User, CheckCircle, RotateCcw, X, Shield, Lock, AlertTriangle, Building } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { AppButton } from '../components/AppButton';
import { User as AppUser, Employee, UserRole, DEPARTMENTS, Category } from '../types';
import { dataService } from '../services/dataService';
import { generateUsername } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

// Define type for table items which extends AppUser and adds 'id' required by GenericTable
type UserTableItem = AppUser & { id: string };

const AccountManager: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState<AppUser>({
      username: '', password: '1', name: '', role: 'staff', department: '', employeeId: ''
  });
  
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('pharmahr_user') || '{}');
  
  useEffect(() => {
    if (!['admin', 'operator'].includes(currentUser.role)) {
        alert("Bạn không có quyền truy cập trang này");
        navigate('/');
        return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [userData, empData, catData] = await Promise.all([
            dataService.getUsers(),
            dataService.getEmployees('All'),
            dataService.getCategories()
        ]);
        setUsers(userData);
        setEmployees(empData);
        setCategories(catData);
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
    } finally {
        setLoading(false);
    }
  };

  // Combine hardcoded DEPARTMENTS with dynamic 'KhoaPhong' categories
  const dynamicDepts = categories.filter(c => c.type === 'KhoaPhong').map(c => c.value);
  const departmentList = Array.from(new Set([...DEPARTMENTS, ...dynamicDepts]));

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '1', name: '', role: 'staff', department: '', employeeId: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (user: AppUser) => {
    // Operator restrictions
    if (currentUser.role === 'operator' && user.role === 'admin') {
        alert("Người điều hành không được phép chỉnh sửa tài khoản Admin.");
        return;
    }

    setEditingUser(user);
    setFormData({ ...user, password: '' }); // Don't show password
    setIsModalOpen(true);
  };

  const handleDelete = async (user: AppUser) => {
    if (currentUser.role === 'operator' && user.role === 'admin') {
        alert("Người điều hành không được phép xóa tài khoản Admin.");
        return;
    }
    if (user.username === currentUser.username) {
        alert("Bạn không thể tự xóa tài khoản của mình.");
        return;
    }
    
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản '${user.username}'?`)) {
        const res = await dataService.deleteUser(user.username);
        if (res.success) {
            loadData();
        } else {
            alert("Lỗi: " + res.error);
        }
    }
  };

  const handleResetPassword = async (user: AppUser) => {
     if (currentUser.role === 'operator' && user.role === 'admin') {
        alert("Người điều hành không được phép reset mật khẩu Admin.");
        return;
    }

    if (confirm(`Reset mật khẩu cho '${user.username}' về mặc định là '1'?`)) {
        const res = await dataService.adminResetPassword(user.username);
        if (res.success) alert("Đã reset mật khẩu thành công!");
        else alert("Lỗi: " + res.error);
    }
  };

  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const empId = e.target.value;
      if (!empId) return;
      
      const emp = employees.find(ep => ep.id === empId);
      if (emp) {
          setFormData({
              ...formData,
              employeeId: emp.id,
              name: emp.fullName,
              department: emp.department || '', // Auto-fill department
              username: generateUsername(emp.fullName)
          });
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.role === 'manager' && !formData.department) {
        alert("Tài khoản Trưởng khoa (Manager) bắt buộc phải thuộc một Khoa/Phòng cụ thể để quản lý.");
        return;
    }

    try {
        if (editingUser) {
            await dataService.updateUser(formData);
        } else {
            // Check if username exists locally first
            if (users.some(u => u.username === formData.username)) {
                alert("Tên đăng nhập đã tồn tại!");
                return;
            }
            await dataService.createUser(formData);
        }
        setIsModalOpen(false);
        loadData();
    } catch (error: any) {
        alert("Lỗi: " + error.message);
    }
  };

  const filteredUsers = users.filter(u => 
      u.username.toLowerCase().includes(filter.toLowerCase()) || 
      u.name.toLowerCase().includes(filter.toLowerCase())
  );

  // GenericTable requires items to have an 'id' property
  const tableData: UserTableItem[] = filteredUsers.map(u => ({ ...u, id: u.username }));

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center">
             <ShieldAlert className="mr-3 text-teal-600" size={28} /> Quản lý Hệ thống & Tài khoản
          </h2>
          <p className="text-sm text-gray-500 mt-1">Phân quyền truy cập và quản trị người dùng</p>
        </div>
        <AppButton variant="primary" size="md" icon={Plus} onClick={handleAdd}>
            Cấp tài khoản mới
        </AppButton>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all sm:text-sm"
            placeholder="Tìm kiếm tài khoản..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <GenericTable<UserTableItem>
         data={tableData}
         columns={[
             { header: 'Username', accessor: 'username', className: 'font-mono font-bold text-teal-700' },
             { header: 'Họ tên', accessor: (item) => (
                 <div className="flex items-center">
                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold mr-2 text-gray-600">
                         {item.name.charAt(0)}
                     </div>
                     {item.name}
                 </div>
             )},
             { header: 'Vai trò', accessor: (item) => {
                 let color = 'bg-gray-100 text-gray-600';
                 let label: string = item.role;
                 if (item.role === 'admin') { color = 'bg-red-100 text-red-700 border-red-200'; label = 'Quản trị viên'; }
                 else if (item.role === 'operator') { color = 'bg-purple-100 text-purple-700 border-purple-200'; label = 'Người điều hành'; }
                 else if (item.role === 'manager') { color = 'bg-blue-100 text-blue-700 border-blue-200'; label = 'Trưởng khoa'; }
                 else { label = 'Nhân viên'; }

                 return (
                     <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${color} uppercase tracking-wide`}>
                         {label}
                     </span>
                 );
             }},
             { header: 'Khoa Phòng', accessor: 'department', className: 'text-sm' },
             { header: 'Liên kết NV', accessor: (item) => item.employeeId ? <span className="font-mono text-xs text-gray-500">{item.employeeId}</span> : <span className="text-gray-400 text-xs italic">Chưa liên kết</span>}
         ]}
         actions={(item) => (
            <div className="flex justify-end space-x-1">
                <button 
                  onClick={() => handleResetPassword(item)} 
                  className={`p-1.5 rounded-md transition-colors ${currentUser.role === 'operator' && item.role === 'admin' ? 'text-gray-300 cursor-not-allowed' : 'text-orange-500 hover:bg-orange-50'}`}
                  title="Reset mật khẩu"
                  disabled={currentUser.role === 'operator' && item.role === 'admin'}
                >
                    <RotateCcw size={16} />
                </button>
                <button 
                  onClick={() => handleEdit(item)} 
                  className={`p-1.5 rounded-md transition-colors ${currentUser.role === 'operator' && item.role === 'admin' ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-50'}`}
                  title="Chỉnh sửa"
                  disabled={currentUser.role === 'operator' && item.role === 'admin'}
                >
                    <Pencil size={16} />
                </button>
                <button 
                   onClick={() => handleDelete(item)} 
                   className={`p-1.5 rounded-md transition-colors ${currentUser.role === 'operator' && item.role === 'admin' ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                   title="Xóa"
                   disabled={currentUser.role === 'operator' && item.role === 'admin'}
                >
                    <Trash2 size={16} />
                </button>
            </div>
         )}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center">
                     {editingUser ? <Pencil size={18} className="mr-2 text-blue-600"/> : <Plus size={18} className="mr-2 text-teal-600"/>}
                     {editingUser ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {!editingUser && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                          <label className="block text-xs font-bold text-blue-800 mb-1 uppercase">Liên kết nhân viên (Tùy chọn)</label>
                          <select 
                            className="block w-full border-blue-200 rounded px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-400"
                            onChange={handleEmployeeSelect}
                            value={formData.employeeId || ''}
                          >
                             <option value="">-- Chọn nhân viên để tự điền --</option>
                             {employees.filter(e => !users.some(u => u.employeeId === e.id)).map(e => (
                                 <option key={e.id} value={e.id}>{e.id} - {e.fullName}</option>
                             ))}
                          </select>
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tên đăng nhập <span className="text-red-500">*</span></label>
                        <input 
                           type="text" required
                           disabled={!!editingUser}
                           value={formData.username}
                           onChange={e => setFormData({...formData, username: e.target.value})}
                           className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Họ và tên <span className="text-red-500">*</span></label>
                        <input 
                           type="text" required
                           value={formData.name}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                           className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                        />
                     </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Vai trò (Phân quyền) <span className="text-red-500">*</span></label>
                      <select 
                         value={formData.role}
                         onChange={e => setFormData({...formData, role: e.target.value as any})}
                         className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                         <option value="staff">Nhân viên (Staff) - Xem cá nhân</option>
                         <option value="manager">Trưởng khoa (Manager) - Quản lý Khoa</option>
                         <option value="operator">Người điều hành (Operator) - Quản lý chung</option>
                         {currentUser.role === 'admin' && <option value="admin">Quản trị viên (Admin) - Toàn quyền</option>}
                      </select>
                      {formData.role === 'operator' && (
                          <div className="mt-2 text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-100 flex items-start">
                             <Shield size={14} className="mr-1.5 mt-0.5 shrink-0"/>
                             Operator có quyền quản lý hệ thống tương đương Admin nhưng không thể xóa/sửa tài khoản Admin khác.
                          </div>
                      )}
                  </div>
                  
                  <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Khoa / Phòng {formData.role === 'manager' && <span className="text-red-500">*</span>}
                      </label>
                      <select
                         value={formData.department || ''}
                         onChange={e => setFormData({...formData, department: e.target.value})}
                         className={`block w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 bg-white ${formData.role === 'manager' && !formData.department ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-300'}`}
                      >
                         <option value="">-- Chọn Khoa/Phòng --</option>
                         {departmentList.map(d => (
                             <option key={d} value={d}>{d}</option>
                         ))}
                      </select>
                      {formData.role === 'manager' && (
                          <p className="text-[10px] text-gray-500 mt-1 flex items-center">
                              <Building size={10} className="mr-1"/>
                              Trưởng khoa sẽ quản lý dữ liệu của khoa được chọn này.
                          </p>
                      )}
                  </div>
                  
                  {!editingUser && (
                     <div className="pt-2">
                         <div className="flex items-center text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                            <Key size={14} className="mr-2"/> Mật khẩu mặc định khi tạo mới là <span className="font-bold mx-1">1</span>
                         </div>
                     </div>
                  )}

                  <div className="pt-4 border-t flex justify-end space-x-3">
                     <AppButton variant="secondary" icon={X} onClick={() => setIsModalOpen(false)}>Hủy</AppButton>
                     <AppButton variant="primary" type="submit" icon={CheckCircle}>{editingUser ? 'Cập nhật' : 'Tạo tài khoản'}</AppButton>
                  </div>
               </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
