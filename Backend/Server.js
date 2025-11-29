/**
 * QVISION BACKEND SERVER
 * Tecnologías: Node.js, Express, MongoDB (Mongoose)
 * Función: Recibe datos de cámaras, guarda en BD y sirve al Frontend.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3000;

// MIDDLEWARE
app.use(cors()); // Permite que React (Puerto 5173) hable con Node (Puerto 3000)
app.use(express.json());

// 1. CONEXIÓN REAL A MONGODB
// Asegúrate de tener MongoDB Compass abierto y conectado a localhost:27017
mongoose.connect('mongodb://localhost:27017/qvision_real', {
    serverSelectionTimeoutMS: 5000
}).then(() => console.log('✅ CONEXIÓN EXITOSA A MONGODB'))
  .catch(err => console.error('❌ ERROR CONECTANDO A MONGO:', err));

// 2. DEFINICIÓN DEL MODELO (Schema)
// Así se guardarán los datos en Mongo
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
    { id: 101, nombre: 'Caja 01', estado: 'ABIERTA', conteo: 0, umbral: 5 },
    { id: 102, nombre: 'Caja 02', estado: 'ABIERTA', conteo: 0, umbral: 5 },
    { id: 103, nombre: 'Caja 03', estado: 'CERRADA', conteo: 0, umbral: 8 },
    { id: 104, nombre: 'Caja 04', estado: 'ABIERTA', conteo: 0, umbral: 4 },
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
        
        // B. Lógica de Negocio (Simulando el Trigger de Oracle en Backend)
        const umbral = estadoActualCajas[cajaIndex].umbral;
        const hayAlerta = personas >= umbral;

        if (hayAlerta) {
            const nuevaAlerta = {
                id: Date.now(),
                mensaje: `SATURACIÓN EN ${estadoActualCajas[cajaIndex].nombre}`,
                hora: new Date().toLocaleTimeString()
            };
            ultimasAlertas.unshift(nuevaAlerta); // Agregar al inicio
            if (ultimasAlertas.length > 10) ultimasAlertas.pop(); // Limitar a 10
        }

        // C. GUARDAR EN MONGODB (Persistencia Real)
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

// INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 SERVIDOR BACKEND CORRIENDO EN http://localhost:${PORT}`);
});