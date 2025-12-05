
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, User, Filter, X, Upload, FileText, CheckCircle } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { Employee, EmployeeStatus, TempData } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN } from '../utils/helpers';

const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dropdowns, setDropdowns] = useState<TempData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
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
    setFormData({
      ...initialFormState,
      id: getNextId(), // Auto-increment ID
      dob: '1990-01-01',
      joinDate: new Date().toISOString().split('T')[0],
      contractDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({ ...emp });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      await dataService.deleteEmployee(id);
      loadData();
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      await dataService.updateEmployee(formData);
    } else {
      await dataService.addEmployee(formData);
    }
    setIsModalOpen(false);
    loadData();
  };

  const filteredEmployees = employees.filter(e => 
    e.fullName.toLowerCase().includes(filter.toLowerCase()) || 
    e.id.toLowerCase().includes(filter.toLowerCase())
  );

  // Extract dynamic options
  const qualifications = dropdowns.filter(d => d.type === 'TrinhDo').map(d => d.value);
  const statuses = dropdowns.filter(d => d.type === 'TrangThai').map(d => d.value);
  const places = dropdowns.filter(d => d.type === 'NoiCap').map(d => d.value);

  const columns = [
    { header: 'Mã NV', accessor: 'id' as keyof Employee, className: 'w-20 font-medium' },
    { 
      header: 'Họ tên', 
      accessor: (item: Employee) => (
        <div className="flex items-center">
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover mr-3 border border-gray-200" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold mr-3 border border-teal-200">
               {item.fullName.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-900">{item.fullName}</div>
            <div className="text-gray-500 text-xs">{item.position}</div>
          </div>
        </div>
      ) 
    },
    { header: 'Ngày sinh', accessor: (item: Employee) => formatDateVN(item.dob) },
    { header: 'SĐT', accessor: 'phone' as keyof Employee },
    { header: 'Hợp đồng', accessor: (item: Employee) => formatDateVN(item.contractDate) },
    { 
      header: 'Trạng thái', 
      accessor: (item: Employee) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          item.status === EmployeeStatus.ACTIVE ? 'bg-green-100 text-green-800' : 
          item.status === EmployeeStatus.LEAVE ? 'bg-yellow-100 text-yellow-800' : 
          'bg-gray-100 text-gray-800'
        }`}>
          {item.status}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <User className="mr-2" /> Hồ Sơ Nhân Sự
        </h2>
        <button 
          onClick={handleAddClick}
          className="h-10 bg-teal-600 text-white px-4 rounded-lg flex items-center justify-center hover:bg-teal-700 transition-colors shadow-sm font-medium text-sm"
        >
          <Plus size={18} className="mr-2" /> Thêm nhân viên
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block h-10 w-full pl-10 pr-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            placeholder="Tìm kiếm theo tên hoặc mã nhân viên..."
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
            <button onClick={() => handleEditClick(item)} className="h-8 w-8 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
              <Pencil size={16} />
            </button>
            <button onClick={() => handleDeleteClick(item.id)} className="h-8 w-8 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      {/* Full Screen Modal for Employee Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
             <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
               <h3 className="text-xl font-bold text-gray-800">
                 {editingEmployee ? 'Cập nhật hồ sơ' : 'Thêm nhân viên mới'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                 <X size={24} className="text-gray-500" />
               </button>
             </div>

             <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Avatar & Basic Info */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden relative group">
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-16 h-16 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      )}
                      <label className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white font-medium text-xs">
                        <Upload size={16} className="mr-1" /> Đổi ảnh
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatarUrl')} />
                      </label>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Mã nhân viên</label>
                      <input type="text" required value={formData.id} readOnly className="mt-1 block w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border bg-gray-50" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Họ và tên</label>
                      <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Ngày sinh</label>
                      <input type="date" required value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Giới tính</label>
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as 'Nam' | 'Nữ'})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border">
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-200 my-4"></div>

                {/* Detailed Info */}
                <h4 className="font-semibold text-gray-700 flex items-center"><FileText size={18} className="mr-2" /> Thông tin công việc</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                      <label className="text-sm font-medium text-gray-700">Chức vụ</label>
                      <input type="text" required value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border" />
                   </div>
                   <div>
                      <label className="text-sm font-medium text-gray-700">Trình độ CM</label>
                      <select value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border">
                         <option value="">-- Chọn --</option>
                         {qualifications.length > 0 ? qualifications.map(q => <option key={q} value={q}>{q}</option>) : <option value="Dược sĩ">Dược sĩ</option>}
                      </select>
                   </div>
                   <div>
                      <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border">
                        {statuses.length > 0 ? statuses.map(s => <option key={s} value={s}>{s}</option>) : Object.values(EmployeeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                </div>

                {/* Personal Info */}
                <h4 className="font-semibold text-gray-700 flex items-center mt-4"><User size={18} className="mr-2" /> Thông tin cá nhân</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                      <label className="text-sm font-medium text-gray-700">CCCD/CMND</label>
                      <input type="text" value={formData.idCardNumber} onChange={e => setFormData({...formData, idCardNumber: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border" />
                   </div>
                   <div>
                      <label className="text-sm font-medium text-gray-700">Ngày cấp</label>
                      <input type="date" value={formData.idCardDate} onChange={e => setFormData({...formData, idCardDate: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border" />
                   </div>
                   <div>
                      <label className="text-sm font-medium text-gray-700">Nơi cấp</label>
                      <select value={formData.idCardPlace} onChange={e => setFormData({...formData, idCardPlace: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border">
                         {places.length > 0 ? places.map(p => <option key={p} value={p}>{p}</option>) : <option value="Cục trưởng Cục CSQLHC về TTXH">Cục trưởng Cục CSQLHC về TTXH</option>}
                      </select>
                   </div>
                </div>

                <div className="flex justify-end pt-6 space-x-3 border-t">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 px-6 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center">
                    <X size={18} className="mr-2"/> Hủy bỏ
                  </button>
                  <button type="submit" className="h-10 px-6 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 shadow-sm flex items-center">
                    <CheckCircle size={18} className="mr-2" />
                    {editingEmployee ? 'Lưu thay đổi' : 'Thêm nhân viên'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;
