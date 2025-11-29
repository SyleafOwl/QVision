import type { PrediccionIA } from '../types/qvision';
import { Database } from 'lucide-react';

interface TarjetaPrediccionProps {
  prediccion: PrediccionIA;
}

export function TarjetaPrediccion({ prediccion }: TarjetaPrediccionProps) {
  return (
    <div className="rounded-lg shadow-suave p-4 border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30">
      <h4 className="text-orange-800 dark:text-orange-300 font-bold mb-2 flex items-center text-sm">
        <Database className="w-4 h-4 mr-2" /> Predicción IA
      </h4>
      <p className="text-xs text-orange-700 dark:text-orange-200 mb-3 leading-relaxed">
        Se espera un aumento de afluencia del <strong>{prediccion.porcentaje}%</strong> en los próximos {prediccion.ventanaMinutos} minutos.
      </p>
      <button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs py-2 rounded transition">
        Sugerencia: {prediccion.sugerencia}
      </button>
    </div>
  );
}

export default TarjetaPrediccion;