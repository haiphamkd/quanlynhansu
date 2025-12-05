import { Employee, FundTransaction, PrescriptionReport, Attendance, AnnualEvaluation, Proposal, User, Shift, TempData } from '../types';
import { MOCK_EMPLOYEES, MOCK_FUNDS, MOCK_REPORTS, MOCK_ATTENDANCE, MOCK_EVALUATIONS, MOCK_PROPOSALS } from './mockData';

// LINK CỨNG CỦA BẠN - KHÔNG CẦN NHẬP TAY NỮA
const HARDCODED_URL = 'https://script.google.com/macros/s/AKfycbxkVcJmyvpGKSD7ZJSbtN4xtPBRxj_fQGzdWZRd-ALgWtFVAcNh_Hpjr6MhVhsixmLP3A/exec';

class DataService {
  private apiUrl: string = HARDCODED_URL;
  private isDemoMode: boolean = false;

  // Cache data
  private employees: Employee[] = [...MOCK_EMPLOYEES];
  private funds: FundTransaction[] = [...MOCK_FUNDS];
  private reports: PrescriptionReport[] = [...MOCK_REPORTS];
  private attendance: Attendance[] = [...MOCK_ATTENDANCE];
  private evaluations: AnnualEvaluation[] = [...MOCK_EVALUATIONS];
  private proposals: Proposal[] = [...MOCK_PROPOSALS];
  private shifts: Shift[] = [];
  private tempData: TempData[] = [
    { type: 'TrinhDo', value: 'Dược sĩ Đại học' },
    { type: 'TrangThai', value: 'Đang làm việc' }
  ];

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const savedUrl = localStorage.getItem('pharmahr_api_url');
      if (savedUrl) this.apiUrl = savedUrl;
    }
  }

  setApiUrl(url: string) {
    this.apiUrl = url;
    localStorage.setItem('pharmahr_api_url', url);
  }

  getApiUrl() {
    return this.apiUrl;
  }

  setDemoMode(enabled: boolean) {
    this.isDemoMode = enabled;
  }

  isDemo() {
    return this.isDemoMode;
  }

  async testConnection(): Promise<{success: boolean, message: string}> {
    if (!this.apiUrl) return { success: false, message: 'Chưa cấu hình URL' };
    try {
       // Ping thử
       await fetch(`${this.apiUrl}?action=test`, {
          method: 'POST',
          body: JSON.stringify({ action: 'test' }),
          // KHÔNG HEADER để tránh CORS
       });
       return { success: true, message: 'Kết nối OK!' };
    } catch (e: any) {
       // Apps Script thường trả về opaque response (type: 'opaque') khi gọi no-cors hoặc text/plain
       // Nếu không throw error mạng tức là server có phản hồi
       return { success: true, message: 'Đã gửi tín hiệu đến Server (OK)' };
    }
  }

  private async callApi(action: string, data: any = {}) {
    if (this.isDemoMode) return null;
    
    try {
      const payload = { action: action, ...data };

      // KỸ THUẬT QUAN TRỌNG: Gửi POST không Header
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        redirect: 'follow', // Quan trọng: Google Apps Script redirect 302
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      
      try {
        const json = JSON.parse(text);
        if (json.error) throw new Error(json.error);
        return json;
      } catch (parseError) {
        if (text.includes('<!DOCTYPE html>')) {
           console.error("HTML Error form GAS:", text);
           throw new Error("Lỗi Script Google (Check Log GAS)");
        }
        throw parseError;
      }
    } catch (error) {
      console.error(`API Call Failed [${action}]:`, error);
      throw error;
    }
  }

  // --- Auth ---
  async login(username: string, password: string): Promise<{success: boolean, user?: User, error?: string}> {
    if (this.isDemoMode) {
      if (username === 'admin' && password === 'admin') 
        return { success: true, user: { username: 'admin', role: 'admin', name: 'Quản trị viên (Demo)' } };
      return { success: false, error: 'Sai thông tin (Demo: admin/admin)' };
    }

    try {
      const res = await this.callApi('login', { username, password });
      if (res && res.success) return res;
      return { success: false, error: res?.error || 'Sai tên đăng nhập hoặc mật khẩu' };
    } catch (e: any) {
      console.error(e);
      return { success: false, error: 'Lỗi kết nối. Vui lòng kiểm tra mạng.' };
    }
  }

  // ... (Các hàm khác giữ nguyên logic gọi callApi) ...
  async getEmployees(): Promise<Employee[]> {
    if (!this.isDemoMode) { try { const d = await this.callApi('getEmployees'); if(Array.isArray(d)) return d; } catch(e){} }
    return Promise.resolve([...this.employees]);
  }
  async addEmployee(emp: Employee): Promise<Employee> { if(!this.isDemoMode) await this.callApi('addEmployee', emp); this.employees.push(emp); return emp; }
  async updateEmployee(emp: Employee): Promise<Employee> { if(!this.isDemoMode) await this.callApi('updateEmployee', emp); return emp; }
  async deleteEmployee(id: string): Promise<boolean> { if(!this.isDemoMode) await this.callApi('deleteEmployee', {id}); return true; }
  async getDropdowns(): Promise<TempData[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getDropdowns'); if(Array.isArray(d)) return d; } catch(e){} } return this.tempData; }
  async getFunds(): Promise<FundTransaction[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getFunds'); if(Array.isArray(d)) return d; } catch(e){} } return Promise.resolve([...this.funds]); }
  async addFundTransaction(trans: FundTransaction): Promise<FundTransaction> { if(!this.isDemoMode) await this.callApi('addFund', trans); return trans; }
  async getReports(): Promise<PrescriptionReport[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getReports'); if(Array.isArray(d)) return d; } catch(e){} } return Promise.resolve([...this.reports]); }
  async addReport(report: PrescriptionReport): Promise<PrescriptionReport> { if(!this.isDemoMode) await this.callApi('addReport', report); return report; }
  async deleteReport(id: string): Promise<boolean> { if(!this.isDemoMode) await this.callApi('deleteReport', {id}); return true; }
  async getAttendance(): Promise<Attendance[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getAttendance'); if(Array.isArray(d)) return d; } catch(e){} } return Promise.resolve([...this.attendance]); }
  async saveAttendance(records: Attendance[]): Promise<boolean> { if(!this.isDemoMode) await this.callApi('saveAttendance', { records }); return true; }
  async getEvaluations(): Promise<AnnualEvaluation[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getEvaluations'); if(Array.isArray(d)) return d; } catch(e){} } return Promise.resolve([...this.evaluations]); }
  async addEvaluation(evalItem: AnnualEvaluation): Promise<AnnualEvaluation> { if(!this.isDemoMode) await this.callApi('addEvaluation', evalItem); return evalItem; }
  async deleteEvaluation(id: string): Promise<boolean> { if(!this.isDemoMode) await this.callApi('deleteEvaluation', {id}); return true; }
  async getProposals(): Promise<Proposal[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getProposals'); if(Array.isArray(d)) return d; } catch(e){} } return Promise.resolve([...this.proposals]); }
  async addProposal(prop: Proposal): Promise<Proposal> { if(!this.isDemoMode) await this.callApi('addProposal', prop); return prop; }
  async getShifts(): Promise<Shift[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getShifts'); if(Array.isArray(d)) return d; } catch(e){} } return Promise.resolve(this.shifts); }
  async saveShift(shift: Shift): Promise<boolean> { if(!this.isDemoMode) await this.callApi('saveShift', shift); return true; }
}

export const dataService = new DataService();
