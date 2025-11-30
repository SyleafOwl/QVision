import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type Grupo = { size: number };
export type CajaSim = {
  id: number;
  nombre: string;
  estado: string;
  umbral: number;
  conteo: number; // total personas (derivado de grupos)
  grupos: number[]; // cada grupo = personas por carrito (1-3)
  atendiendo: boolean;
  atendiendoTicks: number;
  cicloIndex: number; // índice del ciclo de atención
};

interface SimulacionCamarasContextValue {
  cajas: CajaSim[];
}

function inicializarGrupos(conteo: number): number[] {
  const grupos: number[] = [];
  let restantes = conteo;
  while (restantes > 0) {
    const size = Math.min(3, restantes); // grupos compactos iniciales
    grupos.push(size);
    restantes -= size;
  }
  return grupos;
}

const inicial: CajaSim[] = [
  { id: 101, nombre: 'Caja 1', estado: 'ABIERTA', umbral: 6, conteo: 4, grupos: inicializarGrupos(4), atendiendo: false, atendiendoTicks: 0, cicloIndex: 0 },
  { id: 102, nombre: 'Caja 2', estado: 'ABIERTA', umbral: 6, conteo: 7, grupos: inicializarGrupos(7), atendiendo: false, atendiendoTicks: 0, cicloIndex: 0 },
  { id: 103, nombre: 'Caja 3', estado: 'ABIERTA', umbral: 8, conteo: 2, grupos: inicializarGrupos(2), atendiendo: false, atendiendoTicks: 0, cicloIndex: 0 },
  { id: 104, nombre: 'Caja 4', estado: 'ABIERTA', umbral: 4, conteo: 3, grupos: inicializarGrupos(3), atendiendo: false, atendiendoTicks: 0, cicloIndex: 0 },
];

const SimulacionCamarasContext = createContext<SimulacionCamarasContextValue>({ cajas: inicial });

export const useSimulacionCamaras = () => useContext(SimulacionCamarasContext);

export const SimulacionCamarasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cajas, setCajas] = useState<CajaSim[]>(inicial);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setCajas(prev => {
        const actualizadas = prev.map(c => {
        // Clonar grupos
        let grupos = [...c.grupos];
        // Aparición: sólo añadir nuevo grupo (1-3) al final, no eliminar aleatorio
        const maxGruposVisibles = 12; // 3 filas * 4 grupos
        if (c.estado === 'ABIERTA' && grupos.length < maxGruposVisibles && Math.random() < 0.12) {
          const nuevoGrupo = 1 + Math.floor(Math.random() * 3); // 1-3 personas
          grupos.push(nuevoGrupo);
        }

        let atendiendo = c.atendiendo;
        let ticks = c.atendiendoTicks;
        let cicloIndex = c.cicloIndex;
        const cicloDuraciones = [8, 12, 16]; // rápido -> medio -> lento
        const conteoActual = grupos.reduce((a,b)=>a+b,0);
        if (conteoActual > 0 && c.estado === 'ABIERTA') {
          if (!atendiendo) {
            atendiendo = true;
            ticks = cicloDuraciones[cicloIndex];
            cicloIndex = (cicloIndex + 1) % cicloDuraciones.length; // avanzar ciclo para próximo servicio
          } else {
            ticks = Math.max(0, ticks - 1);
            if (ticks === 0) {
              // Retirar sólo el primer grupo (servicio completado)
              if (grupos.length > 0) grupos.shift();
              atendiendo = false;
              const nuevoConteo = grupos.reduce((a,b)=>a+b,0);
              return { ...c, grupos, conteo: nuevoConteo, atendiendo, atendiendoTicks: 0, cicloIndex };
            }
          }
        } else {
          atendiendo = false; ticks = 0;
        }
        const nuevoConteo = grupos.reduce((a,b)=>a+b,0);
          return { ...c, grupos, conteo: nuevoConteo, atendiendo, atendiendoTicks: ticks, cicloIndex };
        });

        // Enviar actualización al backend para reflejar simulación (reemplaza Camaras.js)
        const API_URL = 'http://localhost:3000/api/captura';
        actualizadas.forEach(c => {
          if (c.estado === 'ABIERTA') {
            // POST asíncrono, no bloqueante
            fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_caja: c.id, personas: c.conteo })
            }).catch(() => { /* silenciar errores para no interrumpir simulación */ });
          }
        });
        return actualizadas;
      });
    }, 2500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <SimulacionCamarasContext.Provider value={{ cajas }}>
      {children}
    </SimulacionCamarasContext.Provider>
  );
};
