import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Sparkles, Users, TrendingUp, AlertCircle, DollarSign, Pill } from 'lucide-react';
import { dataService } from '../services/dataService';
import { analyzeDepartmentData } from '../services/geminiService';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employeeCount: 0,
    fundBalance: 0,
    totalPrescriptions: 0,
    pendingIssues: 0
  });
  const [fundData, setFundData] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employees, funds, reports] = await Promise.all([
          dataService.getEmployees(),
          dataService.getFunds(),
          dataService.getReports()
        ]);

        // Process Stats
        const balance = funds.length > 0 ? funds[funds.length - 1].balanceAfter : 0;
        const totalP = reports.reduce((acc, curr) => acc + curr.totalIssued, 0);
        const pending = reports.reduce((acc, curr) => acc + curr.notReceived, 0);

        setStats({
          employeeCount: employees.length,
          fundBalance: balance,
          totalPrescriptions: totalP,
          pendingIssues: pending
        });

        // Process Fund Chart Data (Last 5 transactions)
        setFundData(funds.slice(-5).map(f => ({
          date: f.date,
          balance: f.balanceAfter,
          amount: f.amount,
          type: f.type
        })));

        // Process Report Chart Data
        setReportData(reports.slice(-5).map(r => ({
          date: r.date,
          issued: r.totalIssued,
          missed: r.notReceived
        })));

        // Get AI Insight
        // In a real app, might want to trigger this on demand or cache it to save tokens
        const insight = await analyzeDepartmentData(funds, reports);
        setAiInsight(insight);

      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Tổng quan Khoa Dược</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tổng nhân sự</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.employeeCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-lg text-green-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Quỹ hiện tại</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.fundBalance.toLocaleString()} ₫</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-teal-100 rounded-lg text-teal-600">
            <Pill size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Đơn thuốc (Tuần)</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.totalPrescriptions}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-lg text-red-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Chưa nhận thuốc</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.pendingIssues}</h3>
          </div>
        </div>
      </div>

      {/* AI Insight Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="text-indigo-600" size={20} />
            <h3 className="font-bold text-indigo-900">Phân tích từ AI Assistant</h3>
          </div>
          <p className="text-indigo-800 leading-relaxed text-sm md:text-base">
            {aiInsight || "Đang phân tích dữ liệu..."}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fund Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp size={18} className="mr-2 text-gray-500" />
            Biến động quỹ
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fundData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey="balance" stroke="#10b981" fillOpacity={1} fill="url(#colorBalance)" name="Số dư" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prescription Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Pill size={18} className="mr-2 text-gray-500" />
            Tình hình cấp phát thuốc
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Legend />
                <Bar dataKey="issued" name="Đã cấp" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missed" name="Chưa nhận" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;