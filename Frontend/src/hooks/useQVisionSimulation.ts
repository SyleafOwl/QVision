import { useEffect, useRef, useState } from 'react';
import type { EstadoSimulacion, Caja, Alerta, PrediccionIA } from '../types/qvision';

const INTERVALO_MS = 2500;
let alertaIdGlobal = 100;

const inicial: EstadoSimulacion = {
  cajas: [
    { id: 101, numero: 'Caja Rápida 1', estado: 'ABIERTA', personas: 3, umbral: 5 },
    { id: 102, numero: 'Caja Rápida 2', estado: 'ABIERTA', personas: 7, umbral: 5 },
    { id: 103, numero: 'Caja Regular 3', estado: 'CERRADA', personas: 0, umbral: 8 },
    { id: 104, numero: 'Caja Preferencial', estado: 'ABIERTA', personas: 2, umbral: 4 }
  ],
  alertas: [
    { id: 1, mensaje: 'Cola excedida en Caja Rápida 2 (7 personas)', hora: new Date().toLocaleTimeString(), tipo: 'danger' }
  ]
};

function generarHora(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export interface UseQVisionSimulationOptions {
  activar?: boolean;
}

export interface UseQVisionSimulationResultado extends EstadoSimulacion {
  totalPersonas: number;
  cajasAbiertas: number;
  prediccion: PrediccionIA;
  ultimaActualizacion: Date;
  pausar: () => void;
  reanudar: () => void;
}

export function useQVisionSimulation(opts: UseQVisionSimulationOptions = {}): UseQVisionSimulationResultado {
  const { activar = true } = opts;
  const [estado, setEstado] = useState<EstadoSimulacion>(inicial);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());
  const intervaloRef = useRef<number | null>(null);

  // Predicción simplificada basada en ocupación vs umbral promedio
  const prediccion: PrediccionIA = (() => {
    const abiertas = estado.cajas.filter(c => c.estado === 'ABIERTA');
    const ocupacionRelativa = abiertas.reduce((acc, c) => acc + c.personas / c.umbral, 0) / Math.max(1, abiertas.length);
    const porcentaje = Math.min(100, Math.round(ocupacionRelativa * 70 + 10));
    const sugerencia = porcentaje > 45 ? 'Considerar abrir otra caja' : 'Carga estable';
    return { porcentaje, ventanaMinutos: 20, sugerencia };
  })();

  useEffect(() => {
    if (!activar) return;
    function tic() {
      setUltimaActualizacion(new Date());
      setEstado(prev => {
        const cajasActualizadas: Caja[] = prev.cajas.map(c => {
          if (c.estado === 'CERRADA') return { ...c, personas: 0 };
          const delta = Math.floor(Math.random() * 3) - 1; // -1,0,1
            const personas = Math.max(0, c.personas + delta);
          return { ...c, personas };
        });
        const nuevasAlertas: Alerta[] = [];
        cajasActualizadas.forEach(c => {
          if (c.estado === 'ABIERTA' && c.personas > c.umbral) {
            const yaExiste = prev.alertas.some(a => a.mensaje.includes(c.numero) && a.hora === generarHora());
            if (!yaExiste) {
              nuevasAlertas.push({
                id: ++alertaIdGlobal,
                mensaje: `Cola excedida en ${c.numero} (${c.personas} personas)`,
                hora: generarHora(),
                tipo: 'danger'
              });
            }
          }
        });
        return { cajas: cajasActualizadas, alertas: [...nuevasAlertas, ...prev.alertas].slice(0, 50) };
      });
    }
    intervaloRef.current = window.setInterval(tic, INTERVALO_MS);
    return () => { if (intervaloRef.current) clearInterval(intervaloRef.current); };
  }, [activar]);

  const totalPersonas = estado.cajas.reduce((acc, c) => acc + c.personas, 0);
  const cajasAbiertas = estado.cajas.filter(c => c.estado === 'ABIERTA').length;

  function pausar() {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  }
  function reanudar() {
    if (!intervaloRef.current) {
      intervaloRef.current = window.setInterval(() => {
        setUltimaActualizacion(new Date());
        setEstado(prev => ({ ...prev })); // disparar actualización manual
      }, INTERVALO_MS);
    }
  }

  return { ...estado, totalPersonas, cajasAbiertas, prediccion, ultimaActualizacion, pausar, reanudar };
}

export default useQVisionSimulation;