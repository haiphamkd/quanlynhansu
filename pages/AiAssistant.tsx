
import React, { useEffect, useState } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import { dataService } from '../services/dataService';
import { analyzeDepartmentData } from '../services/geminiService';

const AiAssistant: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAiAnalysis();
  }, []);

  const loadAiAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const [funds, reports] = await Promise.all([
        dataService.getFunds(),
        dataService.getReports()
      ]);
      const insight = await analyzeDepartmentData(funds, reports);
      setAiInsight(insight);
    } catch (err: any) {
      setError("Không thể tải dữ liệu phân tích: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center">
          <Sparkles className="mr-2 text-teal-600" /> Trợ lý AI
        </h2>
        <p className="text-gray-500 text-sm">Phân tích dữ liệu thông minh và báo cáo xu hướng</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 min-h-[300px] flex flex-col items-center justify-center text-center">
        {loading ? (
          <div className="flex flex-col items-center">
             <Loader className="animate-spin text-teal-600 mb-4" size={48} />
             <p className="text-gray-600 font-medium">AI đang phân tích dữ liệu hoạt động...</p>
             <p className="text-gray-400 text-sm mt-1">Quá trình này có thể mất vài giây</p>
          </div>
        ) : error ? (
           <div className="text-red-500">
             <p>{error}</p>
             <button onClick={loadAiAnalysis} className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">Thử lại</button>
           </div>
        ) : (
          <div className="max-w-3xl w-full text-left">
             <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-2xl border border-teal-100 mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="bg-teal-600 p-1.5 rounded-md">
                    <Sparkles className="text-white" size={16} />
                  </div>
                  <h3 className="font-bold text-lg text-teal-900 tracking-wide">Nhận định & Khuyến nghị</h3>
                </div>
                <div className="prose prose-teal max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {aiInsight}
                </div>
             </div>
             
             <div className="text-center mt-8">
               <button onClick={loadAiAnalysis} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                 Làm mới phân tích
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssistant;