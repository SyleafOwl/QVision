import { Camera } from 'lucide-react';
import VisualizacionCola from './VisualizacionCola';
import { useSimulacionCamaras } from '../context/SimulacionCamarasContext';

export default function SimuladorCamaras() {
  const { cajas } = useSimulacionCamaras();
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 flex items-center gap-2">
        <Camera className="w-5 h-5" /> Cámaras (Simuladas)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cajas.map(c => (
          <VisualizacionCola
            key={c.id}
            nombreCaja={c.nombre}
            conteo={c.conteo}
            grupos={c.grupos}
            estado={c.estado}
            umbral={c.umbral}
            atendiendo={c.atendiendo}
          />
        ))}
      </div>
    </div>
  );
}