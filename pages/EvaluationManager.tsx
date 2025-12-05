
import React, { useState, useEffect } from 'react';
import { Star, Award, CheckCircle } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { AnnualEvaluation, Employee, EvaluationRank, EmployeeStatus } from '../types';
import { dataService } from '../services/dataService';

const EvaluationManager: React.FC = () => {
  const [evaluations, setEvaluations] = useState<AnnualEvaluation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const initialFormState = {
    employeeId: '',
    professional: 0, attitude: 0, discipline: 0,
    rank: EvaluationRank.COMPLETED,
    rewardProposal: 'Không',
    rewardTitle: 'Lao động tiên tiến',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const init = async () => {
      const [emps, evals] = await Promise.all([
        dataService.getEmployees(),
        dataService.getEvaluations()
      ]);
      setEmployees(emps.filter(e => e.status === EmployeeStatus.ACTIVE));
      setEvaluations(evals);
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return alert("Vui lòng chọn nhân viên");

    const employee = employees.find(e => e.id === formData.employeeId);
    if (!employee) return;

    const avg = parseFloat(((formData.professional + formData.attitude + formData.discipline) / 3).toFixed(1));
    
    const newEval: AnnualEvaluation = {
      id: `E-${year}-${employee.id}`,
      year: year,
      employeeId: employee.id,
      fullName: employee.fullName,
      position: employee.position,
      scoreProfessional: formData.professional,
      scoreAttitude: formData.attitude,
      scoreDiscipline: formData.discipline,
      averageScore: avg,
      rank: formData.rank,
      rewardProposal: formData.rewardProposal,
      rewardTitle: formData.rewardTitle,
      notes: formData.notes
    };

    await dataService.addEvaluation(newEval);
    setEvaluations(await dataService.getEvaluations());
    alert("Đã lưu đánh giá!");
    setFormData(initialFormState);
  };

  const filteredEvaluations = evaluations.filter(e => e.year === year);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <Star className="mr-2 text-yellow-500" /> Đánh giá thi đua năm {year}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-fit">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Award className="mr-2 text-teal-600" /> Nhập đánh giá mới
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
              <label className="block text-sm font-medium text-gray-700">Chọn nhân viên</label>
              <select 
                value={formData.employeeId}
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md h-10 px-3"
                required
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.fullName} ({e.position})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600">Chuyên môn</label>
                <input 
                  type="number" min="0" max="100" required
                  value={formData.professional}
                  onChange={e => setFormData({...formData, professional: Number(e.target.value)})}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Thái độ</label>
                <input 
                  type="number" min="0" max="100" required
                  value={formData.attitude}
                  onChange={e => setFormData({...formData, attitude: Number(e.target.value)})}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Kỷ luật</label>
                <input 
                  type="number" min="0" max="100" required
                  value={formData.discipline}
                  onChange={e => setFormData({...formData, discipline: Number(e.target.value)})}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 text-center"
                />
              </div>
            </div>

            <div className="border-t pt-4">
               <label className="block text-sm font-medium text-gray-700 mb-1">Xếp loại thi đua</label>
               <select 
                  value={formData.rank}
                  onChange={e => setFormData({...formData, rank: e.target.value as EvaluationRank})}
                  className="block w-full border border-gray-300 rounded-md h-10 px-3"
               >
                 {Object.values(EvaluationRank).map(r => <option key={r} value={r}>{r}</option>)}
               </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Đề nghị khen thưởng</label>
                  <select 
                     value={formData.rewardProposal}
                     onChange={e => setFormData({...formData, rewardProposal: e.target.value})}
                     className="block w-full border border-gray-300 rounded-md h-10 px-2 text-sm"
                  >
                    <option value="Không">Không</option>
                    <option value="Sở Y tế">Sở Y tế</option>
                    <option value="Bệnh viện">Bệnh viện</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Danh hiệu</label>
                  <select 
                     value={formData.rewardTitle}
                     onChange={e => setFormData({...formData, rewardTitle: e.target.value})}
                     className="block w-full border border-gray-300 rounded-md h-10 px-2 text-sm"
                  >
                    <option value="Lao động tiên tiến">LĐ Tiên tiến</option>
                    <option value="Giấy khen">Giấy khen</option>
                    <option value="Chiến sĩ thi đua">Chiến sĩ thi đua</option>
                  </select>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                rows={2}
              ></textarea>
            </div>

            <button 
              type="submit"
              className="w-full h-10 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center font-medium"
            >
              <CheckCircle size={18} className="mr-2" /> Lưu đánh giá
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
             <div className="flex items-center space-x-2">
               <span className="text-gray-600 text-sm font-medium">Năm:</span>
               <select 
                 value={year} onChange={(e) => setYear(Number(e.target.value))}
                 className="border-gray-300 rounded-md border p-1"
               >
                 <option value={2023}>2023</option>
                 <option value={2024}>2024</option>
                 <option value={2025}>2025</option>
               </select>
             </div>
             <button className="text-sm text-blue-600 hover:underline font-medium">Xuất PDF báo cáo</button>
          </div>

          <GenericTable<AnnualEvaluation>
            data={filteredEvaluations}
            columns={[
              { header: 'Nhân viên', accessor: (item) => (
                <div>
                   <div className="font-semibold">{item.fullName}</div>
                   <div className="text-xs text-gray-500">{item.position}</div>
                </div>
              )},
              { header: 'Điểm TB', accessor: (item) => <span className="font-bold">{item.averageScore}</span>, className: 'text-center' },
              { 
                header: 'Xếp loại', 
                accessor: (item) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    item.rank === EvaluationRank.EXCELLENT ? 'bg-purple-100 text-purple-800' :
                    item.rank === EvaluationRank.GOOD ? 'bg-green-100 text-green-800' :
                    item.rank === EvaluationRank.COMPLETED ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.rank}
                  </span>
                )
              },
              { header: 'Khen thưởng', accessor: (item) => (
                <div className="text-xs">
                   <div>{item.rewardProposal !== 'Không' ? item.rewardProposal : ''}</div>
                   <div className="font-medium text-teal-700">{item.rewardTitle}</div>
                </div>
              )},
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default EvaluationManager;
