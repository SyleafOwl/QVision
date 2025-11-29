export interface Caja {
  id: number;
  numero: string;
  estado: 'ABIERTA' | 'CERRADA';
  personas: number;
  umbral: number;
}

export interface Alerta {
  id: number;
  mensaje: string;
  hora: string; // formato legible
  tipo: 'danger' | 'warning' | 'success' | 'neutral';
}

export interface EstadoSimulacion {
  cajas: Caja[];
  alertas: Alerta[];
}

export interface PrediccionIA {
  porcentaje: number; // incremento esperado
  ventanaMinutos: number;
  sugerencia: string;
}

export type TemaColor = 'claro' | 'oscuro';