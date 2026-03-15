export interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
}

export interface Company {
  id: number;
  name: string;
  cnpj: string;
}

export interface License {
  id: number;
  company_id: number;
  company_name?: string;
  company_cnpj?: string;
  type: string;
  issue_date: string;
  expiry_date: string;
  file_url: string;
  renewal_url: string;
}

export interface Document {
  id: number;
  license_id?: number;
  company_id?: number;
  license_type?: string;
  company_name?: string;
  direct_company_name?: string;
  type: string;
  file_url: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  is_read: number;
  created_at: string;
}

export type LicenseType = 
  | 'Polícia Civil'
  | 'Polícia Federal'
  | 'IBAMA'
  | 'CETESB'
  | 'Vigilância Sanitária'
  | 'Exército'
  | 'Municipal';
