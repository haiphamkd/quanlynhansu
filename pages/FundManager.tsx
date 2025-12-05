
import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Filter, Save, X } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { AppButton } from '../components/AppButton';
import { FundTransaction, TransactionType } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN, formatCurrencyVN, formatNumberInput, parseNumberInput } from '../utils/helpers';

const FundManager: React.FC = () => {
  const [funds, setFunds] = useState<FundTransaction[]>([]);
  const [filteredFunds, setFilteredFunds] = useState<FundTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totals, setTotals] = useState({ balance: 0, income: 0, expense: 0 });
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0]
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], type: TransactionType.INCOME, content: '', amount: '', performer: ''
  });
  const [historyContents, setHistoryContents] = useState<string[]>([]);

  const getCurrentUser = () => {
     try { return JSON.parse(localStorage.getItem('pharmahr_user') || '{}'); } catch { return { name: '' }; }
  };

  useEffect(() => { loadFunds(); }, []);
  useEffect(() => { filterData(); setHistoryContents([...new Set(funds.map(f => f.content))]); }, [funds, dateRange]);

  const loadFunds = async () => { setFunds(await dataService.getFunds()); };

  const filterData = () => {
    const filtered = funds.filter(f => f.date >= dateRange.from && f.date <= dateRange.to);
    setFilteredFunds(filtered);
    const income = filtered.filter(f => f.type === TransactionType.INCOME).reduce((sum, f) => sum + f.amount, 0);
    const expense = filtered.filter(f => f.type === TransactionType.EXPENSE).reduce((sum, f) => sum + f.amount, 0);
    const currentBalance = funds.length > 0 ? funds[funds.length - 1].balanceAfter : 0;
    setTotals({ balance: currentBalance, income, expense });
  };

  const handleOpenModal = () => {
     const user = getCurrentUser();
     setFormData({ date: new Date().toISOString().split('T')[0], type: TransactionType.INCOME, content: '', amount: '', performer: user.name || '' });
     setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTrans = { ...formData, amount: parseNumberInput(formData.amount), id: `T-${Date.now()}`, balanceAfter: 0 } as FundTransaction;
    await dataService.addFundTransaction(newTrans);
    setIsModalOpen(false);
    loadFunds();
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-teal-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-teal-100 text-sm uppercase tracking-wider">TỔNG QUỸ</h3>
              <Wallet className="text-teal-200" size={20} />
            </div>
            <p className="text-3xl font-bold tracking-tight">{formatCurrencyVN(totals.balance)}</p>
          </div>
          <div className="absolute -bottom-4 -right-4 bg-white opacity-5 w-24 h-24 rounded-full"></div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
             <h3 className="font-medium text-gray-500 text-xs uppercase tracking-wider">Tổng Thu</h3>
             <div className="bg-emerald-50 p-1.5 rounded-md text-emerald-600"><TrendingUp size={16} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrencyVN(totals.income)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
             <h3 className="font-medium text-gray-500 text-xs uppercase tracking-wider">Tổng Chi</h3>
             <div className="bg-rose-50 p-1.5 rounded-md text-rose-600"><TrendingDown size={16} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrencyVN(totals.expense)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 px-3 py-1.5">
             <Filter size={14} className="text-gray-400" />
             <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="bg-transparent text-sm focus:outline-none w-28 text-gray-600 font-medium"/>
             <span className="text-gray-300">-</span>
             <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="bg-transparent text-sm focus:outline-none w-28 text-gray-600 font-medium"/>
          </div>
        </div>
        <AppButton variant="primary" icon={Plus} onClick={handleOpenModal}>
           Thêm giao dịch
        </AppButton>
      </div>

      <GenericTable 
        data={[...filteredFunds].reverse()}
        columns={[
          { header: 'Ngày', accessor: (item) => formatDateVN(item.date), className: 'w-28 text-gray-500' },
          { 
            header: 'Loại', 
            accessor: (item) => (
              <span className={`flex items-center font-medium text-xs ${item.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                {item.type === TransactionType.INCOME ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                {item.type}
              </span>
            ),
            className: 'w-24'
          },
          { header: 'Nội dung', accessor: 'content', className: 'font-medium text-gray-800' },
          { header: 'Người thực hiện', accessor: 'performer', className: 'text-gray-500 text-xs hidden sm:table-cell' },
          { 
            header: 'Số tiền', 
            accessor: (item) => <div className={`text-right font-bold ${item.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>{item.type === TransactionType.INCOME ? '+' : '-'}{formatCurrencyVN(item.amount)}</div>,
            className: 'text-right w-32'
          },
          { 
            header: 'Số dư cuối', 
            accessor: (item) => <div className="text-right text-gray-400 text-xs font-mono">{formatCurrencyVN(item.balanceAfter)}</div>,
            className: 'text-right w-32 hidden md:table-cell'
          },
        ]}
      />

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-lg font-bold text-gray-800">Thêm giao dịch</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Ngày</label>
                   <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="block w-full border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Loại</label>
                   <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TransactionType})} className="block w-full border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500">
                     <option value={TransactionType.INCOME}>Thu</option>
                     <option value={TransactionType.EXPENSE}>Chi</option>
                   </select>
                 </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Số tiền (VNĐ)</label>
                <input type="text" required value={formData.amount} onChange={e => setFormData({...formData, amount: formatNumberInput(e.target.value)})} className="block w-full border-gray-200 rounded-lg px-3 py-2 text-right font-bold text-gray-800 focus:ring-2 focus:ring-teal-500 text-lg" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nội dung</label>
                <input type="text" required list="contents" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="block w-full border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" placeholder="Nhập nội dung..." />
                <datalist id="contents">{historyContents.map((c, i) => <option key={i} value={c} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Người thực hiện</label>
                <input type="text" required value={formData.performer} onChange={e => setFormData({...formData, performer: e.target.value})} className="block w-full border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="pt-4">
                <AppButton type="submit" variant="primary" icon={Save} className="w-full">
                   Lưu giao dịch
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundManager;
