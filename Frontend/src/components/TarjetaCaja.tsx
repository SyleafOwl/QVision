import { AlertTriangle } from 'lucide-react';
import type { Caja } from '../types/qvision';

interface TarjetaCajaProps {
  caja: Caja;
}

const coloresEstado: Record<Caja['estado'], string> = {
  ABIERTA: 'bg-esmeralda-100 text-esmeralda-800 dark:bg-esmeralda-800 dark:text-esmeralda-100',
  CERRADA: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
};

export function TarjetaCaja({ caja }: TarjetaCajaProps) {
  const sobrecarga = caja.estado === 'ABIERTA' && caja.personas > caja.umbral;
  return (
    <div className={`panel-bg rounded-lg shadow-suave border relative overflow-hidden border-l-4 ${sobrecarga ? 'border-l-red-500' : 'border-l-esmeralda-500'} border-gray-200 dark:border-gray-700 p-4`}> 
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-gray-800 dark:text-gray-100">{caja.numero}</h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">CAM-20{caja.id % 100}</span>
        </div>
        <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${coloresEstado[caja.estado]}`}>{caja.estado}</span>
      </div>
      <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded-md flex items-end justify-center p-2 space-x-1 border border-dashed border-gray-300 dark:border-gray-600 relative">
        {caja.estado === 'CERRADA' ? (
          <span className="text-gray-400 text-sm self-center">Caja Cerrada</span>
        ) : (
          Array.from({ length: caja.personas }).map((_, i) => (
            <div key={i} className="w-4 bg-esmeralda-500 dark:bg-esmeralda-600 rounded-t-sm" style={{ height: `${30 + Math.random() * 40}%` }} />
          ))
        )}
        {sobrecarga && (
          <div className="absolute top-2 right-2 flex items-center text-[10px] text-red-600 font-bold bg-white dark:bg-gray-700 px-2 py-1 rounded shadow">
            <AlertTriangle size={12} className="mr-1" /> SOBRECARGA
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-between items-center text-xs">
        <span>Personas: <strong>{caja.personas}</strong></span>
        <span className="text-gray-500 dark:text-gray-400">Umbral: {caja.umbral}</span>
      </div>
    </div>
  );
}

export default TarjetaCaja;