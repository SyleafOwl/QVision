import type { Alerta } from '../types/qvision';

interface PanelAlertasProps {
  alertas: Alerta[];
}

const coloresTipo: Record<Alerta['tipo'], string> = {
  danger: 'border-red-500',
  warning: 'border-yellow-500',
  success: 'border-esmeralda-500',
  neutral: 'border-gray-300'
};

export function PanelAlertas({ alertas }: PanelAlertasProps) {
  return (
    <div className="panel-bg rounded-lg shadow-suave border border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-3 border-b bg-gray-50 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-200 text-sm">Registro de Alertas</div>
      <div className="max-h-64 overflow-y-auto p-2 space-y-2">
        {alertas.length === 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-4 text-center">Sin alertas activas</div>
        )}
        {alertas.map(a => (
          <div key={a.id} className={`flex items-start p-2 rounded transition border-l-2 ${coloresTipo[a.tipo]} bg-white dark:bg-gray-700`}> 
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-100 leading-snug">{a.mensaje}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{a.hora}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PanelAlertas;