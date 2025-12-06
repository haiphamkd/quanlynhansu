
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Save, History, QrCode, Scan, Clock, Lock, Sun, Moon, Search, Check, X, CheckCircle, Camera, CameraOff, Trash2 } from 'lucide-react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { Attendance, Employee, EmployeeStatus } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN, getCurrentTime } from '../utils/helpers';
import { AppButton } from '../components/AppButton';
import GenericTable from '../components/GenericTable';

// A type combining Employee and their shift records for the day
type DailyAttendanceRecord = {
  employee: Employee;
  morning: Attendance;
  afternoon: Attendance;
}

interface PendingCheckIn {
    employee: Employee;
    time: string;
    shift: 'Sáng' | 'Chiều';
    status: 'Đi làm' | 'Trễ' | 'Khác';
    notes?: string;
}

const AttendanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'qr'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyRecords, setDailyRecords] = useState<DailyAttendanceRecord[]>([]);
  const [historyRecords, setHistoryRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrEmployee, setQrEmployee] = useState<Employee | null>(null);

  // QR Scanning State
  const [scanInput, setScanInput] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [pendingScan, setPendingScan] = useState<PendingCheckIn | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const getUser = () => {
    try {
      const saved = localStorage.getItem('pharmahr_user');
      return saved ? JSON.parse(saved) : { role: 'staff', department: 'Khoa Dược' };
    } catch { return { role: 'staff', department: 'Khoa Dược' }; }
  };
  const currentUser = getUser();

  const loadAndPrepareDailyData = useCallback(async () => {
    setLoading(true);
    try {
      const deptFilter = currentUser.role === 'admin' ? 'All' : currentUser.department;
      
      const [allEmployees, allAttendance] = await Promise.all([
        dataService.getEmployees(deptFilter),
        dataService.getAttendance(deptFilter)
      ]);
      
      const activeEmployees = allEmployees.filter(e => e.status === EmployeeStatus.ACTIVE);
      const attendanceForDate = allAttendance.filter(a => a.date === selectedDate);
      
      const preparedData: DailyAttendanceRecord[] = activeEmployees.map(emp => {
        const morningRecord = attendanceForDate.find(a => a.employeeId === emp.id && a.shift === 'Sáng');
        const afternoonRecord = attendanceForDate.find(a => a.employeeId === emp.id && a.shift === 'Chiều');
        
        return {
          employee: emp,
          morning: morningRecord || {
            id: `${emp.id}-${selectedDate}-Sáng`, employeeId: emp.id, employeeName: emp.fullName, department: emp.department,
            date: selectedDate, shift: 'Sáng', status: 'Chưa quét',
          },
          afternoon: afternoonRecord || {
            id: `${emp.id}-${selectedDate}-Chiều`, employeeId: emp.id, employeeName: emp.fullName, department: emp.department,
            date: selectedDate, shift: 'Chiều', status: 'Chưa quét',
          }
        };
      });
      
      setDailyRecords(preparedData);
      setQrEmployee(activeEmployees[0] || null); // Set initial QR
      
    } catch (error) {
      console.error("Error preparing daily data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, currentUser.role, currentUser.department]);
  
  const loadHistory = useCallback(async () => {
    const deptFilter = currentUser.role === 'admin' ? 'All' : currentUser.department;
    setHistoryRecords(await dataService.getAttendance(deptFilter));
  }, [currentUser.role, currentUser.department]);

  // Load data for the selected date
  useEffect(() => {
    loadAndPrepareDailyData();
  }, [selectedDate, loadAndPrepareDailyData]);
  
  // Load history data when tab changes to history
  useEffect(() => {
    if (activeTab === 'history') {
        loadHistory();
    }
  }, [activeTab, loadHistory]);

  // Focus scanner input when tab changes to QR (if not using camera)
  useEffect(() => {
      if (activeTab === 'qr' && !showCamera) {
          setTimeout(() => scanInputRef.current?.focus(), 100);
      }
  }, [activeTab, showCamera]);

  // Initialize Camera Scanner
  useEffect(() => {
    if (showCamera && activeTab === 'qr') {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );
        
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;

        return () => {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }
  }, [showCamera, activeTab]);

  const onScanSuccess = (decodedText: string, decodedResult: any) => {
      // Handle successful scan
      processQrData(decodedText);
      // Optional: Stop scanning after success
      // setShowCamera(false); 
  };

  const onScanFailure = (error: any) => {
      // console.warn(`Code scan error = ${error}`);
  };

  const handleRecordUpdate = (employeeId: string, shift: 'Sáng' | 'Chiều', updates: Partial<Attendance>) => {
    setDailyRecords(prevRecords => 
      prevRecords.map(rec => {
        if (rec.employee.id === employeeId) {
          const key = shift === 'Sáng' ? 'morning' : 'afternoon';
          return {
            ...rec,
            [key]: { ...rec[key], ...updates }
          };
        }
        return rec;
      })
    );
  };
  
  const handleDeleteDailyRecord = async (employeeId: string, shift: 'Sáng' | 'Chiều') => {
      if (!confirm(`Bạn có chắc muốn xóa chấm công ${shift} của nhân viên này?`)) return;

      // 1. Delete from DB (in case it was already saved)
      await dataService.deleteAttendance(employeeId, selectedDate, shift);
      
      // 2. Update Local State (Reset to empty) without reloading whole table
      // This preserves other unsaved changes on the screen
      setDailyRecords(prev => prev.map(rec => {
          if (rec.employee.id === employeeId) {
              const key = shift === 'Sáng' ? 'morning' : 'afternoon';
              const emptyRecord: Attendance = {
                  id: `${employeeId}-${selectedDate}-${shift}`, 
                  employeeId: employeeId, 
                  employeeName: rec.employee.fullName, 
                  department: rec.employee.department,
                  date: selectedDate, 
                  shift: shift, 
                  status: 'Chưa quét'
              };
              return {
                  ...rec,
                  [key]: emptyRecord
              };
          }
          return rec;
      }));
  };

  const handleDeleteHistory = async (item: Attendance) => {
      if (!confirm(`Xóa chấm công của ${item.employeeName} vào ${item.date} (${item.shift})?`)) return;
      
      const success = await dataService.deleteAttendance(item.employeeId, item.date, item.shift);
      if (success) {
          loadHistory(); // Reload history table
          
          // If the deleted record belongs to the currently selected date in Daily view,
          // update the daily view state locally to reflect deletion
          if (item.date === selectedDate) {
              setDailyRecords(prev => prev.map(rec => {
                if (rec.employee.id === item.employeeId) {
                    const key = item.shift === 'Sáng' ? 'morning' : 'afternoon';
                    const emptyRecord: Attendance = {
                        id: `${item.employeeId}-${selectedDate}-${item.shift}`, 
                        employeeId: item.employeeId, 
                        employeeName: rec.employee.fullName, 
                        department: rec.employee.department,
                        date: selectedDate, 
                        shift: item.shift, 
                        status: 'Chưa quét'
                    };
                    return { ...rec, [key]: emptyRecord };
                }
                return rec;
              }));
          }
      } else {
          alert("Xóa thất bại. Vui lòng thử lại.");
      }
  };

  const saveDailyAttendance = async () => {
    setSaving(true);
    // Flatten the records and filter out the untouched ones
    const recordsToSave = dailyRecords.flatMap(rec => [rec.morning, rec.afternoon])
      .filter(att => att.status !== 'Chưa quét');
      
    if (recordsToSave.length === 0) {
      alert("Không có thay đổi nào để lưu.");
      setSaving(false);
      return;
    }

    const result = await dataService.saveAttendance(recordsToSave);
    if (result.success) {
      alert('Đã lưu chấm công thành công!');
      loadHistory();
    } else {
      alert(`Lưu thất bại: ${result.error}\nVui lòng đảm bảo bạn đã chạy lệnh SQL để tạo UNIQUE constraint hoặc PRIMARY KEY.`);
    }
    setSaving(false);
  };

  const getQrData = (emp: Employee) => {
    // Format: ID\nFullName\nDOB\nDepartment\nPosition\nPhone
    const cleanData = [
      emp.id,
      emp.fullName,
      formatDateVN(emp.dob),
      emp.department || 'N/A',
      emp.position || 'N/A',
      emp.phone || 'N/A'
    ].join('\n');
    return encodeURIComponent(cleanData);
  };

  // --- SCANNER LOGIC ---
  const processQrData = (dataString: string) => {
      try {
        let empId = '';
        let empName = '';

        // Case 1: JSON (Legacy)
        if (dataString.trim().startsWith('{')) {
            const data = JSON.parse(dataString);
            empId = data.id;
            empName = data.name;
        } 
        // Case 2: Newline separated (Current standard)
        else if (dataString.includes('\n')) {
            const parts = dataString.split('\n');
            empId = parts[0]?.trim();
            empName = parts[1]?.trim();
        }
        // Case 3: Pipe separated (Legacy)
        else {
            const parts = dataString.split('|');
            empId = parts[0]?.trim();
            empName = parts[1]?.trim();
        }
        
        if (!empId) throw new Error("Mã QR không hợp lệ");
        
        // Find employee in loaded records
        const recordIndex = dailyRecords.findIndex(r => r.employee.id === empId);
        if (recordIndex === -1) {
            alert(`Không tìm thấy nhân viên trong danh sách: ${empName || empId}`);
            return;
        }

        const employee = dailyRecords[recordIndex].employee;
        const currentHour = new Date().getHours();
        const shift = currentHour < 12 ? 'Sáng' : 'Chiều';
        
        setPendingScan({
            employee: employee,
            time: getCurrentTime(),
            shift: shift,
            status: 'Đi làm', // Default
            notes: 'Quét QR'
        });

      } catch (err) {
        console.error("QR Parse Error:", err);
        alert("Mã QR không hợp lệ hoặc lỗi định dạng.");
      }
  };

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    processQrData(scanInput);
    setScanInput(''); 
  };

  const confirmCheckIn = async () => {
      if (!pendingScan) return;

      const newRecord: Attendance = {
            id: `${pendingScan.employee.id}-${selectedDate}-${pendingScan.shift}`,
            employeeId: pendingScan.employee.id,
            employeeName: pendingScan.employee.fullName,
            department: pendingScan.employee.department,
            date: selectedDate,
            timeIn: pendingScan.time,
            shift: pendingScan.shift,
            status: pendingScan.status as any,
            notes: pendingScan.notes
      };

      const res = await dataService.saveAttendance([newRecord]);

      if (res.success) {
            handleRecordUpdate(pendingScan.employee.id, pendingScan.shift, { status: newRecord.status as any, timeIn: newRecord.timeIn, notes: newRecord.notes });
            setPendingScan(null); // Close modal
            alert("✅ Đã chấm công thành công!");
      } else {
            alert("Lỗi lưu chấm công: " + res.error);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Chấm Công</h2>
           <p className="text-sm text-gray-500">Quản lý thời gian làm việc theo ca Sáng/Chiều</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
           {['daily', 'history', 'qr'].map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
             >
               {tab === 'daily' && <span className="flex items-center"><Scan size={16} className="mr-2"/> Chấm công ngày</span>}
               {tab === 'history' && <span className="flex items-center"><History size={16} className="mr-2"/> Lịch sử</span>}
               {tab === 'qr' && <span className="flex items-center"><QrCode size={16} className="mr-2"/> Mã QR</span>}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-[75vh]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
             <div className="flex items-center space-x-3">
                <span className="text-gray-600 font-medium text-sm">Ngày chấm công:</span>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white shadow-sm" />
             </div>
             <AppButton onClick={saveDailyAttendance} loading={saving} icon={Save}>
               Lưu dữ liệu
             </AppButton>
          </div>

          <div className="overflow-auto flex-1 relative">
            {loading ? <div className="p-10 text-center">Đang tải dữ liệu...</div> : (
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4 bg-gray-50">Nhân viên</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 bg-gray-50">Ca</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40 bg-gray-50">Giờ vào</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 bg-gray-50">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {dailyRecords.map((record, idx) => (
                  <React.Fragment key={record.employee.id}>
                    {/* Morning Row */}
                    <tr className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="px-6 py-3 whitespace-nowrap" rowSpan={2}>
                        <div className="font-bold text-gray-900">{record.employee.fullName}</div>
                        <div className="text-xs text-gray-400 font-mono">{record.employee.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-700 font-semibold flex items-center"><Sun size={14} className="mr-2"/> Sáng</td>
                      <td className="px-4 py-3">
                         {record.morning.timeIn ? (
                           <div className="flex items-center space-x-2">
                               <div className="flex items-center text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-md w-fit border border-emerald-100">
                                  <Clock size={14} className="mr-1.5" /> {record.morning.timeIn}
                               </div>
                               <button onClick={() => handleDeleteDailyRecord(record.employee.id, 'Sáng')} className="text-gray-400 hover:text-red-500 p-1 transition-colors rounded-full hover:bg-red-50" title="Xóa/Hoàn tác">
                                   <Trash2 size={14} />
                               </button>
                           </div>
                         ) : (
                           <button onClick={() => handleRecordUpdate(record.employee.id, 'Sáng', { status: 'Đi làm', timeIn: getCurrentTime() })} className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors border border-blue-100">
                             <Scan size={14} className="mr-1.5" /> Quét thủ công
                           </button>
                         )}
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={record.morning.status} 
                          onChange={(e) => handleRecordUpdate(record.employee.id, 'Sáng', { status: e.target.value as any })}
                          className="block w-full text-sm border-gray-200 rounded-lg shadow-sm py-1.5 pl-2 pr-8 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                        >
                           <option value="Chưa quét">-- Chọn --</option>
                           <option value="Đi làm">Đi làm</option><option value="Nghỉ phép">Nghỉ phép</option><option value="Nghỉ bệnh">Nghỉ bệnh</option><option value="Trễ">Trễ</option><option value="Khác">Khác</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={record.morning.notes || ''} onChange={(e) => handleRecordUpdate(record.employee.id, 'Sáng', { notes: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-shadow" placeholder="Ghi chú..." />
                      </td>
                    </tr>
                    {/* Afternoon Row */}
                    <tr className="border-b border-gray-200 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm text-orange-700 font-semibold flex items-center"><Moon size={14} className="mr-2"/> Chiều</td>
                      <td className="px-4 py-3">
                         {record.afternoon.timeIn ? (
                           <div className="flex items-center space-x-2">
                               <div className="flex items-center text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-md w-fit border border-emerald-100">
                                  <Clock size={14} className="mr-1.5" /> {record.afternoon.timeIn}
                               </div>
                               <button onClick={() => handleDeleteDailyRecord(record.employee.id, 'Chiều')} className="text-gray-400 hover:text-red-500 p-1 transition-colors rounded-full hover:bg-red-50" title="Xóa/Hoàn tác">
                                   <Trash2 size={14} />
                               </button>
                           </div>
                         ) : (
                           <button onClick={() => handleRecordUpdate(record.employee.id, 'Chiều', { status: 'Đi làm', timeIn: getCurrentTime() })} className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors border border-blue-100">
                             <Scan size={14} className="mr-1.5" /> Quét thủ công
                           </button>
                         )}
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={record.afternoon.status} 
                          onChange={(e) => handleRecordUpdate(record.employee.id, 'Chiều', { status: e.target.value as any })}
                          className="block w-full text-sm border-gray-200 rounded-lg shadow-sm py-1.5 pl-2 pr-8 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                        >
                           <option value="Chưa quét">-- Chọn --</option>
                           <option value="Đi làm">Đi làm</option><option value="Nghỉ phép">Nghỉ phép</option><option value="Nghỉ bệnh">Nghỉ bệnh</option><option value="Trễ">Trễ</option><option value="Khác">Khác</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={record.afternoon.notes || ''} onChange={(e) => handleRecordUpdate(record.employee.id, 'Chiều', { notes: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-shadow" placeholder="Ghi chú..." />
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {currentUser.role !== 'admin' && (
             <div className="bg-amber-50 p-3 border-b border-amber-100 flex items-center text-sm text-amber-800">
               <Lock size={16} className="mr-2" /> Chỉ xem (Quyền hạn chế)
             </div>
          )}
          <GenericTable<Attendance>
            data={historyRecords}
            columns={[
              { header: 'Ngày', accessor: (item) => formatDateVN(item.date) },
              { header: 'Nhân viên', accessor: 'employeeName' },
              { header: 'Ca', accessor: 'shift'},
              { header: 'Giờ vào', accessor: (item) => item.timeIn || '--:--' },
              { header: 'Trạng thái', accessor: (item) => <span className={`px-2 py-1 text-xs rounded-full font-medium ${item.status === 'Đi làm' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>{item.status}</span> },
              { header: 'Ghi chú', accessor: 'notes' },
            ]}
            actions={(item) => (
                <button 
                  onClick={() => handleDeleteHistory(item)}
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
                  title="Xóa bản ghi"
                >
                    <Trash2 size={16} />
                </button>
            )}
          />
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col h-[600px]">
                 <div className="mb-4">
                     <h3 className="text-lg font-bold text-gray-800">Mã QR Nhân viên</h3>
                     <p className="text-sm text-gray-500 mb-2">Chọn nhân viên để xem mã chi tiết</p>
                     
                     <div className="relative">
                       <input 
                         type="text" 
                         className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                         placeholder="Tìm nhân viên..."
                       />
                       <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                     </div>
                 </div>
                 
                 <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {dailyRecords.map(rec => (
                       <div key={rec.employee.id} onClick={() => setQrEmployee(rec.employee)} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${qrEmployee?.id === rec.employee.id ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'hover:bg-gray-50 border-gray-200'}`}>
                          <div><p className="font-semibold text-gray-800 text-sm">{rec.employee.fullName}</p><p className="text-xs text-gray-500">{rec.employee.id}</p></div>
                          <QrCode size={18} className="text-gray-400" />
                       </div>
                    ))}
                 </div>
              </div>

              <div className="flex flex-col items-center justify-start border-l border-gray-100 pl-4 space-y-8">
                 {/* QR Display Area */}
                 {qrEmployee ? (
                    <div className="text-center p-8 bg-white shadow-xl rounded-2xl border border-gray-100 w-full max-w-sm">
                       <h4 className="font-bold text-lg text-gray-900 mb-1">{qrEmployee.fullName}</h4>
                       <p className="text-gray-500 text-sm mb-6">{qrEmployee.position} - {qrEmployee.department}</p>
                       <div className="bg-white p-2 inline-block border border-gray-200 rounded-xl shadow-inner mb-4">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${getQrData(qrEmployee)}`} alt="QR" className="w-48 h-48 rounded-lg" />
                       </div>
                    </div>
                 ) : (
                    <div className="text-center text-gray-400 py-10">
                       <QrCode size={64} className="mx-auto mb-4 opacity-20" />
                       <p className="text-sm">Chọn nhân viên để xem mã</p>
                    </div>
                 )}

                 {/* Scanner & Manual Input */}
                 <div className="w-full max-w-sm bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center"><Scan className="mr-2"/> Khu vực Chấm công</h4>
                    
                    {!showCamera ? (
                        <>
                            <AppButton 
                                variant="primary" 
                                className="w-full mb-4" 
                                icon={Camera} 
                                onClick={() => setShowCamera(true)}
                            >
                                Quét bằng Camera
                            </AppButton>
                            
                            <div className="relative border-t border-gray-200 pt-4">
                                <p className="text-xs text-gray-500 mb-2">Hoặc dùng máy quét USB / Nhập tay:</p>
                                <form onSubmit={handleManualScan}>
                                    <input 
                                    ref={scanInputRef}
                                    type="text" 
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder='NV001...'
                                    />
                                    <button type="submit" className="hidden">Submit</button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                             <div id="reader" className="w-full rounded-lg overflow-hidden bg-black"></div>
                             <AppButton variant="secondary" className="w-full" icon={CameraOff} onClick={() => setShowCamera(false)}>
                                 Đóng Camera
                             </AppButton>
                        </div>
                    )}
                 </div>
              </div>
           </div>

           {/* CONFIRMATION MODAL */}
           {pendingScan && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-xl">
                 <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
                     <div className="flex justify-between items-start mb-4 border-b pb-3">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <CheckCircle size={20} className="text-green-500 mr-2" />
                            Xác nhận chấm công
                        </h3>
                        <button onClick={() => setPendingScan(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                           <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold mr-3">
                              {pendingScan.employee.fullName.charAt(0)}
                           </div>
                           <div>
                              <p className="font-bold text-gray-900">{pendingScan.employee.fullName}</p>
                              <p className="text-xs text-gray-500">{pendingScan.employee.id} - {pendingScan.employee.department}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Thời gian quét</label>
                                <div className="text-lg font-mono font-bold text-gray-800 bg-gray-50 p-2 rounded border border-gray-200 text-center">
                                    {pendingScan.time}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Ca trực</label>
                                <div className="text-lg font-bold text-gray-800 bg-gray-50 p-2 rounded border border-gray-200 text-center">
                                    {pendingScan.shift}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái chấm công</label>
                            <select 
                                value={pendingScan.status}
                                onChange={(e) => setPendingScan({...pendingScan, status: e.target.value as any})}
                                className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                            >
                                <option value="Đi làm">Đi làm</option>
                                <option value="Trễ">Đi trễ</option>
                                <option value="Khác">Công tác / Khác</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                            <input 
                                type="text" 
                                value={pendingScan.notes || ''}
                                onChange={(e) => setPendingScan({...pendingScan, notes: e.target.value})}
                                className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Nhập ghi chú nếu có..."
                            />
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button onClick={() => setPendingScan(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                                Hủy bỏ
                            </button>
                            <button onClick={confirmCheckIn} className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 shadow-md flex justify-center items-center">
                                <Check size={18} className="mr-2" /> Gửi đi
                            </button>
                        </div>
                     </div>
                 </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;
