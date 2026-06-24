import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

app.use(cors());
app.use(express.json());

// CONFIGURACIÓN POSTGRESQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'restaurante_pos', 
  password: process.env.DB_PASSWORD || 'admin',       
  port: process.env.DB_PORT || 5432,
});

async function inicializarBaseDeDatos() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion_restaurante (
        id INTEGER PRIMARY KEY DEFAULT 1,
        nombre_negocio VARCHAR(150) DEFAULT 'Sabor.io Restaurante',
        rfc VARCHAR(20) DEFAULT 'XAXX010101000',
        direccion VARCHAR(255) DEFAULT 'Av. De los Héroes 123, Centro Cívico',
        telefono VARCHAR(50) DEFAULT '686 555 1234',
        mensaje_ticket VARCHAR(255) DEFAULT '¡Gracias por su preferencia!'
      );
      INSERT INTO configuracion_restaurante (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        pin VARCHAR(4) NOT NULL CHECK (length(pin) = 4),
        rol VARCHAR(50) NOT NULL DEFAULT 'Mesero'
      );

      CREATE TABLE IF NOT EXISTS menu_restaurante (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        categoria VARCHAR(50) NOT NULL DEFAULT 'Platos Fuertes',
        precio NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        imagen TEXT DEFAULT '',
        descripcion TEXT DEFAULT '',
        orden INTEGER DEFAULT 0
      );
      ALTER TABLE menu_restaurante ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;

      CREATE TABLE IF NOT EXISTS mesas (
        id SERIAL PRIMARY KEY,
        numero VARCHAR(20) UNIQUE NOT NULL,
        zona VARCHAR(50) NOT NULL DEFAULT 'General',
        capacidad INTEGER DEFAULT 4
      );

      CREATE TABLE IF NOT EXISTS inventario (
        id SERIAL PRIMARY KEY,
        item VARCHAR(150),
        cantidad NUMERIC(10, 2) DEFAULT 0,
        unidad VARCHAR(50) DEFAULT 'pza',
        minimo NUMERIC(10, 2) DEFAULT 5
      );

      CREATE TABLE IF NOT EXISTS mermas (
        id SERIAL PRIMARY KEY,
        item VARCHAR(150) NOT NULL,
        cantidad NUMERIC(10, 2) DEFAULT 0,
        motivo TEXT DEFAULT '',
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reservaciones (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        fecha TIMESTAMP NOT NULL,
        hora VARCHAR(10) NOT NULL,
        personas INTEGER NOT NULL,
        estado VARCHAR(50) DEFAULT 'pendientes',
        telefono VARCHAR(50) DEFAULT '',
        tipo VARCHAR(50) DEFAULT 'General',
        etiqueta VARCHAR(50) DEFAULT '',
        color VARCHAR(100) DEFAULT 'from-blue-400 to-indigo-500',
        num_mesa VARCHAR(20) DEFAULT NULL
      );
      ALTER TABLE reservaciones ADD COLUMN IF NOT EXISTS num_mesa VARCHAR(20);

      CREATE TABLE IF NOT EXISTS historial_cortes (
        id SERIAL PRIMARY KEY,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usuario VARCHAR(100),
        datos JSONB
      );
    `);

    const checkMesas = await pool.query("SELECT * FROM mesas LIMIT 1");
    if (checkMesas.rows.length === 0) {
      await pool.query(`
        INSERT INTO mesas (numero, zona, capacidad) VALUES 
        ('T-1', 'Terraza', 4), ('T-2', 'Terraza', 4), ('T-3', 'Terraza', 6),
        ('V-1', 'VIP', 2), ('V-2', 'VIP', 4),
        ('B-1', 'Barra', 1), ('B-2', 'Barra', 1), ('B-3', 'Barra', 1),
        ('M-1', 'General', 4), ('M-2', 'General', 4), ('M-3', 'General', 4)
      `);
    }

    console.log('✅ PostgreSQL: Estructuras blindadas.');
  } catch (err) { console.error('❌ Error SQL:', err); }
}
inicializarBaseDeDatos();

let comandasActivas = {};
let pedidosCocina = [];

// =========================================================================
// ENDPOINTS
// =========================================================================
app.post('/api/login', async (req, res) => {
  const { pin } = req.body;
  if (!pin || pin.length !== 4) return res.status(400).json({ error: 'PIN requerido' });
  try {
    const result = await pool.query('SELECT id, nombre, rol FROM usuarios WHERE pin = $1', [pin]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'PIN incorrecto' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/usuarios', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM usuarios ORDER BY id ASC'); res.json(result.rows); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/usuarios', async (req, res) => {
  try { const result = await pool.query('INSERT INTO usuarios (nombre, pin, rol) VALUES ($1,$2,$3) RETURNING *', [req.body.nombre, req.body.pin, req.body.rol]); res.status(201).json(result.rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/usuarios/:id', async (req, res) => {
  try { const result = await pool.query('UPDATE usuarios SET nombre=$1, pin=$2, rol=$3 WHERE id=$4 RETURNING *', [req.body.nombre, req.body.pin, req.body.rol, req.params.id]); res.json(result.rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/usuarios/:id', async (req, res) => {
  try { await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/configuracion', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM configuracion_restaurante WHERE id = 1'); res.json(result.rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/configuracion', async (req, res) => {
  try { const result = await pool.query('UPDATE configuracion_restaurante SET nombre_negocio=$1, rfc=$2, direccion=$3, telefono=$4, mensaje_ticket=$5 WHERE id=1 RETURNING *', [req.body.nombre_negocio, req.body.rfc, req.body.direccion, req.body.telefono, req.body.mensaje_ticket]); io.emit('salon_actualizado'); res.json(result.rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});

// CONTROL DE MESAS
app.get('/api/mesas', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM mesas ORDER BY zona DESC, numero ASC'); res.json(result.rows); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/mesas', async (req, res) => {
  try { const result = await pool.query('INSERT INTO mesas (numero, zona, capacidad) VALUES ($1, $2, $3) RETURNING *', [req.body.numero.toUpperCase().trim(), req.body.zona, req.body.capacidad || 4]); io.emit('salon_actualizado'); res.status(201).json(result.rows[0]); } catch (err) { res.status(500).json({ error: 'Mesa duplicada.' }); }
});
app.put('/api/mesas/:id', async (req, res) => {
  try { const result = await pool.query('UPDATE mesas SET numero=$1, zona=$2, capacidad=$3 WHERE id=$4 RETURNING *', [req.body.numero.toUpperCase().trim(), req.body.zona, req.body.capacidad, req.params.id]); io.emit('salon_actualizado'); res.json(result.rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/mesas/:id', async (req, res) => {
  try { await pool.query('DELETE FROM mesas WHERE id = $1', [req.params.id]); io.emit('salon_actualizado'); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// MENÚ
app.get('/api/menu', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM menu_restaurante ORDER BY orden ASC, id ASC'); res.json(result.rows); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/menu', async (req, res) => {
  try { const result = await pool.query('INSERT INTO menu_restaurante (nombre, categoria, precio, imagen, descripcion, orden) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [req.body.nombre, req.body.categoria || 'Platos Fuertes', req.body.precio || 0, req.body.imagen || '', req.body.descripcion || '', req.body.orden || 0]); io.emit('salon_actualizado'); res.status(201).json(result.rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/menu/:id', async (req, res) => {
  try { const result = await pool.query('UPDATE menu_restaurante SET nombre=$1, categoria=$2, precio=$3, imagen=$4, descripcion=$5 WHERE id=$6 RETURNING *', [req.body.nombre, req.body.categoria, req.body.precio, req.body.imagen, req.body.descripcion, req.params.id]); io.emit('salon_actualizado'); res.json(result.rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/menu/:id', async (req, res) => {
  try { await pool.query('DELETE FROM menu_restaurante WHERE id = $1', [req.params.id]); io.emit('salon_actualizado'); res.json({ message: 'Borrado' }); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/menu/reordenar', async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Lote equivocado' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) await client.query('UPDATE menu_restaurante SET orden = $1 WHERE id = $2', [item.orden, item.id]);
    await client.query('COMMIT'); res.json({ success: true });
  } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Fallo' }); } finally { client.release(); }
});

// INVENTARIO
app.get('/api/inventario', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM inventario ORDER BY id ASC'); res.json(result.rows); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/inventario', async (req, res) => {
  try { const result = await pool.query('INSERT INTO inventario (item, cantidad, unidad, minimo) VALUES ($1,$2,$3,$4) RETURNING *', [req.body.item, req.body.cantidad || 0, req.body.unidad || 'pza', req.body.minimo || 5]); res.status(201).json(result.rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/inventario/:id', async (req, res) => {
  try { const result = await pool.query('UPDATE inventario SET cantidad = $1 WHERE id = $2 RETURNING *', [req.body.cantidad, req.params.id]); res.json(result.rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/inventario/:id', async (req, res) => {
  try { await pool.query('DELETE FROM inventario WHERE id = $1', [req.params.id]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/mermas', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM mermas ORDER BY fecha DESC'); res.json(result.rows); } catch (err) { res.status(500).json({ error: err.message }); }
});

// RESERVACIONES Y TABLERO
app.get('/api/reservaciones', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM reservaciones ORDER BY fecha ASC, hora ASC'); res.json(result.rows.map(r => ({ ...r, numMesa: r.num_mesa }))); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reservaciones', async (req, res) => {
  try { 
    const result = await pool.query(
      'INSERT INTO reservaciones (nombre, fecha, hora, personas, telefono, tipo, etiqueta, color) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', 
      [req.body.nombre, req.body.fecha, req.body.hora, req.body.personas, req.body.telefono || '', req.body.tipo || 'General', req.body.etiqueta || '', req.body.color || 'from-blue-400 to-indigo-500']
    ); 
    io.emit('salon_actualizado'); 
    res.status(201).json(result.rows[0]); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 👇 AQUÍ ESTÁ EL ENDPOINT REPARADO DE EDICIÓN COMPLETA (PUT) 👇
app.put('/api/reservaciones/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha, hora, personas, telefono, tipo, etiqueta, color, numMesa } = req.body;
  
  try {
    const query = `
      UPDATE reservaciones 
      SET 
        nombre = COALESCE($1, nombre),
        fecha = COALESCE($2, fecha),
        hora = COALESCE($3, hora),
        personas = COALESCE($4, personas),
        telefono = COALESCE($5, telefono),
        tipo = COALESCE($6, tipo),
        etiqueta = COALESCE($7, etiqueta),
        color = COALESCE($8, color),
        num_mesa = COALESCE($9, num_mesa)
      WHERE id = $10 
      RETURNING *
    `;
    const result = await pool.query(query, [nombre, fecha, hora, personas, telefono, tipo, etiqueta, color, numMesa, id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    
    io.emit('salon_actualizado'); 
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/reservaciones/:id/estado', async (req, res) => {
  try { const result = await pool.query('UPDATE reservaciones SET estado=$1, num_mesa=$2 WHERE id=$3 RETURNING *', [req.body.estado, req.body.numMesa || null, req.params.id]); io.emit('salon_actualizado'); res.json(result.rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/reservaciones/:id', async (req, res) => {
  try { await pool.query('DELETE FROM reservaciones WHERE id=$1', [req.params.id]); delete comandasActivas[req.params.id]; io.emit('salon_actualizado'); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/comandas', (req, res) => res.json(comandasActivas));
app.post('/api/comandas/:idReserva', (req, res) => { comandasActivas[req.params.idReserva] = req.body.platillos || []; io.emit('salon_actualizado'); res.json({ success: true }); });

app.get('/api/cocina', (req, res) => res.json(pedidosCocina.filter(p => p.estado === 'pendiente')));
app.post('/api/cocina', (req, res) => { const nuevo = { id: Date.now(), numMesa: req.body.numMesa, platillos: req.body.platillos, estado: 'pendiente', hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }; pedidosCocina.push(nuevo); io.emit('salon_actualizado'); res.status(201).json(nuevo); });
app.put('/api/cocina/:id/completar', (req, res) => { const p = pedidosCocina.find(x => x.id === parseInt(req.params.id)); if (p) { p.estado = 'completado'; io.emit('plato_despachado_kds', { ...p, horaCompletado: new Date().toLocaleTimeString() }); io.emit('salon_actualizado'); res.json(p); } else res.status(404).json({ error: 'No encontrado' }); });

app.get('/api/cortes/preview', (req, res) => { let t = 0; Object.values(comandasActivas).forEach(c => c.forEach(i => t += (parseFloat(i.precio)||0)*(parseInt(i.cantidad)||0))); res.json({ totalVentas: t, propinasEstimadas: t * 0.10, mesasAtendidas: Object.keys(comandasActivas).length }); });
app.get('/api/cortes', async (req, res) => { try { const result = await pool.query('SELECT * FROM historial_cortes ORDER BY fecha DESC'); res.json(result.rows); } catch (err) { res.status(500).json({ error: err.message }); } });
app.post('/api/cortes', async (req, res) => { try { const result = await pool.query('INSERT INTO historial_cortes (usuario, datos) VALUES ($1,$2) RETURNING *', [req.body.usuarioCierre || 'Admin', req.body.datosCorte]); comandasActivas = {}; pedidosCocina = []; io.emit('salon_actualizado'); res.json({ success: true, corte: result.rows[0] }); } catch (err) { res.status(500).json({ error: err.message }); } });

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Motor POS encendido en el puerto ${PORT}`));