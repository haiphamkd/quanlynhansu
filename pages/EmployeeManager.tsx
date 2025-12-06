
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, User, X, Upload, FileText, CheckCircle, MapPin, Briefcase, CreditCard, Phone, Mail, Calendar, FileSpreadsheet, Download, Eye, QrCode, Key } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { AppButton } from '../components/AppButton';
import { Employee, EmployeeStatus, TempData, User as AppUser } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN, generateUsername } from '../utils/helpers';

const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dropdowns, setDropdowns] = useState<TempData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Current User
  const getCurrentUser = () => {
    try { return JSON.parse(localStorage.getItem('pharmahr_user') || '{}'); } catch { return { role: 'staff' }; }
  };
  const currentUser = getCurrentUser();

  const initialFormState: Employee = {
    id: '', fullName: '', dob: '', gender: 'Nam', position: 'Dược sĩ', qualification: '',
    phone: '', email: '', contractDate: '', joinDate: '',
    hometown: '', permanentAddress: '', idCardNumber: '', idCardDate: '', idCardPlace: 'Cục trưởng Cục CSQLHC về TTXH',
    status: EmployeeStatus.ACTIVE, avatarUrl: '', fileUrl: '', notes: ''
  };
  
  const [formData, setFormData] = useState<Employee>(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [empData, dropData] = await Promise.all([
       dataService.getEmployees(),
       dataService.getDropdowns()
    ]);
    setEmployees(empData);
    setDropdowns(dropData);
    setLoading(false);
  };

  const getNextId = () => {
     if (employees.length === 0) return "NV001";
     const ids = employees.map(e => parseInt(e.id.replace('NV', ''))).filter(n => !isNaN(n));
     const maxId = Math.max(...ids, 0);
     return `NV${String(maxId + 1).padStart(3, '0')}`;
  };

  const handleAddClick = () => {
    setEditingEmployee(null);
    setIsViewMode(false);
    setFormData({
      ...initialFormState,
      id: getNextId(),
      dob: '1990-01-01',
      joinDate: new Date().toISOString().split('T')[0],
      contractDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsViewMode(false);
    setFormData({ ...emp });
    setIsModalOpen(true);
  };

  const handleViewClick = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsViewMode(true); // Read only
    setFormData({ ...emp });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      await dataService.deleteEmployee(id);
      loadData();
    }
  };

  // --- ACCOUNT GENERATION LOGIC ---
  const handleCreateAccount = async (emp: Employee) => {
    if (!confirm(`Tạo tài khoản cho nhân viên ${emp.fullName}? \nTài khoản sẽ là: ${generateUsername(emp.fullName)}\nMật khẩu mặc định: 1`)) return;

    const newUser: AppUser = {
      username: generateUsername(emp.fullName),
      password: '1',
      name: emp.fullName,
      role: 'staff',
      employeeId: emp.id,
      mustChangePassword: true
    };

    const res = await dataService.createUser(newUser);
    if (res.success) {
      alert(`Đã tạo tài khoản thành công!\nUsername: ${newUser.username}\nPassword: 1`);
    } else {
      alert(`Lỗi: ${res.error}`);
    }
  };

  const canCreateAccount = () => {
    return currentUser.role === 'admin' || currentUser.role === 'manager';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarUrl' | 'fileUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "MaNV", "HoTen", "NgaySinh(YYYY-MM-DD)", "GioiTinh(Nam/Nu)", 
      "ChucVu", "TrinhDo", "SDT", "Email", "NgayHopDong", "NgayVaoLam", 
      "QueQuan", "ThuongTru", "CCCD", "NgayCap", "NoiCap", "TrangThai", "GhiChu"
    ];
    const csvContent = "\uFEFF" + headers.join(",") + "\n" +
      "NV099,Nguyen Van A,1990-01-01,Nam,Duoc si,Dai hoc,0909123456,email@test.com,2020-01-01,2020-01-01,Ha Noi,Ha Noi,001090xxxxx,2021-01-01,Cuc CSQLHC,Dang lam viec,Ghi chu";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Mau_Nhap_Lieu_Nhan_Vien.csv";
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const lines = text.split('\n');
      const newEmployees: Employee[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length < 5) continue;
        const newEmp: Employee = {
          id: parts[0] || getNextId(),
          fullName: parts[1] || 'Unknown',
          dob: parts[2] || '1990-01-01',
          gender: (parts[3] === 'Nam' || parts[3] === 'Nữ') ? parts[3] as 'Nam'|'Nữ' : 'Nam',
          position: parts[4] || 'Nhân viên',
          qualification: parts[5] || '',
          phone: parts[6] || '',
          email: parts[7] || '',
          contractDate: parts[8] || '',
          joinDate: parts[9] || '',
          hometown: parts[10] || '',
          permanentAddress: parts[11] || '',
          idCardNumber: parts[12] || '',
          idCardDate: parts[13] || '',
          idCardPlace: parts[14] || '',
          status: parts[15] || EmployeeStatus.ACTIVE,
          notes: parts[16] || '',
          avatarUrl: '',
          fileUrl: ''
        };
        newEmployees.push(newEmp);
      }
      if (newEmployees.length > 0) {
        setLoading(true);
        await dataService.importEmployees(newEmployees);
        loadData();
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;
    if (editingEmployee) await dataService.updateEmployee(formData);
    else await dataService.addEmployee(formData);
    setIsModalOpen(false);
    loadData();
  };

  const filteredEmployees = employees.filter(e => 
    e.fullName.toLowerCase().includes(filter.toLowerCase()) || 
    e.id.toLowerCase().includes(filter.toLowerCase())
  );

  const qualifications = dropdowns.filter(d => d.type === 'TrinhDo').map(d => d.value);
  const statuses = dropdowns.filter(d => d.type === 'TrangThai').map(d => d.value);
  const places = dropdowns.filter(d => d.type === 'NoiCap').map(d => d.value);

  const columns = [
    { header: 'Mã NV', accessor: 'id' as keyof Employee, className: 'w-24 font-mono text-gray-500' },
    { 
      header: 'Họ tên', 
      accessor: (item: Employee) => (
        <div className="flex items-center min-w-[200px]">
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover mr-3 border border-gray-200" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold mr-3 border border-teal-100 text-sm">
               {item.fullName.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-900 text-sm">{item.fullName}</div>
            <div className="text-gray-500 text-xs">{item.position}</div>
          </div>
        </div>
      ) 
    },
    { header: 'Ngày sinh', accessor: (item: Employee) => formatDateVN(item.dob) },
    { header: 'SĐT', accessor: 'phone' as keyof Employee },
    { 
      header: 'Trạng thái', 
      accessor: (item: Employee) => (
        <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full whitespace-nowrap ${
          item.status === EmployeeStatus.ACTIVE ? 'bg-green-50 text-green-700 border border-green-100' : 
          item.status === EmployeeStatus.LEAVE ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
          'bg-gray-100 text-gray-600 border border-gray-200'
        }`}>
          {item.status}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Hồ Sơ Nhân Sự</h2>
          <p className="text-sm text-gray-500">Quản lý thông tin và hồ sơ nhân viên</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <AppButton variant="secondary" size="sm" icon={Download} onClick={handleDownloadTemplate}>
             Mẫu nhập
          </AppButton>
          
          <label className="inline-flex">
            <AppButton variant="primary" size="sm" icon={FileSpreadsheet} as="span" className="cursor-pointer bg-blue-600 hover:bg-blue-700">
               Nhập file
            </AppButton>
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>

          <AppButton variant="primary" size="sm" icon={Plus} onClick={handleAddClick}>
            Thêm mới
          </AppButton>
        </div>
      </div>

      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border-none rounded-lg leading-5 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
            placeholder="Tìm kiếm nhân viên theo tên hoặc mã..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <GenericTable 
        data={filteredEmployees}
        columns={columns}
        actions={(item) => (
          <div className="flex justify-end space-x-2">
            <AppButton variant="ghost" size="sm" icon={Eye} onClick={() => handleViewClick(item)} title="Xem chi tiết" />
            <AppButton variant="ghost" size="sm" icon={Pencil} onClick={() => handleEditClick(item)} title="Sửa" />
            
            {canCreateAccount() && (
              <AppButton variant="ghost" size="sm" icon={Key} onClick={() => handleCreateAccount(item)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Tạo tài khoản" />
            )}
            
            <AppButton variant="ghost" size="sm" icon={Trash2} onClick={() => handleDeleteClick(item.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50" title="Xóa" />
          </div>
        )}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto border border-gray-100 flex flex-col">
             <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10 shrink-0">
               <div>
                 <h3 className="text-lg font-bold text-gray-800">
                   {isViewMode ? 'Chi tiết hồ sơ' : editingEmployee ? 'Cập nhật hồ sơ' : 'Thêm nhân viên mới'}
                 </h3>
                 <p className="text-xs text-gray-500">
                   {isViewMode ? 'Thông tin chi tiết và mã QR' : 'Vui lòng điền đầy đủ thông tin bên dưới'}
                 </p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                 <X size={20} />
               </button>
             </div>

             <form onSubmit={handleSubmit} className="p-6 space-y-8 flex-1 overflow-y-auto">
                {/* 1. THÔNG TIN CƠ BẢN */}
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex flex-col items-center space-y-3 w-full lg:w-auto shrink-0">
                    <div className="w-32 h-32 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center relative group overflow-hidden shadow-sm">
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                           <User className="w-10 h-10 text-gray-300 mx-auto" />
                           <span className="text-xs text-gray-400 block mt-1">Ảnh đại diện</span>
                        </div>
                      )}
                      {!isViewMode && (
                        <label className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center cursor-pointer transition-all">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatarUrl')} />
                        </label>
                      )}
                    </div>
                    <div className="text-center">
                        <label className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">{formData.id}</label>
                    </div>

                    {/* QR Code Section (Only in View/Edit Mode) */}
                    {(isViewMode || editingEmployee) && (
                      <div className="mt-4 text-center">
                         <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm inline-block">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(JSON.stringify({id: formData.id, name: formData.fullName}))}`} 
                              alt="QR Code" 
                              className="w-24 h-24"
                            />
                         </div>
                         <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-center">
                           <QrCode size={10} className="mr-1"/> Mã định danh
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-1 md:col-span-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Họ và tên <span className="text-red-500">*</span></label>
                      <input 
                        type="text" required disabled={isViewMode}
                        value={formData.fullName} 
                        onChange={e => setFormData({...formData, fullName: e.target.value})} 
                        className="mt-1 block w-full border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm shadow-sm" 
                        placeholder="Nguyễn Văn A" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày sinh</label>
                      <input 
                        type="date" required disabled={isViewMode}
                        value={formData.dob} 
                        onChange={e => setFormData({...formData, dob: e.target.value})} 
                        className="mt-1 block w-full border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Giới tính</label>
                      <select 
                        value={formData.gender} disabled={isViewMode}
                        onChange={e => setFormData({...formData, gender: e.target.value as 'Nam' | 'Nữ'})} 
                        className="mt-1 block w-full border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm shadow-sm"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Số điện thoại</label>
                      <div className="relative">
                         <Phone size={14} className="absolute left-3 top-3 text-gray-400"/>
                         <input 
                           type="text" disabled={isViewMode}
                           value={formData.phone} 
                           onChange={e => setFormData({...formData, phone: e.target.value})} 
                           className="mt-1 block w-full pl-9 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm shadow-sm" 
                           placeholder="09xxxxxxx" 
                         />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                      <div className="relative">
                         <Mail size={14} className="absolute left-3 top-3 text-gray-400"/>
                         <input 
                           type="email" disabled={isViewMode}
                           value={formData.email} 
                           onChange={e => setFormData({...formData, email: e.target.value})} 
                           className="mt-1 block w-full pl-9 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm shadow-sm" 
                           placeholder="email@example.com" 
                         />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. CÔNG VIỆC */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center border-b border-gray-100 pb-2">
                    <Briefcase size={16} className="mr-2 text-teal-500" /> Thông tin công việc
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                     <div>
                        <label className="text-xs font-medium text-gray-500">Chức vụ</label>
                        <input type="text" required disabled={isViewMode} value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-medium text-gray-500">Trình độ CM</label>
                        <select value={formData.qualification} disabled={isViewMode} onChange={e => setFormData({...formData, qualification: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm">
                           <option value="">-- Chọn --</option>
                           {qualifications.length > 0 ? qualifications.map(q => <option key={q} value={q}>{q}</option>) : <option value="Dược sĩ">Dược sĩ</option>}
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-medium text-gray-500">Trạng thái</label>
                        <select value={formData.status} disabled={isViewMode} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm">
                          {statuses.length > 0 ? statuses.map(s => <option key={s} value={s}>{s}</option>) : Object.values(EmployeeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-medium text-gray-500">Ngày hợp đồng</label>
                        <input type="date" value={formData.contractDate} disabled={isViewMode} onChange={e => setFormData({...formData, contractDate: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-medium text-gray-500">Ngày vào làm</label>
                        <input type="date" value={formData.joinDate} disabled={isViewMode} onChange={e => setFormData({...formData, joinDate: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm" />
                     </div>
                  </div>
                </div>

                {/* 3. THÔNG TIN CÁ NHÂN & GIẤY TỜ */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center border-b border-gray-100 pb-2">
                    <CreditCard size={16} className="mr-2 text-teal-500" /> Giấy tờ & Địa chỉ
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                     <div>
                        <label className="text-xs font-medium text-gray-500">Số CCCD/CMND</label>
                        <input type="text" value={formData.idCardNumber} disabled={isViewMode} onChange={e => setFormData({...formData, idCardNumber: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm" placeholder="001xxxxxxxxx" />
                     </div>
                     <div>
                        <label className="text-xs font-medium text-gray-500">Ngày cấp</label>
                        <input type="date" value={formData.idCardDate} disabled={isViewMode} onChange={e => setFormData({...formData, idCardDate: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-medium text-gray-500">Nơi cấp</label>
                        <input type="text" list="places" value={formData.idCardPlace} disabled={isViewMode} onChange={e => setFormData({...formData, idCardPlace: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm" />
                        <datalist id="places">
                           {places.map(p => <option key={p} value={p} />)}
                        </datalist>
                     </div>
                     <div className="md:col-span-2 lg:col-span-1">
                        <label className="text-xs font-medium text-gray-500">Quê quán</label>
                        <input type="text" value={formData.hometown} disabled={isViewMode} onChange={e => setFormData({...formData, hometown: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm" />
                     </div>
                     <div className="md:col-span-2 lg:col-span-2">
                        <label className="text-xs font-medium text-gray-500">Nơi thường trú</label>
                        <input type="text" value={formData.permanentAddress} disabled={isViewMode} onChange={e => setFormData({...formData, permanentAddress: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm" />
                     </div>
                  </div>
                </div>

                {/* 4. HỒ SƠ KHÁC */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center border-b border-gray-100 pb-2">
                    <FileText size={16} className="mr-2 text-teal-500" /> Hồ sơ đính kèm & Ghi chú
                  </h4>
                  <div className="grid grid-cols-1 gap-5">
                     <div>
                        <label className="text-xs font-medium text-gray-500">File hồ sơ (Scan/PDF)</label>
                        {!isViewMode ? (
                          <div className="mt-1 flex items-center space-x-3">
                             <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                <Upload size={16} className="mr-2" /> Chọn file
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'fileUrl')} />
                             </label>
                             {formData.fileUrl && <span className="text-xs text-green-600 flex items-center"><CheckCircle size={14} className="mr-1"/> Đã tải lên</span>}
                          </div>
                        ) : (
                          <div className="mt-1">
                             {formData.fileUrl ? (
                               <a href={formData.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center text-sm">
                                 <FileText size={16} className="mr-1"/> Xem hồ sơ đính kèm
                               </a>
                             ) : <span className="text-gray-400 text-sm italic">Không có hồ sơ</span>}
                          </div>
                        )}
                     </div>
                     <div>
                        <label className="text-xs font-medium text-gray-500">Ghi chú thêm</label>
                        <textarea rows={3} disabled={isViewMode} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent px-3 py-2 text-sm"></textarea>
                     </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 space-x-3 border-t border-gray-100 sticky bottom-0 bg-white p-4 -mx-6 -mb-6 mt-4">
                  <AppButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                    {isViewMode ? 'Đóng' : 'Hủy bỏ'}
                  </AppButton>
                  {!isViewMode && (
                    <AppButton type="submit" variant="primary" icon={CheckCircle}>
                      {editingEmployee ? 'Lưu thay đổi' : 'Thêm nhân viên'}
                    </AppButton>
                  )}
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;