import { useEffect } from 'react';
import type { TemaColor } from '../types/qvision';
import { Moon, Sun } from 'lucide-react';

interface BarraNavegacionProps {
  tema: TemaColor;
  onToggleTema: () => void;
}

export function BarraNavegacion({ tema, onToggleTema }: BarraNavegacionProps) {
  useEffect(() => {
    const root = document.documentElement;
    if (tema === 'oscuro') root.classList.add('dark'); else root.classList.remove('dark');
  }, [tema]);
  return (
    <nav className="shadow bg-esmeralda-700 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded shadow">
            <div className="w-6 h-6 bg-esmeralda-700 rounded-sm" />
          </div>
          <span className="text-xl font-bold tracking-tight">QVision <span className="font-light opacity-80">Admin</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleTema}
            className="flex items-center gap-1 text-xs bg-esmeralda-800 hover:bg-esmeralda-600 transition px-3 py-1 rounded-full"
          >
            {tema === 'oscuro' ? <Sun size={14} /> : <Moon size={14} />}
            {tema === 'oscuro' ? 'Claro' : 'Oscuro'}
          </button>
          <div className="text-xs bg-esmeralda-800 px-3 py-1 rounded-full flex items-center">
            <span className="w-2 h-2 bg-esmeralda-400 rounded-full mr-2 animate-pulse" />
            Oracle DB: Conectado
          </div>
        </div>
      </div>
    </nav>
  );
}

export default BarraNavegacion;