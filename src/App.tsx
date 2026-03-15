import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  FileText, 
  Link as LinkIcon, 
  LogOut, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  Printer, 
  Moon, 
  Sun,
  ChevronRight,
  Filter,
  ExternalLink,
  Upload,
  Bell,
  Trash2,
  Info,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Company, License, LicenseType, Notification } from './types';

interface ToastProps {
  key?: React.Key;
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

const Toast = ({ message, type = 'success', onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      className={`fixed bottom-8 left-1/2 z-[200] flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl border ${
        type === 'success' 
          ? 'bg-emerald-600 border-emerald-500 text-white' 
          : 'bg-rose-600 border-rose-500 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      <span className="font-medium">{message}</span>
    </motion.div>
  );
};

// --- Components ---

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = '', ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '',
  icon: Icon,
  ...props
}: { 
  children?: React.ReactNode, 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger',
  onClick?: () => void,
  className?: string,
  icon?: React.ElementType,
  [key: string]: any
}) => {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
    secondary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    outline: 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  };

  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all active:scale-95 ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'companies' | 'licenses' | 'documents' | 'urls'>('dashboard');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState('');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');

  // Modal States
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Form States
  const [newCompany, setNewCompany] = useState({ name: '', cnpj: '' });
  const [newLicense, setNewLicense] = useState({ 
    company_id: '', 
    type: 'Polícia Civil' as LicenseType, 
    issue_date: '', 
    expiry_date: '', 
    file_url: '', 
    renewal_url: '' 
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [newDocument, setNewDocument] = useState({ license_id: '', company_id: '', type: '', file_url: '' });
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [editingDocument, setEditingDocument] = useState<any | null>(null);
  const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Fetch Data
  const fetchData = async () => {
    if (user) {
      const [cRes, lRes, dRes, nRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/licenses'),
        fetch('/api/documents'),
        fetch('/api/notifications')
      ]);
      setCompanies(await cRes.json());
      setLicenses(await lRes.json());
      setDocuments(await dRes.json());
      setNotifications(await nRes.json());
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCompany ? 'PATCH' : 'POST';
    const url = editingCompany ? `/api/companies/${editingCompany.id}` : '/api/companies';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCompany)
    });
    if (res.ok) {
      setShowCompanyModal(false);
      setEditingCompany(null);
      setNewCompany({ name: '', cnpj: '' });
      addToast(editingCompany ? 'Empresa atualizada!' : 'Empresa adicionada!');
      fetchData();
    }
  };

  const handleAddLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingLicense ? 'PATCH' : 'POST';
    const url = editingLicense ? `/api/licenses/${editingLicense.id}` : '/api/licenses';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLicense)
    });
    
    if (res.ok) {
      const savedLicense = await res.json();
      const licenseId = editingLicense ? editingLicense.id : savedLicense.id;

      // If multiple files were selected, create documents for each (simulated)
      if (selectedFiles && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              license_id: licenseId,
              type: `Anexo - ${file.name}`,
              file_url: URL.createObjectURL(file)
            })
          });
        }
      }

      setShowLicenseModal(false);
      setEditingLicense(null);
      setSelectedFiles(null);
      setNewLicense({ company_id: '', type: 'Polícia Civil', issue_date: '', expiry_date: '', file_url: '', renewal_url: '' });
      addToast(editingLicense ? 'Licença atualizada!' : 'Licença cadastrada!');
      fetchData();
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingDocument ? 'PATCH' : 'POST';
    const url = editingDocument ? `/api/documents/${editingDocument.id}` : '/api/documents';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDocument)
    });
    if (res.ok) {
      setShowDocumentModal(false);
      setEditingDocument(null);
      setNewDocument({ license_id: '', company_id: '', type: '', file_url: '' });
      addToast(editingDocument ? 'Documento atualizado!' : 'Documento salvo!');
      fetchData();
    }
  };

  const markAsRead = async (id: number) => {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    if (res.ok) {
      fetchData();
    }
  };

  const deleteNotification = async (id: number) => {
    const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData();
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleDeleteLicense = async (id: number) => {
    if (confirm('Deseja realmente excluir esta licença?')) {
      await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (confirm('Deseja realmente excluir esta empresa? Todas as licenças vinculadas serão excluídas.')) {
      await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (confirm('Deseja realmente excluir este documento?')) {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('print-area');
    if (printContent) {
      window.print();
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setNewCompany({ name: company.name, cnpj: company.cnpj });
    setShowCompanyModal(true);
  };

  const handleEditLicense = (license: License) => {
    setEditingLicense(license);
    setNewLicense({ 
      company_id: license.company_id.toString(), 
      type: license.type as any, 
      issue_date: license.issue_date, 
      expiry_date: license.expiry_date, 
      file_url: license.file_url, 
      renewal_url: license.renewal_url 
    });
    setShowLicenseModal(true);
  };

  const handleEditDocument = (doc: any) => {
    setEditingDocument(doc);
    setNewDocument({ 
      license_id: doc.license_id?.toString() || '', 
      company_id: doc.company_id?.toString() || '', 
      type: doc.type, 
      file_url: doc.file_url 
    });
    setShowDocumentModal(true);
  };

  const handleDownload = (url: string, name: string) => {
    // Simulated download
    const link = document.createElement('a');
    link.href = url || '#';
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQuickUserLogin = () => {
    setUser({ email: 'usuario@licencapro.com', role: 'user' });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setError('Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginEmail('');
    setLoginPassword('');
  };

  const getStatus = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring';
    return 'valid';
  };

  const filteredLicenses = useMemo(() => {
    return licenses.filter(l => {
      const matchesSearch = 
        l.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.company_cnpj?.includes(searchTerm) ||
        l.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const status = getStatus(l.expiry_date);
      const matchesStatus = filterStatus === 'all' || status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [licenses, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = licenses.length;
    const expired = licenses.filter(l => getStatus(l.expiry_date) === 'expired').length;
    const expiring = licenses.filter(l => getStatus(l.expiry_date) === 'expiring').length;
    const valid = total - expired - expiring;
    return { total, expired, expiring, valid };
  }, [licenses]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 mb-4 shadow-lg">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">LicençaPro</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Gestão Inteligente de Licenças</p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">E-mail</label>
                <input 
                  type="email" 
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Senha</label>
                <input 
                  type="password" 
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <Button variant="primary" className="w-full py-3 text-lg">
                Entrar como Administrador
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Ou</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={handleQuickUserLogin}
                className="w-full py-3 text-lg border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900"
              >
                Acesso Rápido - Usuário
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-center text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mb-4">Credenciais de Teste</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Admin</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">admin@example.com</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">admin123</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Usuário</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">user@example.com</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">user123</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 hidden lg:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">LicençaPro</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('licenses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'licenses' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Licenças</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'documents' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">Documentos</span>
          </button>

          {user.role === 'admin' && (
            <>
              <button 
                onClick={() => setActiveTab('companies')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'companies' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Building2 className="w-5 h-5" />
                <span className="font-medium">Empresas</span>
              </button>
              <button 
                onClick={() => setActiveTab('urls')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'urls' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <LinkIcon className="w-5 h-5" />
                <span className="font-medium">URLs Órgãos</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.email}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40">
          <h2 className="text-lg font-bold capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[150] overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <h4 className="font-bold">Notificações</h4>
                      <Badge variant="default">{unreadCount} novas</Badge>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p>Nenhuma notificação</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${!n.is_read ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <Info className="w-4 h-4 text-blue-500" />}
                                  <h5 className="font-bold text-sm">{n.title}</h5>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{n.message}</p>
                                <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                {!n.is_read && (
                                  <button 
                                    onClick={() => markAsRead(n.id)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
                                    title="Marcar como lida"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => deleteNotification(n.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 border-l-4 border-l-slate-900 dark:border-l-slate-100">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Licenças</p>
                  <div className="flex items-end justify-between mt-2">
                    <h3 className="text-3xl font-bold">{stats.total}</h3>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-emerald-500">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Válidas</p>
                  <div className="flex items-end justify-between mt-2">
                    <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.valid}</h3>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-amber-500">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">A Vencer (30 dias)</p>
                  <div className="flex items-end justify-between mt-2">
                    <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.expiring}</h3>
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-rose-500">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Vencidas</p>
                  <div className="flex items-end justify-between mt-2">
                    <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-400">{stats.expired}</h3>
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Main Dashboard Content */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px]" />
                      <input 
                        type="text" 
                        placeholder="Buscar por empresa, CNPJ ou licença..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      {user.role === 'admin' && (
                        <Button variant="primary" icon={Plus} onClick={() => setShowLicenseModal(true)} className="mr-2">Nova Licença</Button>
                      )}
                      <Filter className="w-[18px] h-[18px] text-slate-400" />
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="flex-1 md:w-40 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all"
                      >
                        <option value="all">Todos Status</option>
                        <option value="valid">Válidas</option>
                        <option value="expiring">A Vencer</option>
                        <option value="expired">Vencidas</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {filteredLicenses.map((license) => {
                        const status = getStatus(license.expiry_date);
                        return (
                          <motion.div
                            key={license.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                          >
                            <Card className="group hover:border-slate-400 dark:hover:border-slate-600 transition-all">
                              <div className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold text-lg">{license.type}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{license.company_name}</p>
                                    <p className="text-[10px] font-mono text-slate-400">{license.company_cnpj}</p>
                                  </div>
                                  <Badge variant={status === 'valid' ? 'success' : status === 'expiring' ? 'warning' : 'error'}>
                                    {status === 'valid' ? 'Válida' : status === 'expiring' ? 'A Vencer' : 'Vencida'}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800">
                                  <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Emissão</p>
                                    <p className="text-sm font-medium">{new Date(license.issue_date).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Vencimento</p>
                                    <p className={`text-sm font-bold ${status === 'expired' ? 'text-rose-600' : status === 'expiring' ? 'text-amber-600' : ''}`}>
                                      {new Date(license.expiry_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button variant="outline" className="flex-1 py-1.5 text-xs" icon={Download} onClick={() => handleDownload(license.file_url, `${license.type}.pdf`)}>Download</Button>
                                  <Button variant="outline" className="flex-1 py-1.5 text-xs" icon={Printer} onClick={handlePrint}>Imprimir</Button>
                                  {license.renewal_url && (
                                    <Button 
                                      variant="ghost" 
                                      className="p-2" 
                                      onClick={() => window.open(license.renewal_url, '_blank')}
                                      icon={ExternalLink}
                                      title="Abrir Portal"
                                    />
                                  )}
                                  {user.role === 'admin' && (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        className="p-2 text-slate-600 dark:text-slate-400" 
                                        onClick={() => handleEditLicense(license)}
                                        icon={Edit2}
                                        title="Editar"
                                      />
                                      <Button 
                                        variant="ghost" 
                                        className="p-2 text-rose-600" 
                                        onClick={() => handleDeleteLicense(license.id)}
                                        icon={Trash2}
                                        title="Excluir"
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Clock className="w-[18px] h-[18px] text-amber-500" />
                      Alertas Críticos
                    </h3>
                    <div className="space-y-4">
                      {licenses.filter(l => getStatus(l.expiry_date) !== 'valid').slice(0, 5).map(l => (
                        <div key={l.id} className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${getStatus(l.expiry_date) === 'expired' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                          <div>
                            <p className="text-xs font-bold">{l.type}</p>
                            <p className="text-[10px] text-slate-500">{l.company_name}</p>
                            <p className="text-[10px] font-medium mt-1">Vence em: {new Date(l.expiry_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                      {licenses.filter(l => getStatus(l.expiry_date) !== 'valid').length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle className="mx-auto text-emerald-500 opacity-20 mb-2 w-8 h-8" />
                          <p className="text-xs text-slate-500">Tudo em dia por aqui!</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <LinkIcon className="w-[18px] h-[18px] text-slate-400" />
                      Links Rápidos
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {Array.from(new Set(licenses.filter(l => l.renewal_url).map(l => l.type))).slice(0, 5).map(type => {
                        const license = licenses.find(l => l.type === type && l.renewal_url);
                        return (
                          <a 
                            key={type}
                            href={license?.renewal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                          >
                            <span className="text-sm font-medium">{type}</span>
                            <ExternalLink className="w-[14px] h-[14px] text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-all" />
                          </a>
                        );
                      })}
                      {licenses.filter(l => l.renewal_url).length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4 italic">Nenhum link cadastrado</p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'companies' && user.role === 'admin' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Gerenciamento de Empresas</h3>
                <Button variant="primary" icon={Plus} onClick={() => setShowCompanyModal(true)}>Nova Empresa</Button>
              </div>
              <Card>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Nome da Empresa</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">CNPJ</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Licenças Ativas</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {companies.map(company => (
                      <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                        <td className="px-6 py-4 font-medium">{company.name}</td>
                        <td className="px-6 py-4 font-mono text-sm">{company.cnpj}</td>
                        <td className="px-6 py-4">
                          <Badge>{licenses.filter(l => l.company_id === company.id).length}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <Button variant="ghost" className="p-2 text-slate-600 dark:text-slate-400" icon={Edit2} onClick={() => handleEditCompany(company)} title="Editar" />
                          <Button variant="ghost" className="p-2 text-rose-600" icon={Trash2} onClick={() => handleDeleteCompany(company.id)} title="Excluir" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {activeTab === 'licenses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Controle de Licenças</h3>
                {user.role === 'admin' && (
                  <div className="flex gap-2">
                    <Button variant="outline" icon={Printer} onClick={handlePrint}>Imprimir</Button>
                    <Button variant="primary" icon={Plus} onClick={() => { setEditingLicense(null); setNewLicense({ company_id: '', type: 'Polícia Civil', issue_date: '', expiry_date: '', file_url: '', renewal_url: '' }); setShowLicenseModal(true); }}>Cadastrar Licença</Button>
                  </div>
                )}
              </div>
              <Card>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Empresa</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Tipo</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vencimento</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {licenses.map(license => {
                      const status = getStatus(license.expiry_date);
                      return (
                        <tr key={license.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                          <td className="px-6 py-4">
                            <p className="font-medium">{license.company_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{license.company_cnpj}</p>
                          </td>
                          <td className="px-6 py-4 font-medium">{license.type}</td>
                          <td className="px-6 py-4 text-sm">{new Date(license.expiry_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <Badge variant={status === 'valid' ? 'success' : status === 'expiring' ? 'warning' : 'error'}>
                              {status === 'valid' ? 'Válida' : status === 'expiring' ? 'A Vencer' : 'Vencida'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <Button variant="ghost" className="p-2" icon={Download} onClick={() => handleDownload(license.file_url, `${license.type}_${license.company_name}.pdf`)} title="Download" />
                            <Button variant="ghost" className="p-2" icon={Printer} onClick={handlePrint} title="Imprimir" />
                            {user.role === 'admin' && (
                              <>
                                <Button variant="ghost" className="p-2 text-slate-600 dark:text-slate-400" icon={Edit2} onClick={() => handleEditLicense(license)} title="Editar" />
                                <Button variant="ghost" className="p-2 text-rose-600" icon={Trash2} onClick={() => handleDeleteLicense(license.id)} title="Excluir" />
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Documentos para Renovação</h3>
                {user.role === 'admin' && (
                  <Button variant="primary" icon={Plus} onClick={() => setShowDocumentModal(true)}>Novo Documento</Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {documents.map(doc => (
                  <Card key={doc.id} className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Upload className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      {user.role === 'admin' && (
                        <div className="flex gap-1">
                          <Button variant="ghost" className="p-1 text-slate-600 dark:text-slate-400" icon={Edit2} onClick={() => handleEditDocument(doc)} title="Editar" />
                          <Button variant="ghost" className="p-1 text-rose-600" icon={Trash2} onClick={() => handleDeleteDocument(doc.id)} title="Excluir" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold">{doc.type}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ref: {doc.license_type || 'Documento Avulso'}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-2">{doc.company_name || doc.direct_company_name}</p>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-mono">DOC-{doc.id.toString().padStart(4, '0')}</span>
                      <Button variant="outline" className="py-1 px-3 text-xs" icon={Download}>Baixar</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'urls' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Portais de Renovação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {licenses.filter(l => l.renewal_url).map(license => (
                  <Card key={license.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <LinkIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-bold">{license.type}</h4>
                        <p className="text-sm text-slate-500">{license.company_name}</p>
                      </div>
                    </div>
                    <Button variant="primary" icon={ExternalLink} onClick={() => window.open(license.renewal_url, '_blank')}>Acessar Portal</Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showCompanyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-6">{editingCompany ? 'Editar Empresa' : 'Nova Empresa'}</h3>
                <form onSubmit={handleAddCompany} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome da Empresa</label>
                    <input 
                      type="text" 
                      required
                      value={newCompany.name}
                      onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CNPJ</label>
                    <input 
                      type="text" 
                      required
                      value={newCompany.cnpj}
                      onChange={(e) => setNewCompany({ ...newCompany, cnpj: maskCNPJ(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => { setShowCompanyModal(false); setEditingCompany(null); }}>Cancelar</Button>
                    <Button variant="primary" className="flex-1">{editingCompany ? 'Atualizar' : 'Salvar'}</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}

        {showLicenseModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg"
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-6">{editingLicense ? 'Editar Licença' : 'Cadastrar Licença'}</h3>
                <form onSubmit={handleAddLicense} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Empresa</label>
                      <select 
                        required
                        value={newLicense.company_id}
                        onChange={(e) => setNewLicense({ ...newLicense, company_id: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                      >
                        <option value="">Selecione uma empresa</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo de Licença</label>
                      <select 
                        required
                        value={newLicense.type}
                        onChange={(e) => setNewLicense({ ...newLicense, type: e.target.value as any })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                      >
                        <option>Polícia Civil</option>
                        <option>Polícia Federal</option>
                        <option>IBAMA</option>
                        <option>CETESB</option>
                        <option>Vigilância Sanitária</option>
                        <option>Exército</option>
                        <option>Municipal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Data de Vencimento</label>
                      <input 
                        type="date" 
                        required
                        value={newLicense.expiry_date}
                        onChange={(e) => setNewLicense({ ...newLicense, expiry_date: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">URL de Renovação (Opcional)</label>
                      <input 
                        type="url" 
                        value={newLicense.renewal_url}
                        onChange={(e) => setNewLicense({ ...newLicense, renewal_url: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                        placeholder="https://portal.orgao.gov.br"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Importar Documentos (PDF/Imagem)</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer relative">
                        <input 
                          type="file" 
                          multiple 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setSelectedFiles(e.target.files);
                              setNewLicense({ ...newLicense, file_url: URL.createObjectURL(e.target.files[0]) });
                              addToast(`${e.target.files.length} arquivos selecionados`);
                            }
                          }}
                        />
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-10 w-10 text-slate-400" />
                          <div className="flex text-sm text-slate-600 dark:text-slate-400">
                            <span className="relative cursor-pointer bg-transparent rounded-md font-medium text-slate-900 dark:text-slate-100 hover:text-slate-700 focus-within:outline-none">
                              Clique para importar múltiplos arquivos
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">PDF, PNG, JPG até 10MB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => { setShowLicenseModal(false); setEditingLicense(null); }}>Cancelar</Button>
                    <Button variant="primary" className="flex-1">{editingLicense ? 'Atualizar' : 'Salvar Licença'}</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}

        {showDocumentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-6">{editingDocument ? 'Editar Documento' : 'Novo Documento'}</h3>
                <form onSubmit={handleAddDocument} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Vincular à Licença (Opcional)</label>
                    <select 
                      value={newDocument.license_id}
                      onChange={(e) => setNewDocument({ ...newDocument, license_id: e.target.value, company_id: '' })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                    >
                      <option value="">Nenhuma (Documento Avulso)</option>
                      {licenses.map(l => <option key={l.id} value={l.id}>{l.company_name} - {l.type}</option>)}
                    </select>
                  </div>
                  {!newDocument.license_id && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Vincular à Empresa</label>
                      <select 
                        required={!newDocument.license_id}
                        value={newDocument.company_id}
                        onChange={(e) => setNewDocument({ ...newDocument, company_id: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                      >
                        <option value="">Selecione uma empresa</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo de Documento</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Comprovante de Taxa, Requerimento..."
                      value={newDocument.type}
                      onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Importar Arquivo</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setNewDocument({ ...newDocument, file_url: URL.createObjectURL(e.target.files[0]) });
                          }
                        }}
                      />
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-10 w-10 text-slate-400" />
                        <div className="flex text-sm text-slate-600 dark:text-slate-400">
                          <span className="relative cursor-pointer bg-transparent rounded-md font-medium text-slate-900 dark:text-slate-100 hover:text-slate-700 focus-within:outline-none">
                            Clique para importar arquivo
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => { setShowDocumentModal(false); setEditingDocument(null); }}>Cancelar</Button>
                    <Button variant="primary" className="flex-1">{editingDocument ? 'Atualizar' : 'Salvar Documento'}</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            message={toast.message} 
            type={toast.type} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </AnimatePresence>

      {/* Print Area (Hidden in UI) */}
      <div id="print-area" className="hidden print:block p-8 bg-white text-black">
        <h1 className="text-2xl font-bold mb-8 border-b-2 border-black pb-4">Relatório de Licenças</h1>
        {companies.map(company => {
          const companyLicenses = licenses.filter(l => l.company_id === company.id);
          if (companyLicenses.length === 0) return null;
          return (
            <div key={company.id} className="mb-8 break-inside-avoid">
              <h2 className="text-xl font-bold mb-4 bg-slate-100 p-2">{company.name} - {company.cnpj}</h2>
              <table className="w-full text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 px-4 py-2">Tipo</th>
                    <th className="border border-slate-300 px-4 py-2">Vencimento</th>
                    <th className="border border-slate-300 px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {companyLicenses.map(license => {
                    const status = getStatus(license.expiry_date);
                    return (
                      <tr key={license.id}>
                        <td className="border border-slate-300 px-4 py-2">{license.type}</td>
                        <td className="border border-slate-300 px-4 py-2">{new Date(license.expiry_date).toLocaleDateString()}</td>
                        <td className="border border-slate-300 px-4 py-2">
                          {status === 'valid' ? 'Válida' : status === 'expiring' ? 'A Vencer' : 'Vencida'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
