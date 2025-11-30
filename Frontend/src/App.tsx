import { useState, useEffect, useCallback } from 'react';
import { Camera, Users, AlertTriangle, Activity, CheckCircle, Clock, Database } from 'lucide-react';
import { BarraNavegacion } from './components/BarraNavegacion';
import TarjetaKPI from './components/TarjetaKPI';
import TarjetaCaja from './components/TarjetaCaja';
import PanelAlertas from './components/PanelAlertas';
import TarjetaPrediccion from './components/TarjetaPrediccion';
import SimuladorCamaras from './components/SimuladorCamaras';
import type { TemaColor, Caja, Alerta, PrediccionIA } from './types/qvision';

// Componente raíz del Dashboard QVision
export default function App() {
	// Estado UI y conexión
	const [pestana, setPestana] = useState<'dashboard' | 'datos' | 'simulacion'>('dashboard');
	const [tema, setTema] = useState<TemaColor>(() => (localStorage.getItem('qvision_tema') as TemaColor) || 'claro');
	const [isConnected, setIsConnected] = useState<boolean>(false);

	// Datos provenientes del backend
	const [cajas, setCajas] = useState<Caja[]>([]);
	const [alertas, setAlertas] = useState<Alerta[]>([]);

	// Derivados
	const totalPersonas = cajas.reduce((acc, c) => acc + c.personas, 0);
	const cajasAbiertas = cajas.filter(c => c.estado === 'ABIERTA').length;
	const prediccion: PrediccionIA = (() => {
		const abiertas = cajas.filter(c => c.estado === 'ABIERTA');
		const ocupacionRelativa = abiertas.length === 0 ? 0 : abiertas.reduce((acc, c) => acc + c.personas / c.umbral, 0) / abiertas.length;
		const porcentaje = Math.min(100, Math.round(ocupacionRelativa * 70 + 10));
		const sugerencia = porcentaje > 45 ? 'Abrir nueva caja' : 'Carga estable';
		return { porcentaje, ventanaMinutos: 20, sugerencia };
	})();

	// Persistir tema
	useEffect(() => { localStorage.setItem('qvision_tema', tema); }, [tema]);
	const toggleTema = useCallback(() => setTema(t => (t === 'claro' ? 'oscuro' : 'claro')), []);

	// Polling a backend
	useEffect(() => {
		const API_URL = 'http://localhost:3000/api/dashboard';
		let cancelado = false;
		async function fetchData() {
			try {
				const res = await fetch(API_URL, { headers: { 'Accept': 'application/json' } });
				if (!res.ok) throw new Error('HTTP ' + res.status);
				const json = await res.json();
				if (cancelado) return;
				// Mapear estructura del backend (nombre, conteo) a la interfaz del frontend (numero, personas)
				const rawCajas = Array.isArray(json.cajas) ? json.cajas : [];
				const cajasMapeadas: Caja[] = rawCajas.map((c: any) => ({
					id: c.id,
					numero: c.nombre ?? `Caja ${c.id}`,
					estado: c.estado ?? 'CERRADA',
					personas: typeof c.conteo === 'number' ? c.conteo : 0,
					umbral: typeof c.umbral === 'number' ? c.umbral : 5
				}));
				// Mapear alertas, asignando tipo por mensaje si no viene
				const rawAlertas = Array.isArray(json.alertas) ? json.alertas : [];
				const alertasMapeadas: Alerta[] = rawAlertas.map((a: any) => ({
					id: a.id ?? Date.now(),
					mensaje: a.mensaje ?? 'Alerta',
					hora: a.hora ?? new Date().toLocaleTimeString(),
					tipo: /SATURACIÓN|SOBRECARGA|EXCEDIDA/i.test(a.mensaje || '') ? 'danger' : 'neutral'
				}));
				setCajas(cajasMapeadas);
				setAlertas(alertasMapeadas);
				setIsConnected(true);
				// Debug opcional en consola
				// console.log('✅ Datos actualizados', { cajasMapeadas, alertasMapeadas });
			} catch (e) {
				if (!cancelado) {
					setIsConnected(false);
					// console.warn('⚠️ Error fetch dashboard:', e);
				}
			}
		}
		fetchData();
		const id = setInterval(fetchData, 1000);
		return () => { cancelado = true; clearInterval(id); };
	}, []);

	// Vista Dashboard Operativo
	const DashboardView = (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<TarjetaKPI icono={<Users size={20} />} etiqueta="Personas en Cola" valor={totalPersonas} />
				<TarjetaKPI icono={<CheckCircle size={20} />} etiqueta="Cajas Abiertas" valor={`${cajasAbiertas}/4`} />
				<TarjetaKPI icono={<AlertTriangle size={20} />} etiqueta="Alertas Activas" valor={alertas.length} />
				<TarjetaKPI icono={<Clock size={20} />} etiqueta="Tiempo Espera Prom." valor={'~4 min'} />
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-4">
					<h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 flex items-center gap-2">
						<Camera className="w-5 h-5" /> Monitoreo en Tiempo Real - Tottus Jockey Plaza
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{cajas.map(c => <TarjetaCaja key={c.id} caja={c} />)}
					</div>
				</div>
				<div className="space-y-4">
					<h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 flex items-center gap-2">
						<Activity className="w-5 h-5" /> Centro de Control
					</h3>
					<TarjetaPrediccion prediccion={prediccion} />
					<PanelAlertas alertas={alertas} />
				</div>
			</div>
		</div>
	);

	// Vista Datos (Tabla simulada)
	const DatosView = (
		<div className="space-y-6">
			<h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 flex items-center gap-2">
				<Database className="w-5 h-5" /> Registros de Base de Datos
			</h3>
			<div className="panel-bg rounded-lg shadow-suave p-4 border border-gray-200 dark:border-gray-700">
				<h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Tabla: CAJA</h4>
				<div className="overflow-x-auto">
					<table className="min-w-full text-xs">
						<thead>
							<tr className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
								<th className="p-2 text-left">CAJA_ID</th>
								<th className="p-2 text-left">NUMERO</th>
								<th className="p-2 text-left">ESTADO</th>
								<th className="p-2 text-left">UMBRAL</th>
								<th className="p-2 text-left">PERSONAS</th>
							</tr>
						</thead>
						<tbody>
							{cajas.map(c => (
								<tr key={c.id} className="border-t dark:border-gray-700">
									<td className="p-2">{c.id}</td>
									<td className="p-2">{c.numero}</td>
									<td className="p-2">{c.estado}</td>
									<td className="p-2">{c.umbral}</td>
									<td className="p-2">{c.personas}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			<div className="p-4 bg-gray-100 dark:bg-gray-800 rounded text-center text-gray-500 dark:text-gray-400 text-xs">
				Mostrando datos simulados desde hook de simulación.
			</div>
		</div>
	);

	// Vista Simulación de Cámaras
	const SimulacionView = (
		<div className="space-y-6">
			<SimuladorCamaras />
		</div>
	);

	return (
		<div className="min-h-screen font-sans bg-[var(--color-fondo)] text-[var(--color-texto)]">
			<BarraNavegacion tema={tema} onToggleTema={toggleTema} />
			<main className="max-w-7xl mx-auto px-4 py-6">
				<div className="mb-6 flex space-x-6 border-b border-gray-200 dark:border-gray-700 text-sm">
					<button
						onClick={() => setPestana('dashboard')}
						className={`pb-2 -mb-px px-1 transition ${pestana === 'dashboard' ? 'border-b-2 border-esmeralda-600 text-esmeralda-700 dark:text-esmeralda-300 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
					>Dashboard Operativo</button>
					<button
						onClick={() => setPestana('datos')}
						className={`pb-2 -mb-px px-1 transition ${pestana === 'datos' ? 'border-b-2 border-esmeralda-600 text-esmeralda-700 dark:text-esmeralda-300 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
					>Tabla de Datos</button>
					<button
						onClick={() => setPestana('simulacion')}
						className={`pb-2 -mb-px px-1 transition ${pestana === 'simulacion' ? 'border-b-2 border-esmeralda-600 text-esmeralda-700 dark:text-esmeralda-300 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
					>Cámaras (Simuladas)</button>
				</div>
				<div className="flex items-center justify-between mb-4">
					<div className="text-xs flex items-center gap-2">
						<span className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
						<span className={isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>
							{isConnected ? 'Backend Conectado' : 'Backend Desconectado'}
						</span>
					</div>
				</div>
				{pestana === 'dashboard' ? DashboardView : pestana === 'datos' ? DatosView : SimulacionView}
			</main>
			<footer className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs">QVision</footer>
		</div>
	);
}
