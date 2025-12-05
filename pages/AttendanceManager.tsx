
import React, { useState, useEffect } from 'react';
import { Calendar, Save, History, QrCode, Scan, Clock, Lock } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { Attendance, Employee, EmployeeStatus } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN, getCurrentTime } from '../utils/helpers';

const AttendanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'qr'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [historyRecords, setHistoryRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrEmployee, setQrEmployee] = useState<Employee | null>(null);

  // Safe User Role Retrieval
  const getUserRole = () => {
    try {
      const saved = localStorage.getItem('pharmahr_user');
      if (saved) {
        const user = JSON.parse(saved);
        return user.role || 'staff';
      }
      return 'staff';
    } catch (e) {
      return 'staff';
    }
  };

  const userRole = getUserRole();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const emps = await dataService.getEmployees();
    setEmployees(emps.filter(e => e.status === EmployeeStatus.ACTIVE));
    
    // Auto populate for today if needed
    const initialAttendance: Attendance[] = emps
      .filter(e => e.status === EmployeeStatus.ACTIVE)
      .map(emp => ({
        id: `ATT-${emp.id}-${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        date: selectedDate,
        shift: 'Cả ngày',
        status: 'Chưa quét',
        notes: ''
      })); 
      
    setAttendanceRecords(initialAttendance);
    const hist = await dataService.getAttendance();
    setHistoryRecords(hist);
    setLoading(false);
  };

  const handleScanCheckIn = (index: number) => {
    const updated = [...attendanceRecords];
    updated[index].status = 'Đi làm';
    updated[index].timeIn = getCurrentTime();
    setAttendanceRecords(updated);
  };

  const handleStatusChange = (index: number, status: any) => {
    const updated = [...attendanceRecords];
    updated[index].status = status;
    setAttendanceRecords(updated);
  };

  const saveDailyAttendance = async () => {
    setLoading(true);
    const recordsToSave = attendanceRecords
      .filter(r => r.status !== 'Chưa quét') // Only save checked items
      .map(r => ({ ...r, date: selectedDate } as Attendance));
      
    await dataService.saveAttendance(recordsToSave);
    const hist = await dataService.getAttendance();
    setHistoryRecords(hist);
    alert('Đã lưu chấm công thành công!');
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Calendar className="mr-2" /> Chấm Công
        </h2>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
           <button 
             onClick={() => setActiveTab('daily')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${activeTab === 'daily' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
           >
             <Scan size={16} className="mr-2" /> Quét/Chấm ngày
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${activeTab === 'history' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
           >
             <History size={16} className="mr-2" /> Lịch sử
           </button>
           <button 
             onClick={() => setActiveTab('qr')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${activeTab === 'qr' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
           >
             <QrCode size={16} className="mr-2" /> Mã QR NV
           </button>
        </div>
      </div>

      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
             <div className="flex items-center space-x-3">
                <span className="text-gray-600 font-medium text-sm">Ngày chấm công:</span>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                />
             </div>
             <button 
               onClick={saveDailyAttendance}
               disabled={loading}
               className="h-9 px-4 bg-teal-600 text-white rounded-md flex items-center text-sm font-medium hover:bg-teal-700 shadow-sm"
             >
               <Save size={16} className="mr-2" /> Lưu dữ liệu
             </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhân viên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quét QR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record, idx) => (
                  <tr key={record.employeeId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{record.employeeName}</div>
                      <div className="text-xs text-gray-500">{record.employeeId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {record.timeIn ? (
                         <div className="flex items-center text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full w-fit">
                           <Clock size={14} className="mr-1" /> {record.timeIn}
                         </div>
                       ) : (
                         <button 
                           onClick={() => handleScanCheckIn(idx)}
                           className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                         >
                           <Scan size={14} className="mr-1" /> Quét thủ công
                         </button>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={record.status}
                        onChange={(e) => handleStatusChange(idx, e.target.value)}
                        className={`block w-full text-sm border-gray-300 rounded-md shadow-sm py-1.5 pl-2 pr-8 ${
                           record.status === 'Đi làm' ? 'text-green-700 font-medium bg-green-50 border-green-200' : 
                           record.status === 'Chưa quét' ? 'text-gray-400 bg-gray-50' : 'text-red-700 font-medium bg-red-50 border-red-200'
                        }`}
                      >
                         <option value="Chưa quét">-- Chọn --</option>
                         <option value="Đi làm">Đi làm</option>
                         <option value="Nghỉ phép">Nghỉ phép</option>
                         <option value="Nghỉ bệnh">Nghỉ bệnh</option>
                         <option value="Trễ">Trễ</option>
                         <option value="Khác">Khác</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="text" 
                        value={record.notes || ''}
                        onChange={(e) => {
                          const updated = [...attendanceRecords];
                          updated[idx].notes = e.target.value;
                          setAttendanceRecords(updated);
                        }}
                        className="border border-gray-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-teal-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {userRole !== 'admin' && (
             <div className="bg-yellow-50 p-3 border-b border-yellow-100 flex items-center text-sm text-yellow-800">
               <Lock size={16} className="mr-2" />
               Bạn đang xem với quyền Nhân viên. Chỉ Admin mới có quyền chỉnh sửa lịch sử chấm công.
             </div>
          )}
          <GenericTable<Attendance>
            data={historyRecords}
            columns={[
              { header: 'Ngày', accessor: (item) => formatDateVN(item.date) },
              { header: 'Nhân viên', accessor: 'employeeName' },
              { header: 'Giờ vào', accessor: (item) => item.timeIn || '--:--' },
              { 
                header: 'Trạng thái', 
                accessor: (item) => (
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    item.status === 'Đi làm' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                ) 
              },
              { header: 'Ghi chú', accessor: 'notes' },
            ]}
          />
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách mã QR nhân viên</h3>
                 <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                    {employees.map(emp => (
                       <div 
                         key={emp.id}
                         onClick={() => setQrEmployee(emp)}
                         className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${qrEmployee?.id === emp.id ? 'bg-teal-50 border-teal-500' : 'hover:bg-gray-50 border-gray-200'}`}
                       >
                          <div>
                             <p className="font-semibold text-gray-800">{emp.fullName}</p>
                             <p className="text-xs text-gray-500">{emp.id} - {emp.position}</p>
                          </div>
                          <QrCode size={20} className="text-gray-400" />
                       </div>
                    ))}
                 </div>
              </div>

              <div className="flex flex-col items-center justify-center border-l border-gray-100 pl-4">
                 {qrEmployee ? (
                    <div className="text-center p-6 bg-white shadow-lg rounded-xl border border-gray-100">
                       <h4 className="font-bold text-xl text-gray-900 mb-1">{qrEmployee.fullName}</h4>
                       <p className="text-gray-500 text-sm mb-4">{qrEmployee.position}</p>
                       <div className="bg-white p-2 inline-block border-4 border-gray-800 rounded-lg">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({id: qrEmployee.id, name: qrEmployee.fullName, phone: qrEmployee.phone}))}`} 
                            alt="QR Code" 
                            className="w-48 h-48"
                          />
                       </div>
                       <p className="mt-4 text-xs text-gray-400 uppercase tracking-wide">Quét để chấm công</p>
                    </div>
                 ) : (
                    <div className="text-center text-gray-400">
                       <QrCode size={64} className="mx-auto mb-4 opacity-20" />
                       <p>Chọn nhân viên để xem mã QR</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;
