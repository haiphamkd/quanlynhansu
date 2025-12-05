
import React, { useState, useEffect } from 'react';
import { Calendar, Save, Printer, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { Shift, Employee } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN } from '../utils/helpers';

const ShiftManager: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate start/end of week (Monday to Sunday)
  const getWeekRange = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    const sunday = new Date(date.setDate(monday.getDate() + 6));
    return { monday, sunday };
  };

  const { monday, sunday } = getWeekRange(new Date(currentWeek));

  useEffect(() => {
    loadData();
  }, [currentWeek]);

  const loadData = async () => {
    setLoading(true);
    const [empData, shiftData] = await Promise.all([
      dataService.getEmployees(),
      dataService.getShifts()
    ]);
    setEmployees(empData);
    setShifts(shiftData);
    setLoading(false);
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const getShiftData = (ca: 'Sáng' | 'Chiều' | 'Đêm') => {
    const startStr = monday.toISOString().split('T')[0];
    const id = `${startStr}-${ca}`;
    return shifts.find(s => s.id === id) || {
       id, weekStart: startStr, weekEnd: sunday.toISOString().split('T')[0],
       ca, mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: ''
    };
  };

  const handleCellChange = (ca: 'Sáng' | 'Chiều' | 'Đêm', day: keyof Shift, value: string) => {
    const current = getShiftData(ca);
    const updated = { ...current, [day]: value };
    // Optimistic update logic if needed, or just save immediately
    saveShift(updated);
  };

  const saveShift = async (shift: Shift) => {
     await dataService.saveShift(shift);
     loadData();
  };

  const days = [
    { key: 'mon', label: 'Thứ Hai', date: monday },
    { key: 'tue', label: 'Thứ Ba', date: new Date(monday.getTime() + 86400000) },
    { key: 'wed', label: 'Thứ Tư', date: new Date(monday.getTime() + 86400000*2) },
    { key: 'thu', label: 'Thứ Năm', date: new Date(monday.getTime() + 86400000*3) },
    { key: 'fri', label: 'Thứ Sáu', date: new Date(monday.getTime() + 86400000*4) },
    { key: 'sat', label: 'Thứ Bảy', date: new Date(monday.getTime() + 86400000*5) },
    { key: 'sun', label: 'Chủ Nhật', date: new Date(monday.getTime() + 86400000*6) },
  ];

  const cas = [
    { name: 'Sáng', color: 'bg-blue-50 text-blue-700', time: '7:00 - 14:00' },
    { name: 'Chiều', color: 'bg-orange-50 text-orange-700', time: '14:00 - 21:00' },
    { name: 'Đêm', color: 'bg-purple-50 text-purple-700', time: '21:00 - 7:00' },
  ];

  const EmployeeSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => (
    <div className="relative group">
       <div className="flex items-center justify-center p-2 rounded cursor-pointer hover:bg-gray-100 min-h-[40px]">
         {value ? (
           <div className="text-center">
             <div className="font-bold text-sm text-gray-800">{value}</div>
           </div>
         ) : (
           <span className="text-gray-300 text-xs">+ Chọn</span>
         )}
       </div>
       {/* Simple Dropdown simulation */}
       <select 
         className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
         value={value}
         onChange={(e) => onChange(e.target.value)}
       >
         <option value="">-- Trống --</option>
         {employees.map(e => (
           <option key={e.id} value={e.fullName}>{e.fullName}</option>
         ))}
       </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
         <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Calendar className="mr-2" /> Lịch trực
         </h2>
         <div className="flex items-center space-x-2">
            <button className="flex items-center px-4 py-2 bg-white border rounded hover:bg-gray-50 text-gray-700" onClick={() => window.print()}>
               <Printer size={16} className="mr-2" /> In lịch
            </button>
            <button className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">
               <Save size={16} className="mr-2" /> Lưu thay đổi
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Calendar Widget */}
         <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-fit">
            <div className="flex items-center justify-between mb-4">
               <button onClick={() => changeWeek('prev')} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft /></button>
               <span className="font-bold text-lg text-gray-700">
                 {monday.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}
               </span>
               <button onClick={() => changeWeek('next')} className="p-1 hover:bg-gray-100 rounded"><ChevronRight /></button>
            </div>
            {/* Legend */}
            <div className="mt-4 space-y-2">
               <h4 className="font-medium text-sm text-gray-500">Chú thích ca:</h4>
               {cas.map(c => (
                 <div key={c.name} className="flex items-center text-xs">
                    <span className={`w-3 h-3 rounded-full mr-2 ${c.color.split(' ')[0].replace('bg-', 'bg-')}`}></span>
                    <span className="font-medium w-10">{c.name}</span>
                    <span className="text-gray-400">({c.time})</span>
                 </div>
               ))}
            </div>
         </div>

         {/* Weekly Grid */}
         <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <div className="p-4 border-b flex items-center justify-center font-medium text-gray-600 bg-gray-50">
               <button onClick={() => changeWeek('prev')} className="mr-4"><ChevronLeft size={20} /></button>
               Tuần {formatDateVN(monday.toISOString().split('T')[0])} - {formatDateVN(sunday.toISOString().split('T')[0])}
               <button onClick={() => changeWeek('next')} className="ml-4"><ChevronRight size={20} /></button>
            </div>
            
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                   <th className="px-4 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase w-20">Ca trực</th>
                   {days.map(d => (
                     <th key={d.key} className="px-2 py-3 bg-gray-50 text-center text-xs font-bold text-gray-500 uppercase border-l">
                        {d.label}<br/>
                        <span className="text-gray-400 font-normal">{d.date.getDate()}/{d.date.getMonth()+1}</span>
                     </th>
                   ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                 {cas.map(ca => {
                    const data = getShiftData(ca.name as any);
                    return (
                      <tr key={ca.name}>
                         <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                            {ca.name}
                         </td>
                         {days.map(d => (
                            <td key={d.key} className="px-1 py-2 border-l relative h-20 align-top">
                               <EmployeeSelect 
                                 value={(data as any)[d.key]} 
                                 onChange={(val) => handleCellChange(ca.name as any, d.key as keyof Shift, val)}
                               />
                            </td>
                         ))}
                      </tr>
                    );
                 })}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default ShiftManager;
