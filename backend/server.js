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
        mensaje_ticket VARCHAR(255) DEFAULT '¡Gracias por su preferencia!',
        iva NUMERIC(5, 2) DEFAULT 16.00
      );
      ALTER TABLE configuracion_restaurante ADD COLUMN IF NOT EXISTS iva NUMERIC(5, 2) DEFAULT 16.00;

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

      CREATE SEQUENCE IF NOT EXISTS folio_ventas_seq START 1000;

      CREATE TABLE IF NOT EXISTS historial_ventas (
        id SERIAL PRIMARY KEY,
        folio VARCHAR(20) UNIQUE NOT NULL,
        num_mesa VARCHAR(20),
        mesero VARCHAR(100),
        cliente VARCHAR(150) DEFAULT 'General',
        personas INTEGER DEFAULT 1,
        items_consumidos JSONB,
        subtotal NUMERIC(10, 2) DEFAULT 0,
        iva NUMERIC(10, 2) DEFAULT 0,
        total NUMERIC(10, 2) DEFAULT 0,
        corte_aplicado BOOLEAN DEFAULT false,
        fecha_cobro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE historial_ventas ADD COLUMN IF NOT EXISTS cliente VARCHAR(150) DEFAULT 'General';
      ALTER TABLE historial_ventas ADD COLUMN IF NOT EXISTS personas INTEGER DEFAULT 1;
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

    console.log('✅ PostgreSQL: Estructuras blindadas listas.');
  } catch (err) { console.error('❌ Error SQL:', err); }
}
inicializarBaseDeDatos();

let comandasActivas = {};
let pedidosCocina = [];

// =========================================================================
// ENDPOINTS GENERALES
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
  const { nombre_negocio, rfc, direccion, telefono, mensaje_ticket, iva } = req.body;
  try { 
    const result = await pool.query('UPDATE configuracion_restaurante SET nombre_negocio=$1, rfc=$2, direccion=$3, telefono=$4, mensaje_ticket=$5, iva=$6 WHERE id=1 RETURNING *', [nombre_negocio, rfc, direccion, telefono, mensaje_ticket, iva || 16.00]); 
    io.emit('salon_actualizado');   
    res.json(result.rows[0]); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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

app.post('/api/inventario/ajuste', async (req, res) => {
  const { id, item, cantidad, nueva_cantidad, stock } = req.body;
  const cantFinal = cantidad ?? nueva_cantidad ?? stock ?? 0;
  try {
    if (id) {
      const r = await pool.query('UPDATE inventario SET cantidad = $1 WHERE id = $2 RETURNING *', [cantFinal, id]);
      return res.json(r.rows[0] || { success: true });
    } else if (item) {
      const r = await pool.query('UPDATE inventario SET cantidad = $1 WHERE item = $2 RETURNING *', [cantFinal, item]);
      return res.json(r.rows[0] || { success: true });
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/mermas', async (req, res) => {
  try { 
    const result = await pool.query("SELECT * FROM mermas ORDER BY id DESC LIMIT 100"); 
    const mermasLimpio = result.rows.map(m => ({
      ...m,
      fecha_formateada: m.fecha ? new Date(m.fecha).toLocaleDateString('es-MX') : 'Reciente'
    }));
    res.json(mermasLimpio); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/mermas', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'INSERT INTO mermas (item, cantidad, motivo) VALUES ($1, $2, $3) RETURNING *', 
      [req.body.item, req.body.cantidad || 0, req.body.motivo || 'Desperdicio general']
    );
    await client.query(
      'UPDATE inventario SET cantidad = cantidad - $1 WHERE item = $2',
      [req.body.cantidad || 0, req.body.item]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) { 
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message }); 
  } finally {
    client.release();
  }
});

app.delete('/api/mermas/:id', async (req, res) => {
  try { 
    await pool.query('DELETE FROM mermas WHERE id = $1', [req.params.id]); 
    res.json({ success: true }); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reservaciones', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM reservaciones ORDER BY fecha ASC, hora ASC'); res.json(result.rows.map(r => ({ ...r, numMesa: r.num_mesa }))); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/reservaciones', async (req, res) => {
  try { 
    const result = await pool.query(
      'INSERT INTO reservaciones (nombre, fecha, hora, personas, telefono, tipo, etiqueta, color) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', 
      [req.body.nombre, req.body.fecha, req.body.hora, req.body.personas, req.body.telefono || '', req.body.tipo || 'General', req.body.etiqueta || '', req.body.color || 'from-blue-400 to-indigo-500']
    ); 
    io.emit('salon_actualizado'); res.status(201).json(result.rows[0]); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/reservaciones/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha, hora, personas, telefono, tipo, etiqueta, color, numMesa } = req.body;
  try {
    const query = `UPDATE reservaciones SET nombre=COALESCE($1,nombre), fecha=COALESCE($2,fecha), hora=COALESCE($3,hora), personas=COALESCE($4,personas), telefono=COALESCE($5,telefono), tipo=COALESCE($6,tipo), etiqueta=COALESCE($7,etiqueta), color=COALESCE($8,color), num_mesa=COALESCE($9,num_mesa) WHERE id=$10 RETURNING *`;
    const result = await pool.query(query, [nombre, fecha, hora, personas, telefono, tipo, etiqueta, color, numMesa, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    io.emit('salon_actualizado'); res.json(result.rows[0]);
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


// =========================================================================
// 🔥 ENDPOINTS BANCARIOS Y DE AUDITORÍA
// =========================================================================

app.post('/api/cobrar/:idReserva', async (req, res) => {
  const { idReserva } = req.params;
  const { mesero, platillos, subtotal, iva, total, mesaNum, cliente, personas } = req.body;

  // =========================================================================
  // 🔥 REGLA DE BLINDAJE ANTIFRAUDE: COCINA DEBE CONFIRMAR DESPACHO 🔥
  // =========================================================================
  const mesaTarget = String(mesaNum || '').trim().toLowerCase();

  // 1. ¿La cocina tiene órdenes en estatus 'pendiente' para esta mesa?
  const cocinaOcupada = pedidosCocina.some(p => 
    p.estado === 'pendiente' && 
    String(p.numMesa || '').trim().toLowerCase() === mesaTarget
  );

  if (cocinaOcupada) {
    return res.status(400).json({ 
      error: `⛔ COBRO BLOQUEADO: La cocina aún está preparando platillos para la Mesa ${mesaNum}.` 
    });
  }

  // 2. ¿El mesero agregó platillos a la cuenta y olvidó presionar "Marchar a Cocina"?
  const cuentaMesa = comandasActivas[idReserva] || [];
  const itemsSinMarchar = cuentaMesa.some(item => (item.cantidad || 0) > (item.enviado || 0));

  if (itemsSinMarchar) {
    return res.status(400).json({ 
      error: `⛔ COBRO BLOQUEADO: Tienes platillos en la cuenta que no has enviado a marchar a cocina.` 
    });
  }
  // =========================================================================

  const client = await pool.connect();
  try {
    await client.query('BEGIN'); 
    const folioRes = await client.query(`SELECT NEXTVAL('folio_ventas_seq') as num`);
    const folio = `V-${folioRes.rows[0].num}`;

    await client.query(`
      INSERT INTO historial_ventas (folio, num_mesa, mesero, cliente, personas, items_consumidos, subtotal, iva, total) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [folio, mesaNum || 'Barra', mesero || 'Mesero', cliente || 'General', parseInt(personas) || 1, JSON.stringify(platillos || []), subtotal || 0, iva || 0, total || 0]);

    await client.query('UPDATE reservaciones SET estado = $1 WHERE id = $2', ['finalizadas', idReserva]);
    delete comandasActivas[idReserva];

    await client.query('COMMIT'); 
    io.emit('salon_actualizado'); 
    res.json({ success: true, folio });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/cortes/preview', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(num_mesa, 'Barra') AS "numMesa", 
        COALESCE(cliente, 'General') AS cliente, 
        COALESCE(personas, 1) AS personas, 
        total,
        items_consumidos
      FROM historial_ventas 
      WHERE DATE(fecha_cobro) = CURRENT_DATE 
        AND corte_aplicado = false
    `);
    
    const now = new Date();
    const folioTurno = `TURNO-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    const granTotal = result.rows.reduce((acc, row) => acc + parseFloat(row.total || 0), 0);

    res.json({
      folioTurno,
      fecha: now.toLocaleDateString('es-MX'),
      hora: now.toLocaleTimeString('es-MX'),
      ventas: result.rows,
      granTotal
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cortes', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE historial_ventas SET corte_aplicado = true WHERE corte_aplicado = false`);
    const corteSQL = await client.query(`INSERT INTO historial_cortes (usuario, datos) VALUES ($1,$2) RETURNING *`, [req.body.usuarioCierre || 'Admin', req.body.datosCorte]);
    await client.query(`UPDATE reservaciones SET estado = 'finalizadas' WHERE estado = 'en-curso';`);
    comandasActivas = {}; 
    pedidosCocina = [];
    await client.query('COMMIT');
    io.emit('salon_actualizado'); 
    res.json({ success: true, corte: corteSQL.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get('/api/cortes', async (req, res) => {
  const { folio, fecha } = req.query;
  let query = 'SELECT * FROM historial_cortes WHERE 1=1';
  const params = [];
  
  if (fecha) {
    params.push(fecha);
    query += ` AND DATE(fecha) = $${params.length}`;
  }
  query += ' ORDER BY fecha DESC';

  try {
    const result = await pool.query(query, params);
    
    const cortesFormateados = result.rows.map(row => {
      const d = row.datos || {};
      const totalVentas = parseFloat(d.granTotal || d.totalVentas || 0);
      const ventasGuardadas = d.ventas || [];
      const mesas = parseInt(ventasGuardadas.length || d.mesasAtendidas || 0);
      const paxEstimados = ventasGuardadas.reduce((a, b) => a + parseInt(b.personas || 1), 0);
      
      return {
        id: row.id,
        folio: `CZ-${String(row.id).padStart(4, '0')}`, 
        fecha: row.fecha,
        usuario_cierre: row.usuario || 'Admin',
        mesas_cobradas: mesas,
        total_personas: paxEstimados,
        total_ventas: totalVentas,
        ticket_promedio: mesas > 0 ? (totalVentas / mesas) : 0,
        promedio_por_persona: paxEstimados > 0 ? (totalVentas / paxEstimados) : 0,
        subtotal: totalVentas / 1.16,
        iva: totalVentas - (totalVentas / 1.16),
        ventas_por_categoria: [], 
        productos_vendidos: [],
        ventas_detalle: ventasGuardadas 
      };
    });

    let dataFinal = cortesFormateados;
    if (folio) {
      dataFinal = cortesFormateados.filter(c => c.folio.toLowerCase().includes(folio.toLowerCase()));
    }

    res.json(dataFinal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/finanzas/historial-ventas', async (req, res) => {
  const { folio, fecha } = req.query;
  let query = `
    SELECT id, folio, num_mesa, mesero, cliente, personas, subtotal, iva, total, corte_aplicado, 
           TO_CHAR(fecha_cobro, 'DD/MM/YYYY HH12:MI AM') as hora_cobro,
           items_consumidos
    FROM historial_ventas
    WHERE 1=1
  `;
  const params = [];

  if (folio) {
    params.push(`%${folio}%`);
    query += ` AND folio ILIKE $${params.length}`;
  }

  if (fecha) {
    params.push(fecha);
    query += ` AND DATE(fecha_cobro) = $${params.length}`;
  }

  query += ` ORDER BY id DESC LIMIT 100;`;

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Motor POS encendido en el puerto ${PORT}`));