
import React, { useState, useEffect } from 'react';
import { FileText, Save, Pencil, Paperclip, X, Building, Trash2, Download, ChevronLeft, ChevronRight, File as FileIcon, ImageIcon, Eye, UploadCloud, Plus } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { PrescriptionReport } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN } from '../utils/helpers';
import { AppButton } from '../components/AppButton';

// --- File Preview Modal (Reused Logic) ---
const FilePreviewModal: React.FC<{ files: string[], startIndex: number, onClose: () => void }> = ({ files, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const currentFile = files[currentIndex];

  const getFileType = (base64: string) => {
    if (base64.startsWith('data:image/')) return 'image';
    if (base64.startsWith('data:application/pdf')) return 'pdf';
    return 'other';
  };
  
  const fileType = getFileType(currentFile);
  const fileName = `download.${fileType === 'pdf' ? 'pdf' : 'png'}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentFile;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex-none p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Xem tài liệu đính kèm</h3>
          <div className="flex items-center space-x-2">
             <span className="text-sm font-mono bg-gray-200 text-gray-600 px-2 py-1 rounded-md">{currentIndex + 1} / {files.length}</span>
             <AppButton variant="secondary" size="sm" icon={Download} onClick={handleDownload}>Tải xuống</AppButton>
             <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full"><X size={20}/></button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-gray-100 relative overflow-hidden">
          {fileType === 'image' && <img src={currentFile} className="max-w-full max-h-full object-contain" />}
          {fileType === 'pdf' && <iframe src={currentFile} className="w-full h-full border-none" title="PDF Preview"/>}
          {fileType === 'other' && (
            <div className="text-center text-gray-500 flex flex-col items-center">
              <FileIcon size={64} className="mb-4" />
              <p className="font-semibold">Không hỗ trợ xem trước</p>
              <AppButton variant="primary" icon={Download} onClick={handleDownload} className="mt-4">Tải xuống</AppButton>
            </div>
          )}
          
          {/* Navigation */}
          {files.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentIndex(p => (p - 1 + files.length) % files.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-transform active:scale-90"
              >
                <ChevronLeft />
              </button>
              <button 
                onClick={() => setCurrentIndex(p => (p + 1) % files.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-transform active:scale-90"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ReportManager: React.FC = () => {
  const [reports, setReports] = useState<PrescriptionReport[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  // Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<string[]>([]);
  const [previewStartIndex, setPreviewStartIndex] = useState(0);
  
  const getCurrentUser = () => {
    try {
      const saved = localStorage.getItem('pharmahr_user');
      return saved ? JSON.parse(saved) : { name: 'Guest', username: 'guest', role: 'staff' };
    } catch {
      return { name: 'Guest', username: 'guest', role: 'staff' };
    }
  };

  const currentUser = getCurrentUser();

  const initialFormState: PrescriptionReport = {
    id: '',
    date: new Date().toISOString().split('T')[0],
    totalIssued: 0,
    notReceived: 0,
    reason: '',
    reporter: currentUser.name,
    reporterId: currentUser.username,
    department: currentUser.department,
    attachmentUrls: []
  };

  const [formData, setFormData] = useState<PrescriptionReport>(initialFormState);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const deptFilter = currentUser.role === 'admin' ? 'All' : currentUser.department;
    const data = await dataService.getReports(deptFilter);
    setReports(data);
  };

  const handleEdit = (item: PrescriptionReport) => {
    if (currentUser.role !== 'admin' && item.reporterId !== currentUser.username) {
      alert("Bạn chỉ có thể sửa báo cáo do chính mình tạo.");
      return;
    }
    setFormData(item);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa báo cáo này?")) {
        await dataService.deleteReport(id);
        loadReports();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const readers = Array.from(e.target.files).map((file: File) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(newFileUrls => {
        setFormData(prev => ({ ...prev, attachmentUrls: [...(prev.attachmentUrls || []), ...newFileUrls] }));
      });
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachmentUrls: prev.attachmentUrls?.filter((_, i) => i !== index)
    }));
  };

  const handleViewFiles = (files: string[], startIndex: number = 0) => {
     if (!files || files.length === 0) return;
     setPreviewFiles(files);
     setPreviewStartIndex(startIndex);
     setIsPreviewOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newReport = {
      ...formData,
      id: isEditing ? formData.id : `R-${Date.now()}`,
      reporter: isEditing ? formData.reporter : currentUser.name,
      reporterId: isEditing ? formData.reporterId : currentUser.username,
      department: isEditing ? formData.department : currentUser.department,
    };

    await dataService.addReport(newReport); 
    loadReports();
    setFormData(initialFormState);
    setIsEditing(false);
  };

  const totalCalculated = (formData.totalIssued || 0) + (formData.notReceived || 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <FileText className="mr-2 text-teal-600" /> Báo cáo Đơn thuốc
        {currentUser.department && <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center"><Building size={12} className="mr-1"/>{currentUser.department}</span>}
      </h2>

      {/* FORM SECTION (TOP) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6 border-b pb-3">
             <h3 className="font-bold text-gray-800 flex items-center">
                {isEditing ? <Pencil size={18} className="mr-2 text-blue-600"/> : <FileText size={18} className="mr-2 text-teal-600"/>}
                {isEditing ? 'Chỉnh sửa báo cáo' : 'Nhập liệu báo cáo ngày'}
             </h3>
             {isEditing && (
                 <button onClick={() => { setIsEditing(false); setFormData(initialFormState); }} className="text-sm text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors">
                     Hủy bỏ
                 </button>
             )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Ngày báo cáo</label>
                        <input 
                            type="date" required 
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                            className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Người báo cáo</label>
                        <input 
                            type="text" disabled
                            value={formData.reporter}
                            className="block w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500" 
                        />
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                        <span className="text-xs font-bold text-blue-600 uppercase">Tổng đơn thuốc</span>
                        <div className="text-3xl font-bold text-blue-800 mt-1">{totalCalculated}</div>
                    </div>
                </div>

                {/* Column 2: Stats */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Đã cấp (Đơn)</label>
                        <input 
                            type="number" required min="0"
                            value={formData.totalIssued}
                            onChange={e => setFormData({...formData, totalIssued: Number(e.target.value)})}
                            className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-lg font-bold text-blue-700 focus:ring-2 focus:ring-teal-500" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Chưa nhận (Đơn)</label>
                        <input 
                            type="number" required min="0"
                            value={formData.notReceived}
                            onChange={e => setFormData({...formData, notReceived: Number(e.target.value)})}
                            className="block w-full border border-red-300 rounded-lg px-3 py-2 text-lg font-bold text-red-600 focus:ring-2 focus:ring-red-500" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Lý do chưa nhận</label>
                        <textarea 
                            value={formData.reason}
                            onChange={e => setFormData({...formData, reason: e.target.value})}
                            className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                            rows={2}
                            placeholder="Nhập lý do..."
                        ></textarea>
                    </div>
                </div>

                {/* Column 3: Attachments */}
                <div className="space-y-3">
                    <label className="block text-xs font-semibold text-gray-700 uppercase">Tài liệu đính kèm</label>
                    <div className="min-h-[160px] border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-4 flex flex-col">
                        <div className="flex-1 space-y-2 mb-3">
                             {formData.attachmentUrls && formData.attachmentUrls.length > 0 ? (
                                formData.attachmentUrls.map((url, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 shadow-sm">
                                        <div className="flex items-center truncate max-w-[150px]">
                                            <Paperclip size={14} className="text-gray-400 mr-2 shrink-0"/>
                                            <span className="text-xs text-gray-600 truncate">File {idx + 1}</span>
                                        </div>
                                        <div className="flex space-x-1">
                                            <button type="button" onClick={() => handleViewFiles(formData.attachmentUrls!, idx)} className="p-1 hover:bg-gray-100 rounded text-blue-500"><Eye size={14}/></button>
                                            <button type="button" onClick={() => removeFile(idx)} className="p-1 hover:bg-red-50 rounded text-red-500"><X size={14}/></button>
                                        </div>
                                    </div>
                                ))
                             ) : (
                                 <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                     <UploadCloud size={32} className="mb-2 opacity-50"/>
                                     <span className="text-xs">Chưa có file</span>
                                 </div>
                             )}
                        </div>
                        
                        <label className="w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 cursor-pointer flex justify-center items-center transition-colors">
                            <Plus size={16} className="mr-2"/> Thêm ảnh/file
                            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                </div>
             </div>

             <div className="pt-4 border-t border-gray-100">
                 <AppButton type="submit" variant="primary" icon={Save} className="w-full md:w-auto md:px-10 shadow-lg shadow-teal-100">
                    {isEditing ? 'Cập nhật báo cáo' : 'Lưu báo cáo'}
                 </AppButton>
             </div>
          </form>
      </div>

      {/* TABLE SECTION (BOTTOM) */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
           <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <FileText size={18} className="mr-2 text-gray-400"/> Lịch sử báo cáo
           </h3>
           <GenericTable 
             data={[...reports].reverse().slice(0, 20)}
             columns={[
               { header: 'Ngày', accessor: (item) => formatDateVN(item.date), className: 'w-32' },
               { header: 'Tổng', accessor: (item) => <span className="font-bold">{(item.totalIssued || 0) + (item.notReceived || 0)}</span>, className: 'text-center bg-gray-50 w-24' },
               { header: 'Đã cấp', accessor: 'totalIssued', className: 'text-blue-600 font-bold text-center w-24' },
               { header: 'Chưa nhận', accessor: 'notReceived', className: 'text-red-600 font-bold text-center w-24' },
               { header: 'Lý do', accessor: 'reason', className: 'max-w-xs truncate' },
               { 
                   header: 'Đính kèm', 
                   accessor: (item) => (item.attachmentUrls && item.attachmentUrls.length > 0) ? (
                     <button onClick={() => handleViewFiles(item.attachmentUrls!)} className="flex items-center text-xs font-medium text-teal-700 bg-teal-50 px-2 py-1 rounded-full border border-teal-100 hover:bg-teal-100 transition-colors">
                        <Paperclip size={12} className="mr-1"/> {item.attachmentUrls.length} file
                     </button>
                   ) : <span className="text-gray-300 text-xs">-</span>
               },
               { header: 'Người báo cáo', accessor: 'reporter', className: 'text-sm text-gray-600' },
             ]}
             actions={(item) => (
               <div className="flex space-x-2 justify-end">
                   <button 
                     onClick={() => handleEdit(item)}
                     className={`p-1.5 rounded-lg transition-colors ${
                       currentUser.role === 'admin' || item.reporterId === currentUser.username 
                       ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-50' 
                       : 'text-gray-300 cursor-not-allowed'
                     }`}
                     disabled={!(currentUser.role === 'admin' || item.reporterId === currentUser.username)}
                     title="Sửa"
                   >
                     <Pencil size={16} />
                   </button>
                   {(currentUser.role === 'admin' || item.reporterId === currentUser.username) && (
                       <button 
                         onClick={() => handleDelete(item.id)}
                         className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                         title="Xóa"
                       >
                         <Trash2 size={16} />
                       </button>
                   )}
               </div>
             )}
           />
      </div>

      {isPreviewOpen && <FilePreviewModal files={previewFiles} startIndex={previewStartIndex} onClose={() => setIsPreviewOpen(false)} />}
    </div>
  );
};

export default ReportManager;
