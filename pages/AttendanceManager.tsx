
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

  const getUserRole = () => {
    try {
      const saved = localStorage.getItem('pharmahr_user');
      if (saved) return JSON.parse(saved).role || 'staff';
      return 'staff';
    } catch { return 'staff'; }
  };
  const userRole = getUserRole();

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const emps = await dataService.getEmployees();
    setEmployees(emps.filter(e => e.status === EmployeeStatus.ACTIVE));
    const initialAttendance: Attendance[] = emps.filter(e => e.status === EmployeeStatus.ACTIVE).map(emp => ({
        id: `ATT-${emp.id}-${Date.now()}`, employeeId: emp.id, employeeName: emp.fullName,
        date: selectedDate, shift: 'Cả ngày', status: 'Chưa quét', notes: ''
    })); 
    setAttendanceRecords(initialAttendance);
    setHistoryRecords(await dataService.getAttendance());
    setLoading(false);
  };

  const handleScanCheckIn = (index: number) => {
    const updated = [...attendanceRecords];
    updated[index].status = 'Đi làm'; updated[index].timeIn = getCurrentTime();
    setAttendanceRecords(updated);
  };

  const handleStatusChange = (index: number, status: any) => {
    const updated = [...attendanceRecords]; updated[index].status = status;
    setAttendanceRecords(updated);
  };

  const saveDailyAttendance = async () => {
    setLoading(true);
    const recordsToSave = attendanceRecords.filter(r => r.status !== 'Chưa quét').map(r => ({ ...r, date: selectedDate } as Attendance));
    await dataService.saveAttendance(recordsToSave);
    setHistoryRecords(await dataService.getAttendance());
    alert('Đã lưu chấm công thành công!');
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Chấm Công</h2>
           <p className="text-sm text-gray-500">Quản lý thời gian làm việc</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
           {['daily', 'history', 'qr'].map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
             >
               {tab === 'daily' && <span className="flex items-center"><Scan size={16} className="mr-2"/> Quét/Chấm ngày</span>}
               {tab === 'history' && <span className="flex items-center"><History size={16} className="mr-2"/> Lịch sử</span>}
               {tab === 'qr' && <span className="flex items-center"><QrCode size={16} className="mr-2"/> Mã QR</span>}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
             <div className="flex items-center space-x-3">
                <span className="text-gray-600 font-medium text-sm">Ngày chấm công:</span>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white shadow-sm" />
             </div>
             <button onClick={saveDailyAttendance} disabled={loading} className="h-9 px-4 bg-teal-600 text-white rounded-lg flex items-center text-sm font-medium hover:bg-teal-700 shadow-sm transition-colors">
               <Save size={16} className="mr-2" /> Lưu dữ liệu
             </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quét QR</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {attendanceRecords.map((record, idx) => (
                  <tr key={record.employeeId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{record.employeeName}</div>
                      <div className="text-xs text-gray-400">{record.employeeId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {record.timeIn ? (
                         <div className="flex items-center text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-md w-fit border border-emerald-100">
                           <Clock size={14} className="mr-1.5" /> {record.timeIn}
                         </div>
                       ) : (
                         <button onClick={() => handleScanCheckIn(idx)} className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors border border-blue-100">
                           <Scan size={14} className="mr-1.5" /> Quét thủ công
                         </button>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={record.status} onChange={(e) => handleStatusChange(idx, e.target.value)}
                        className={`block w-full text-sm border-gray-200 rounded-lg shadow-sm py-1.5 pl-2 pr-8 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                           record.status === 'Đi làm' ? 'text-emerald-700 font-medium bg-emerald-50' : 
                           record.status === 'Chưa quét' ? 'text-gray-400 bg-gray-50' : 'text-rose-700 font-medium bg-rose-50'
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
                      <input type="text" value={record.notes || ''} onChange={(e) => { const updated = [...attendanceRecords]; updated[idx].notes = e.target.value; setAttendanceRecords(updated); }} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-shadow" placeholder="Nhập ghi chú..." />
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
             <div className="bg-amber-50 p-3 border-b border-amber-100 flex items-center text-sm text-amber-800">
               <Lock size={16} className="mr-2" /> Chỉ xem (Quyền hạn chế)
             </div>
          )}
          <GenericTable<Attendance>
            data={historyRecords}
            columns={[
              { header: 'Ngày', accessor: (item) => formatDateVN(item.date) },
              { header: 'Nhân viên', accessor: 'employeeName' },
              { header: 'Giờ vào', accessor: (item) => item.timeIn || '--:--' },
              { header: 'Trạng thái', accessor: (item) => <span className={`px-2 py-1 text-xs rounded-full font-medium ${item.status === 'Đi làm' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>{item.status}</span> },
              { header: 'Ghi chú', accessor: 'notes' },
            ]}
          />
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <h3 className="text-lg font-bold mb-4 text-gray-800">Mã QR Nhân viên</h3>
                 <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {employees.map(emp => (
                       <div key={emp.id} onClick={() => setQrEmployee(emp)} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${qrEmployee?.id === emp.id ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'hover:bg-gray-50 border-gray-200'}`}>
                          <div><p className="font-semibold text-gray-800 text-sm">{emp.fullName}</p><p className="text-xs text-gray-500">{emp.id}</p></div>
                          <QrCode size={18} className="text-gray-400" />
                       </div>
                    ))}
                 </div>
              </div>
              <div className="flex flex-col items-center justify-center border-l border-gray-100 pl-4">
                 {qrEmployee ? (
                    <div className="text-center p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
                       <h4 className="font-bold text-lg text-gray-900 mb-1">{qrEmployee.fullName}</h4>
                       <p className="text-gray-500 text-sm mb-6">{qrEmployee.position}</p>
                       <div className="bg-white p-2 inline-block border border-gray-200 rounded-xl shadow-inner">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({id: qrEmployee.id, name: qrEmployee.fullName}))}`} alt="QR" className="w-48 h-48 rounded-lg" />
                       </div>
                    </div>
                 ) : (
                    <div className="text-center text-gray-400">
                       <QrCode size={64} className="mx-auto mb-4 opacity-20" />
                       <p className="text-sm">Chọn nhân viên để xem mã</p>
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
