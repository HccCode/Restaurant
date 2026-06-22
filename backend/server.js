import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);
const { Pool } = pg;

// Configuración de WebSockets abierta para toda la red local (LAN)
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

io.on('connection', (socket) => {
  console.log(`⚡ Dispositivo sincronizado en tiempo real: ${socket.id}`);
  socket.on('disconnect', () => console.log(`🔌 Dispositivo desconectado`));
});

app.use(cors()); 
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
  if (err) console.error('❌ Error conectando a PostgreSQL:', err.stack);
  else { console.log('📦 Conectado a PostgreSQL (Base de datos: sabor_io)'); release(); }
});

// ====================================================================
//                       ENDPOINTS DE LA API REST
// ====================================================================

// --- Autenticación (Login) ---
app.post('/api/login', async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const usuarioLimpio = usuario.toLowerCase().trim();
    const { rows } = await pool.query('SELECT id, nombre, rol FROM usuarios WHERE usuario = $1 AND password = $2', [usuarioLimpio, password]);
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas.' });
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: 'Error en el servidor al autenticar' }); }
});

// --- GESTIÓN DE PERSONAL (RBAC) ---
app.get('/api/usuarios', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, usuario, nombre, rol FROM usuarios ORDER BY rol, nombre');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Error al consultar' }); }
});

app.post('/api/usuarios', async (req, res) => {
  const { usuario, password, nombre, rol } = req.body;
  try {
    const { rows } = await pool.query('INSERT INTO usuarios (usuario, password, nombre, rol) VALUES ($1,$2,$3,$4) RETURNING id, usuario, nombre, rol', [usuario.toLowerCase().trim(), password, nombre, rol]);
    io.emit('salon_actualizado');
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'El usuario ya existe' }); }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const check = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [req.params.id]);
    if (check.rows.length > 0 && check.rows[0].rol === 'Gerente' && req.query.rolSolicitante === 'Subgerente') {
      return res.status(403).json({ error: 'Jerarquía Insuficiente: Un Subgerente no puede borrar a un Gerente.' });
    }
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
    io.emit('salon_actualizado');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Error al eliminar' }); }
});

// --- COMANDAS (CONTROL INCREMENTAL) ---
app.get('/api/comandas', async (req, res) => {
  try {
    const query = `
      SELECT o.reserva_id, d.platillo_id as id, d.nombre, d.precio, d.cantidad, d.enviado 
      FROM ordenes o
      JOIN detalles_orden d ON o.id = d.orden_id
    `;
    const { rows } = await pool.query(query);
    const mapa = {};
    rows.forEach(r => {
      if (!mapa[r.reserva_id]) mapa[r.reserva_id] = [];
      mapa[r.reserva_id].push({
        id: r.id, nombre: r.nombre, precio: parseFloat(r.precio), cantidad: r.cantidad, enviado: r.enviado || 0
      });
    });
    res.json(mapa);
  } catch (e) { res.status(500).json({ error: 'Error al consultar' }); }
});

app.post('/api/comandas/:reservaId', async (req, res) => {
  const { reservaId } = req.params; const { platillos } = req.body; const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let rO = await client.query('SELECT id FROM ordenes WHERE reserva_id = $1', [reservaId]);
    let oId = rO.rows.length === 0 ? (await client.query('INSERT INTO ordenes (reserva_id) VALUES ($1) RETURNING id', [reservaId])).rows[0].id : rO.rows[0].id;
    
    await client.query('DELETE FROM detalles_orden WHERE orden_id = $1', [oId]);
    if (platillos && platillos.length > 0) {
      for (const p of platillos) {
        await client.query(
          'INSERT INTO detalles_orden (orden_id, platillo_id, nombre, precio, cantidad, enviado) VALUES ($1, $2, $3, $4, $5, $6)',
          [oId, p.id, p.nombre, p.precio, p.cantidad, p.enviado || 0]
        );
      }
    }
    await client.query('UPDATE ordenes SET total = (SELECT COALESCE(SUM(precio * cantidad), 0) FROM detalles_orden WHERE orden_id = $1) WHERE id = $1', [oId]);
    await client.query('COMMIT'); 
    io.emit('salon_actualizado'); 
    res.json({ status: 'ok' });
  } catch (error) { 
    await client.query('ROLLBACK'); 
    console.error('💥 ERROR REAL EN POST /comandas:', error.message);
    res.status(500).json({ error: error.message }); 
  } finally { 
    client.release(); 
  }
});

// --- MONITOR DE COCINA (KDS) + REDIRECCIÓN REAL-TIME ---
app.get('/api/cocina', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT t.id as ticket_id, t.num_mesa, t.created_at, d.nombre, d.cantidad FROM tickets_cocina t JOIN detalles_ticket_cocina d ON t.id = d.ticket_id WHERE t.estado = 'pendiente' ORDER BY t.created_at ASC");
    const tickets = {};
    rows.forEach(r => {
      if (!tickets[r.ticket_id]) tickets[r.ticket_id] = { id: r.ticket_id, numMesa: r.num_mesa, horaPedido: new Date(r.created_at).getTime(), platillos: [] };
      tickets[r.ticket_id].platillos.push({ nombre: r.nombre, cantidad: r.cantidad });
    });
    res.json(Object.values(tickets));
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/cocina', async (req, res) => {
  const { numMesa, platillos } = req.body; const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resT = await client.query('INSERT INTO tickets_cocina (num_mesa) VALUES ($1) RETURNING id, created_at', [numMesa]);
    for (const p of platillos) await client.query('INSERT INTO detalles_ticket_cocina (ticket_id, nombre, cantidad) VALUES ($1, $2, $3)', [resT.rows[0].id, p.nombre, p.cantidad]);
    await client.query('COMMIT'); 
    io.emit('salon_actualizado');
    res.status(201).json({ id: resT.rows[0].id, numMesa, horaPedido: new Date(resT.rows[0].created_at).getTime(), platillos });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Error' }); } finally { client.release(); }
});

app.put('/api/cocina/:id/completar', async (req, res) => {
  const { id } = req.params; const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resTicket = await client.query("UPDATE tickets_cocina SET estado = 'listo' WHERE id = $1 RETURNING id, num_mesa", [id]);
    if (resTicket.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'No encontrado' }); }
    
    const numMesa = resTicket.rows[0].num_mesa;
    const { rows: platillosDespachados } = await client.query('SELECT nombre, cantidad FROM detalles_ticket_cocina WHERE ticket_id = $1', [id]);
    
    for (const plato of platillosDespachados) {
      const { rows: receta } = await client.query('SELECT inventario_id, cantidad_requerida FROM recetas_platillo WHERE platillo_nombre = $1', [plato.nombre]);
      for (const ingrediente of receta) {
        await client.query('UPDATE inventario SET cantidad = GREATEST(cantidad - $1, 0) WHERE id = $2', [parseFloat(ingrediente.cantidad_requerida) * plato.cantidad, ingrediente.inventario_id]);
      }
    }

    const resCliente = await client.query("SELECT nombre FROM reservaciones WHERE num_mesa = $1 AND estado = 'en-curso'", [numMesa]);
    const nombreCliente = resCliente.rows.length > 0 ? resCliente.rows[0].nombre : 'Mesa en Salón';

    await client.query('COMMIT');

    const payloadNotificacion = {
      id: Date.now(),
      numMesa,
      nombreCliente,
      resumenPlatos: platillosDespachados.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')
    };

    io.emit('salon_actualizado'); 
    io.emit('plato_despachado_kds', payloadNotificacion); // Dispara la alerta centralizada a los meseros

    res.json({ message: 'Plato despachado e inventario descontado', id: resTicket.rows[0].id });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Error' }); } finally { client.release(); }
});

// --- INVENTARIO Y MENÚ ---
app.get('/api/inventario', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM inventario ORDER BY nombre ASC');
    res.json(rows.map(i => ({ ...i, cantidad: parseFloat(i.cantidad), stock_minimo: parseFloat(i.stock_minimo), estado: parseFloat(i.cantidad) <= 0 ? 'agotado' : parseFloat(i.cantidad) <= parseFloat(i.stock_minimo) ? 'alerta' : 'ok' })));
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/inventario', async (req, res) => {
  try {
    const { rows } = await pool.query('INSERT INTO inventario (nombre, cantidad, unidad, stock_minimo, costo_unitario) VALUES ($1, 0, $2, $3, $4) RETURNING *', [req.body.nombre, req.body.unidad, req.body.stock_minimo, req.body.costo_unitario]);
    io.emit('salon_actualizado'); res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/inventario/ajuste', async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE inventario SET cantidad = cantidad + $1 WHERE id = $2 RETURNING *', [req.body.cantidadAgregar, req.body.id]);
    io.emit('salon_actualizado'); res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/mermas', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO mermas (inventario_id, cantidad, motivo) VALUES ($1, $2, $3)', [req.body.inventario_id, req.body.cantidad, req.body.motivo]);
    await client.query('UPDATE inventario SET cantidad = GREATEST(cantidad - $1, 0) WHERE id = $2', [req.body.cantidad, req.body.inventario_id]);
    await client.query('COMMIT'); io.emit('salon_actualizado'); res.json({ ok: true });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Error' }); } finally { client.release(); }
});

app.get('/api/mermas', async (req, res) => {
  try { const { rows } = await pool.query('SELECT m.*, i.nombre as ingrediente, i.unidad FROM mermas m JOIN inventario i ON m.inventario_id = i.id ORDER BY m.fecha DESC'); res.json(rows); } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/menu', async (req, res) => {
  try { const { rows } = await pool.query('SELECT * FROM menu_restaurante ORDER BY categoria, nombre'); res.json(rows); } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/menu', async (req, res) => {
  try { const { rows } = await pool.query('INSERT INTO menu_restaurante (nombre, precio, categoria, imagen) VALUES ($1,$2,$3,$4) RETURNING *', [req.body.nombre, req.body.precio, req.body.categoria, req.body.imagen]); io.emit('salon_actualizado'); res.status(201).json(rows[0]); } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.delete('/api/menu/:id', async (req, res) => {
  try { await pool.query('DELETE FROM menu_restaurante WHERE id = $1', [req.params.id]); io.emit('salon_actualizado'); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// --- API: RESERVACIONES ---
app.get('/api/reservaciones', async (req, res) => {
  try { const { rows } = await pool.query('SELECT * FROM reservaciones ORDER BY hora ASC'); res.json(rows.map(r => ({ ...r, numMesa: r.num_mesa }))); } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/reservaciones', async (req, res) => {
  try { const { rows } = await pool.query("INSERT INTO reservaciones (nombre, telefono, fecha, hora, personas, tipo, etiqueta, color, estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'nuevas') RETURNING *", [req.body.nombre, req.body.telefono, req.body.fecha, req.body.hora, req.body.personas, req.body.tipo, req.body.etiqueta, req.body.color]); io.emit('salon_actualizado'); res.status(201).json({ ...rows[0], numMesa: rows[0].num_mesa }); } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.put('/api/reservaciones/:id/estado', async (req, res) => {
  const { id } = req.params; const { estado, numMesa } = req.body;
  try {
    let q, v;
    if (estado === 'nuevas' || estado === 'confirmadas') { q = 'UPDATE reservaciones SET estado = $1, num_mesa = NULL WHERE id = $2 RETURNING *'; v = [estado, id]; }
    else if (numMesa) { q = 'UPDATE reservaciones SET estado = $1, num_mesa = $2 WHERE id = $3 RETURNING *'; v = [estado, numMesa, id]; }
    else { q = 'UPDATE reservaciones SET estado = $1 WHERE id = $2 RETURNING *'; v = [estado, id]; }
    const { rows } = await pool.query(q, v); io.emit('salon_actualizado'); res.json({ ...rows[0], numMesa: rows[0].num_mesa });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.delete('/api/reservaciones/:id', async (req, res) => {
  try { await pool.query('DELETE FROM reservaciones WHERE id = $1', [req.params.id]); io.emit('salon_actualizado'); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: 'Error' }); }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Cerebro Full-Stack con Sockets en puerto ${PORT}`));