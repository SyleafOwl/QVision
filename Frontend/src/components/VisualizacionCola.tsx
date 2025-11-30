import React from 'react';
import { ShoppingCart, User, Store } from 'lucide-react';

type VisualizacionColaProps = {
  nombreCaja: string;
  conteo: number;
  grupos: number[]; // grupos ya calculados (persistentes)
  estado: string;
  umbral?: number;
  atendiendo?: boolean;
};

export default function VisualizacionCola({ nombreCaja, conteo, grupos, estado, umbral = 5, atendiendo = false }: VisualizacionColaProps) {
  const maxPorFila = 4;
  const maxFilas = 3;
  const capacidadGrupos = maxPorFila * maxFilas;
  const gruposVisibles = grupos.slice(0, capacidadGrupos); // limitar filas
  const usadosVisibles = gruposVisibles.reduce((a, b) => a + b, 0);
  const overflowPersonas = conteo - usadosVisibles;
  const saturado = conteo > umbral;
  const filas: number[][] = [];
  for (let i = 0; i < gruposVisibles.length; i += maxPorFila) {
    if (filas.length < maxFilas) filas.push(gruposVisibles.slice(i, i + maxPorFila));
  }

  return (
    <div className={`panel-bg rounded-lg shadow-suave p-4 border ${saturado ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h4 className="font-semibold text-gray-800 dark:text-gray-100">{nombreCaja}</h4>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${estado === 'ABIERTA' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-100' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>{estado}</span>
      </div>

      {/* Área de cámara (vista cenital) */}
      <div className="bg-white border border-gray-300 dark:border-gray-600 rounded-md p-6 min-h-72 md:min-h-80">
        {/* Caja arriba */}
        <div className="mb-4">
          <div className="flex-shrink-0 w-64 h-28 bg-gray-200 dark:bg-gray-700 rounded-md border border-gray-400/70 dark:border-gray-500/60 flex flex-col items-center justify-center">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">CAJA</span>
            {conteo === 0 ? (
              <span className="mt-1 text-xs font-semibold text-gray-600 dark:text-gray-300">Libre</span>
            ) : atendiendo ? (
              <span className="mt-1 text-xs font-semibold text-amber-600">Atendiendo...</span>
            ) : null}
          </div>
        </div>

        {/* Fila de clientes debajo (lineal) */}
        {conteo === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Libre</div>
        ) : (
          <div className="flex flex-col items-stretch gap-3">
            {filas.map((fila, filaIdx) => (
              <div key={filaIdx} className="w-full">
                {/* Línea gris separadora simulando cerca para filas inferiores */}
                {filaIdx > 0 && (
                  <div className="w-full h-px bg-gray-300 dark:bg-gray-600 mb-2" />
                )}
                <div
                  className={`flex ${filaIdx % 2 === 0 ? 'flex-row justify-start' : 'flex-row-reverse justify-end'} items-center gap-4 flex-nowrap w-full`}
                >
                {fila.map((personasEnGrupo, idxEnFila) => {
                  const idxGlobal = filaIdx * maxPorFila + idxEnFila;
                  const esPrimero = idxGlobal === 0;
                  const carritoClase = esPrimero && atendiendo ? 'bg-amber-400 text-amber-900 animate-pulse' : 'bg-emerald-500 text-white';
                  return (
                    <div key={`${filaIdx}-${idxEnFila}`} className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded ${carritoClase}`}>
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: personasEnGrupo }).map((_, i) => (
                          <div key={i} className="w-4 h-4 rounded-full bg-blue-500" />
                        ))}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            ))}
            {overflowPersonas > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">+{overflowPersonas} personas fuera de vista</div>
            )}
          </div>
        )}
      </div>

      {/* Pie: resumen sutil */}
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <span>Personas en cola: {conteo}</span>
        <span>Umbral: {umbral} {saturado && '(Saturación)'}</span>
      </div>
    </div>
  );
}
