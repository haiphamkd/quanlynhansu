
import React, { useState, useEffect } from 'react';
import { FileText, Paperclip, Plus, Trash2, Pencil, CheckCircle, X, Eye } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { Proposal } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN } from '../utils/helpers';
import { AppButton } from '../components/AppButton';

const ProposalManager: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialFormState: Partial<Proposal> = {
    title: '',
    proposalNumber: '',
    content: '',
    submitter: '',
    date: new Date().toISOString().split('T')[0],
    fileUrl: '',
    status: 'Chờ duyệt'
  };

  const [formData, setFormData] = useState<Partial<Proposal>>(initialFormState);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    const data = await dataService.getProposals();
    setProposals(data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, fileUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (item: Proposal) => {
    setEditingId(item.id);
    setFormData({
        ...item,
        proposalNumber: item.proposalNumber || '' // Ensure it is not undefined
    });
    setIsModalOpen(true);
  };

  const handleViewFile = (url: string) => {
      setPreviewFile(url);
      setIsPreviewOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure all required fields for Proposal are present
    const proposalData: Proposal = {
        id: editingId || `P-${Date.now()}`,
        date: formData.date || new Date().toISOString().split('T')[0],
        title: formData.title || '',
        proposalNumber: formData.proposalNumber || '',
        content: formData.content || '',
        submitter: formData.submitter || '',
        status: formData.status || 'Chờ duyệt',
        fileUrl: formData.fileUrl
    };

    if (editingId) {
        await dataService.updateProposal(proposalData);
    } else {
        await dataService.addProposal(proposalData);
    }
    
    await loadProposals();
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if(confirm("Xóa tờ trình này?")) {
      alert("Đã xóa (Mô phỏng)");
    }
  };

  const handleNewClick = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-2" /> Quản lý Tờ trình
        </h2>
        <AppButton 
          onClick={handleNewClick}
          variant="primary"
          icon={Plus}
        >
          Tạo tờ trình mới
        </AppButton>
      </div>

      <GenericTable 
        data={[...proposals].reverse()}
        columns={[
          { header: 'Số TT', accessor: (item) => <span className="font-mono text-teal-700 font-bold">{item.proposalNumber || '-'}</span>, className: 'w-24' },
          { header: 'Ngày', accessor: (item) => formatDateVN(item.date), className: 'w-28' },
          { header: 'Tiêu đề', accessor: 'title', className: 'font-medium' },
          { header: 'Người trình', accessor: 'submitter' },
          { 
            header: 'Trạng thái', 
            accessor: (item) => (
              <span className={`px-2 py-1 text-xs rounded-full ${
                item.status === 'Đã duyệt' ? 'bg-green-100 text-green-800' :
                item.status === 'Từ chối' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {item.status}
              </span>
            )
          },
          { 
            header: 'File đính kèm', 
            accessor: (item) => item.fileUrl && item.fileUrl.length > 5 ? (
              <button onClick={() => handleViewFile(item.fileUrl!)} className="text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-2 py-1 rounded text-xs">
                <Eye size={14} className="mr-1" /> Xem file
              </button>
            ) : <span className="text-gray-400 text-xs italic">Không có</span>
          }
        ]}
        actions={(item) => (
           <div className="flex space-x-2 justify-end">
              <button onClick={() => handleEditClick(item)} className="text-gray-500 hover:text-teal-600 p-1 bg-gray-100 rounded hover:bg-teal-50"><Pencil size={16} /></button>
              <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-600 p-1 bg-gray-100 rounded hover:bg-red-50"><Trash2 size={16} /></button>
           </div>
        )}
      />

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">
                {editingId ? 'Cập nhật tờ trình' : 'Tạo tờ trình mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Số tờ trình</label>
                  <input 
                    type="text" 
                    value={formData.proposalNumber || ''}
                    onChange={e => setFormData({...formData, proposalNumber: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" 
                    placeholder="VD: 123/TTr-KD"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Ngày</label>
                  <input 
                    type="date" required 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" 
                  />
                </div>
              </div>

              <div>
                 <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Người trình</label>
                 <input 
                   type="text" required 
                   value={formData.submitter}
                   onChange={e => setFormData({...formData, submitter: e.target.value})}
                   className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" 
                 />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Tiêu đề</label>
                <input 
                  type="text" required 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Nội dung chi tiết</label>
                <textarea 
                  required 
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Trạng thái</label>
                <select 
                   value={formData.status}
                   onChange={e => setFormData({...formData, status: e.target.value as any})}
                   className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                >
                    <option value="Chờ duyệt">Chờ duyệt</option>
                    <option value="Đã duyệt">Đã duyệt</option>
                    <option value="Từ chối">Từ chối</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Tải file lên</label>
                <div className="flex items-center mt-1">
                  <label className="cursor-pointer bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 flex items-center text-sm text-gray-700 shadow-sm transition-colors">
                    <Paperclip size={16} className="mr-2" /> Chọn tài liệu
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {formData.fileUrl && <span className="ml-3 text-xs text-green-600 flex items-center font-medium"><CheckCircle size={14} className="mr-1"/> Đã đính kèm</span>}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <AppButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</AppButton>
                <AppButton type="submit" variant="primary">{editingId ? 'Cập nhật' : 'Gửi tờ trình'}</AppButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILE PREVIEW MODAL */}
      {isPreviewOpen && previewFile && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-80 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col relative">
               <button 
                 onClick={() => setIsPreviewOpen(false)}
                 className="absolute -top-10 right-0 text-white hover:text-gray-300"
               >
                 <X size={24} />
               </button>
               <div className="flex-1 bg-gray-100 rounded-b-lg overflow-hidden">
                   {/* Use iframe to show base64 content safely inside a sandbox */}
                  <iframe src={previewFile} className="w-full h-full border-none" title="File Preview" />
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ProposalManager;
