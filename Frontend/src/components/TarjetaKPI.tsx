import { ReactNode } from 'react';

interface TarjetaKPIProps {
  icono: ReactNode;
  etiqueta: string;
  valor: ReactNode;
}

export function TarjetaKPI({ icono, etiqueta, valor }: TarjetaKPIProps) {
  return (
    <div className="panel-bg rounded-lg shadow-suave p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700">
      <div className="p-3 rounded-full bg-esmeralda-50 text-esmeralda-600 dark:bg-esmeralda-800 dark:text-esmeralda-100">
        {icono}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">{etiqueta}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{valor}</p>
      </div>
    </div>
  );
}

export default TarjetaKPI;