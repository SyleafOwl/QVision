/**
 * QVISION BACKEND SERVER
 * Tecnologías: Node.js, Express, MongoDB (Mongoose) + SQL endpoint
 * Función: Recibe datos de cámaras, guarda en BD y sirve al Frontend.
 */

const express = require('express');
const mongoose = require('mongoose');
const { runSQL } = require('./sqlEngine');
const cors = require('cors');

const app = express();
const PORT = 3000;

// MIDDLEWARE
app.use(cors()); // Permite que React (Puerto 5173) hable con Node (Puerto 3000)
app.use(express.json());

// 1. CONEXIÓN REAL A MONGODB (Atlas)
mongoose.connect('mongodb+srv://admin:password1234@cluster.vrbepfq.mongodb.net/TablasCajas?retryWrites=true&w=majority&appName=Cluster', {
    serverSelectionTimeoutMS: 5000
}).then(() => console.log('✅ CONEXIÓN EXITOSA A MONGODB'))
    .catch(err => console.error('❌ ERROR CONECTANDO A MONGO:', err));

// 2. DEFINICIÓN DEL MODELO (Schema)
const LogSchema = new mongoose.Schema({
    camera_id: String,
    timestamp: { type: Date, default: Date.now },
    personas: Number,
    estado_caja: String,
    alerta_generada: Boolean
});
const LogModel = mongoose.model('CameraLog', LogSchema);

// 3. VARIABLE EN MEMORIA PARA ESTADO ACTUAL (Para rapidez en la demo)
let estadoActualCajas = [
    { id: 101, nombre: 'Caja 1', estado: 'ABIERTA', conteo: 0, umbral: 7 },
    { id: 102, nombre: 'Caja 2', estado: 'ABIERTA', conteo: 0, umbral: 7 },
    { id: 103, nombre: 'Caja 3', estado: 'ABIERTA', conteo: 0, umbral: 9 },
    { id: 104, nombre: 'Caja 4', estado: 'ABIERTA', conteo: 0, umbral: 6 },
];

let ultimasAlertas = [];

// 4. API ENDPOINTS (Rutas Reales)

// RUTA 1: Recibir datos de la "Cámara" (POST)
// RUTA 1: Recibir datos de la "Cámara" (POST)
// Renombrada de /api/ingesta a /api/captura por claridad
app.post('/api/captura', async (req, res) => {
    const { id_caja, personas } = req.body;
    
    // A. Actualizar estado en memoria
    const cajaIndex = estadoActualCajas.findIndex(c => c.id === id_caja);
    if (cajaIndex !== -1) {
        estadoActualCajas[cajaIndex].conteo = personas;
        // Marcar la caja como ABIERTA si recibe datos (sincronizar con simulación de cámaras)
        estadoActualCajas[cajaIndex].estado = 'ABIERTA';
        
        // B. Lógica de Negocio (Simulando el Trigger de Oracle en Backend)
        const umbral = estadoActualCajas[cajaIndex].umbral;
        const hayAlerta = personas > umbral; // alerta sólo si excede claramente el umbral

        if (hayAlerta) {
            const nuevaAlerta = {
                id: Date.now(),
                mensaje: `SATURACIÓN EN ${estadoActualCajas[cajaIndex].nombre}`,
                hora: new Date().toLocaleTimeString()
            };
            ultimasAlertas.unshift(nuevaAlerta); // Agregar al inicio
            if (ultimasAlertas.length > 10) ultimasAlertas.pop(); // Limitar a 10
        }

        // C. GUARDAR EN MongoDB (Persistencia Real)
        try {
            await LogModel.create({
                camera_id: `CAM-${id_caja}`,
                personas: personas,
                estado_caja: estadoActualCajas[cajaIndex].estado,
                alerta_generada: hayAlerta
            });
            console.log(`📥 RECIBIDO: Caja ${id_caja} tiene ${personas} personas. (Guardado en Mongo)`);
        } catch (e) {
            console.error("Error guardando en Mongo:", e);
        }
    }
    
    res.json({ status: 'ok' });
});

// RUTA 2: Entregar datos al Frontend (GET)
app.get('/api/dashboard', (req, res) => {
    res.json({
        cajas: estadoActualCajas,
        alertas: ultimasAlertas
    });
});

// RUTA 3: Predicción sencilla basada en promedio móvil (EMA)
app.get('/api/prediccion', async (req, res) => {
    try {
        // Obtener últimos 200 logs desde Mongo
        const logs = await LogModel.find({}).sort({ timestamp: -1 }).limit(200).lean();
        const porCaja = new Map();
        logs.forEach(l => {
            const id = Number(String(l.camera_id).replace(/[^0-9]/g, ''));
            if (!porCaja.has(id)) porCaja.set(id, []);
            porCaja.get(id).push(l.personas || 0);
        });
        // EMA por caja y ocupación relativa
        let sumOcupRel = 0;
        let abiertas = 0;
        estadoActualCajas.forEach(c => {
            if (c.estado === 'ABIERTA') {
                abiertas++;
                const serie = porCaja.get(c.id) || [c.conteo];
                const alpha = 0.3; // suavizado
                let ema = serie[0] || 0;
                for (let i = 1; i < serie.length; i++) {
                    ema = alpha * serie[i] + (1 - alpha) * ema;
                }
                const ocupRel = c.umbral > 0 ? (ema / c.umbral) : 0;
                sumOcupRel += ocupRel;
            }
        });
        const ocupProm = abiertas === 0 ? 0 : sumOcupRel / abiertas;
        const porcentaje = Math.min(100, Math.round(ocupProm * 80 + 5));
        const sugerencia = porcentaje > 50 ? 'Abrir nueva caja' : 'Carga estable';
        res.json({ porcentaje, ventanaMinutos: 20, sugerencia });
    } catch (e) {
                console.error('Error calculando predicción:', e);
        // Fallback: usar estado en memoria
        const abiertas = estadoActualCajas.filter(c => c.estado === 'ABIERTA');
        const ocupRel = abiertas.length === 0 ? 0 : abiertas.reduce((acc, c) => acc + (c.conteo / c.umbral), 0) / abiertas.length;
        const porcentaje = Math.min(100, Math.round(ocupRel * 80 + 5));
        const sugerencia = porcentaje > 50 ? 'Abrir nueva caja' : 'Carga estable';
        res.json({ porcentaje, ventanaMinutos: 20, sugerencia, fallback: true });
    }
});

// 5. ENDPOINT SQL -> MONGO (para clase)
function sqlExprToMongo(expr) {
    if (!expr) return {};
    const op = (expr.operator || '').toUpperCase();
    if (expr.type === 'binary_expr') {
        if (op === 'AND' || op === 'OR') {
            const l = sqlExprToMongo(expr.left);
            const r = sqlExprToMongo(expr.right);
            return op === 'AND' ? { $and: [l, r] } : { $or: [l, r] };
        }
        const col = expr.left.column;
        const val = expr.right.value !== undefined ? expr.right.value : expr.right;
        const numVal = typeof val === 'string' && /^\d+$/.test(val) ? Number(val) : val;
        const map = {
            '=': numVal,
            '>': { $gt: numVal },
            '<': { $lt: numVal },
            '>=': { $gte: numVal },
            '<=': { $lte: numVal },
            '!=': { $ne: numVal }
        };
        return { [col]: map[op] };
    }
    return {};
}

app.post('/api/sql', async (req, res) => {
    const { sql } = req.body || {};
    if (!sql || typeof sql !== 'string') return res.status(400).json({ error: 'Falta parámetro sql' });
    try {
        const result = await runSQL(mongoose, sql);
        const payload = Array.isArray(result) ? { rows: result } : result;
        return res.json(payload);
    } catch (e) {
        console.error('Error en /api/sql:', e);
        return res.status(400).json({ error: 'SQL inválido o no soportado', detail: String(e.message || e) });
    }
});

// Ejecutar un archivo .sql del folder Backend/sql
const fs = require('fs');
const path = require('path');
app.post('/api/sql/file', async (req, res) => {
    const { file } = req.body || {};
    if (!file || typeof file !== 'string') return res.status(400).json({ error: 'Falta parámetro file' });
    const base = path.join(__dirname, 'sql');
    const fullPath = path.join(base, file);
    try {
        if (!fullPath.startsWith(base)) return res.status(400).json({ error: 'Ruta inválida' });
        const sql = fs.readFileSync(fullPath, 'utf8');
        const statements = sql.split(/;\s*\n|;\s*$/).map(s => s.trim()).filter(Boolean);
        const results = [];
        for (const stmt of statements) {
            const r = await runSQL(mongoose, stmt);
            results.push(Array.isArray(r) ? { rows: r } : r);
        }
        return res.json({ results });
    } catch (e) {
        console.error('Error en /api/sql/file:', e);
        return res.status(400).json({ error: 'No se pudo ejecutar archivo SQL', detail: String(e.message || e) });
    }
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 SERVIDOR BACKEND CORRIENDO EN http://localhost:${PORT}`);
});