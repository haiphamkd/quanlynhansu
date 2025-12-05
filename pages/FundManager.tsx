
import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Filter, Save, X } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { FundTransaction, TransactionType } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN, formatCurrencyVN, formatNumberInput, parseNumberInput } from '../utils/helpers';

const FundManager: React.FC = () => {
  const [funds, setFunds] = useState<FundTransaction[]>([]);
  const [filteredFunds, setFilteredFunds] = useState<FundTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Stats
  const [totals, setTotals] = useState({ balance: 0, income: 0, expense: 0 });

  // Filters
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0]
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: TransactionType.INCOME,
    content: '',
    amount: '', // String for formatting
    performer: ''
  });

  // Load history contents for dropdown
  const [historyContents, setHistoryContents] = useState<string[]>([]);

  // Current User
  const getCurrentUser = () => {
     try {
       return JSON.parse(localStorage.getItem('pharmahr_user') || '{}');
     } catch { return { name: '' }; }
  };

  useEffect(() => {
    loadFunds();
  }, []);

  useEffect(() => {
    filterData();
    // Unique contents for suggestions
    setHistoryContents([...new Set(funds.map(f => f.content))]);
  }, [funds, dateRange]);

  const loadFunds = async () => {
    const data = await dataService.getFunds();
    setFunds(data);
  };

  const filterData = () => {
    const filtered = funds.filter(f => 
      f.date >= dateRange.from && f.date <= dateRange.to
    );
    setFilteredFunds(filtered);

    const income = filtered.filter(f => f.type === TransactionType.INCOME).reduce((sum, f) => sum + f.amount, 0);
    const expense = filtered.filter(f => f.type === TransactionType.EXPENSE).reduce((sum, f) => sum + f.amount, 0);
    const currentBalance = funds.length > 0 ? funds[funds.length - 1].balanceAfter : 0;

    setTotals({ balance: currentBalance, income, expense });
  };

  const handleOpenModal = () => {
     const user = getCurrentUser();
     setFormData({
        date: new Date().toISOString().split('T')[0],
        type: TransactionType.INCOME,
        content: '',
        amount: '',
        performer: user.name || ''
     });
     setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTrans = {
      ...formData,
      amount: parseNumberInput(formData.amount),
      id: `T-${Date.now()}`,
      balanceAfter: 0 
    } as FundTransaction;

    await dataService.addFundTransaction(newTrans);
    setIsModalOpen(false);
    loadFunds();
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-6 text-white shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium opacity-90 text-sm">TỔNG QUỸ HIỆN TẠI</h3>
            <Wallet className="opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatCurrencyVN(totals.balance)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-medium text-gray-500 text-sm uppercase">Tổng Thu (Kỳ này)</h3>
             <div className="bg-green-100 p-2 rounded-full text-green-600"><TrendingUp size={18} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrencyVN(totals.income)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-medium text-gray-500 text-sm uppercase">Tổng Chi (Kỳ này)</h3>
             <div className="bg-red-100 p-2 rounded-full text-red-600"><TrendingDown size={18} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrencyVN(totals.expense)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-2 border rounded-md px-3 py-1.5 bg-gray-50">
             <Filter size={16} className="text-gray-400" />
             <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="bg-transparent text-sm focus:outline-none w-32"/>
             <span className="text-gray-400">-</span>
             <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="bg-transparent text-sm focus:outline-none w-32"/>
          </div>
        </div>
        <button 
          onClick={handleOpenModal}
          className="h-10 bg-indigo-600 text-white px-4 rounded-lg flex items-center justify-center hover:bg-indigo-700 shadow-sm font-medium text-sm whitespace-nowrap"
        >
          <Plus size={18} className="mr-2" /> Thêm giao dịch
        </button>
      </div>

      <GenericTable 
        data={[...filteredFunds].reverse()}
        columns={[
          { header: 'Ngày', accessor: (item) => formatDateVN(item.date), className: 'w-28' },
          { 
            header: 'Loại', 
            accessor: (item) => (
              <span className={`flex items-center font-medium ${item.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                {item.type === TransactionType.INCOME ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                {item.type}
              </span>
            ),
            className: 'w-24'
          },
          { header: 'Nội dung', accessor: 'content' },
          { header: 'Người thực hiện', accessor: 'performer' },
          { 
            header: 'Số tiền', 
            accessor: (item) => <div className="text-right font-medium">{formatCurrencyVN(item.amount)}</div>,
            className: 'text-right w-32'
          },
          { 
            header: 'Số dư sau GD', 
            accessor: (item) => <div className="text-right text-gray-500 text-xs">{formatCurrencyVN(item.balanceAfter)}</div>,
            className: 'text-right w-32'
          },
        ]}
      />

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Thêm giao dịch mới</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 h-10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Loại</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TransactionType})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 h-10">
                  <option value={TransactionType.INCOME}>Thu</option>
                  <option value={TransactionType.EXPENSE}>Chi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số tiền (VNĐ)</label>
                <input 
                  type="text" required
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: formatNumberInput(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 h-10 text-right font-mono" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nội dung</label>
                <input 
                  type="text" required list="contents"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 h-10" 
                />
                <datalist id="contents">
                  {historyContents.map((c, i) => <option key={i} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Người thực hiện</label>
                <input type="text" required value={formData.performer} onChange={e => setFormData({...formData, performer: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 h-10" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 px-4 border rounded hover:bg-gray-50 text-sm font-medium flex items-center">
                   <X size={16} className="mr-2"/> Hủy
                </button>
                <button type="submit" className="h-10 px-4 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm font-medium flex items-center">
                   <Save size={16} className="mr-2"/> Lưu giao dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundManager;
