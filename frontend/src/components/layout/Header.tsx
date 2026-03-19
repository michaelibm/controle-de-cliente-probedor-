import { Bell, Search, User, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador', MANAGER: 'Gerente', FINANCIAL: 'Financeiro',
  ATTENDANT: 'Atendimento', SUPPORT: 'Suporte', READONLY: 'Visualização',
};

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-72">
        <Search size={16} className="text-slate-400" />
        <input
          type="text"
          placeholder="Buscar clientes, cobranças..."
          className="bg-transparent text-sm text-slate-600 placeholder:text-slate-400 outline-none w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell size={18} className="text-slate-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 cursor-pointer group">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-700 leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-400">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</p>
          </div>
          <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />
        </div>
      </div>
    </header>
  );
}
