import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, User, X, Upload, FileText, CheckCircle, Briefcase, CreditCard, Phone, Mail, FileSpreadsheet, Download, Save, AlertCircle, Key } from 'lucide-react';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import GenericTable from '../components/GenericTable';
import { Employee, EmployeeStatus } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN, generateUsername } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';

const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const { hasRole } = useAuth(); // Dùng hook này để check quyền hiển thị nút

  const initialFormState: Employee = {
    id: '', fullName: '', dob: '', gender: 'Nam', position: 'Dược sĩ', qualification: '',
    phone: '', email: '', contractDate: '', joinDate: '',
    hometown: '', permanentAddress: '', idCardNumber: '', idCardDate: '', idCardPlace: 'Cục trưởng Cục CSQLHC về TTXH',
    status: EmployeeStatus.ACTIVE, avatarUrl: '', fileUrl: '', notes: ''
  };
  
  const [formData, setFormData] = useState<Employee>(initialFormState);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await dataService.getEmployees();
    setEmployees(data);
    setLoading(false);
  };

  // --- LOGIC TẠO TÀI KHOẢN ---
  const handleCreateAccount = async (emp: Employee) => {
    if (!confirm(`Bạn có chắc muốn tạo tài khoản cho ${emp.fullName}?`)) return;
    
    // Tự động sinh Username
    const username = generateUsername(emp.fullName);
    const password = '1'; // Mật khẩu mặc định
    
    const res = await dataService.createAccount({
      username,
      password,
      role: 'user', // Mặc định role User
      name: emp.fullName,
      employeeId: emp.id
    });

    if (res.success) {
      alert(`Đã tạo tài khoản thành công!\nTên đăng nhập: ${username}\nMật khẩu: ${password}`);
    } else {
      alert("Lỗi khi tạo tài khoản: " + res.error);
    }
  };

  const columns = [
    { header: 'Mã NV', accessor: 'id', className: 'w-24 font-mono text-gray-500 hidden sm:table-cell' },
    { 
      header: 'Họ tên', 
      accessor: (item: any) => (
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold mr-3 text-sm shrink-0">
             {item.fullName.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{item.fullName}</div>
            <div className="text-gray-500 text-xs">{item.position}</div>
          </div>
        </div>
      ) 
    },
    { header: 'SĐT', accessor: 'phone', className: 'hidden md:table-cell' },
    { 
      header: 'Trạng thái', 
      accessor: (item: any) => (
        <span className={`px-2 py-0.5 text-xs rounded-full ${item.status === 'Đang làm việc' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
          {item.status}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Nhân sự</h2>
          <p className="text-sm text-gray-500">Quản lý hồ sơ và tài khoản nhân viên</p>
        </div>
        <AppButton icon={<Plus size={16}/>} onClick={() => { setEditingEmployee(null); setFormData(initialFormState); setIsModalOpen(true); }}>
          Thêm nhân viên
        </AppButton>
      </div>

      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center">
        <Search className="h-4 w-4 text-gray-400 mr-2" />
        <input 
          type="text" 
          placeholder="Tìm kiếm..." 
          className="w-full text-sm outline-none text-gray-700"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      <GenericTable 
        data={employees.filter(e => e.fullName.toLowerCase().includes(filter.toLowerCase()))}
        columns={columns}
        actions={(item) => (
          <div className="flex justify-end gap-2">
            {/* NÚT TẠO TÀI KHOẢN - Chỉ hiện với Admin/Manager */}
            {hasRole(['admin', 'manager']) && (
               <AppButton 
                 size="sm" 
                 variant="secondary" 
                 icon={<Key size={14}/>} 
                 title="Cấp tài khoản đăng nhập"
                 onClick={() => handleCreateAccount(item)} 
               />
            )}
            <AppButton size="sm" variant="outline" icon={<Pencil size={14}/>} onClick={() => { setEditingEmployee(item); setFormData(item); setIsModalOpen(true); }} />
          </div>
        )}
      />
      
      {/* Modal - Copy lại phần Modal từ lần trước nhưng dùng AppInput */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
               <div className="p-6">
                  <div className="flex justify-between mb-4">
                     <h3 className="text-lg font-bold">{editingEmployee ? 'Sửa' : 'Thêm'}</h3>
                     <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <AppInput label="Họ tên" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                     <AppInput label="Chức vụ" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
                     <AppInput label="SĐT" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                     {/* Thêm các field khác... */}
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                     <AppButton variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</AppButton>
                     <AppButton onClick={() => { /* Submit logic */ setIsModalOpen(false); }}>Lưu</AppButton>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default EmployeeManager;