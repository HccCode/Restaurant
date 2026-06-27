import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TableroReservaciones from './components/TableroReservaciones';
import ModalReserva from './components/ModalReserva';
import Calendario from './components/Calendario';
import PuntoDeVenta from './components/PuntoDeVenta';
import Login from './components/Login';
import ModalAsignarMesa from './components/ModalAsignarMesa';
import Cocina from './components/Cocina';
import ModalCorteZ from './components/ModalCorteZ';
import Inventario from './components/Inventario';
import GestionUsuarios from './components/GestionUsuarios';
import ConfigRestaurante from './components/ConfigRestaurante';
import GestionMenu from './components/GestionMenu';
import ControlMesas from './components/ControlMesas';

const socket = io(`http://${window.location.hostname}:3000`);

export default function App() {
  const [usuario, setUsuario] = useState(null); 
  const [vistaActiva, setVistaActiva] = useState('dashboard'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservaEditando, setReservaEditando] = useState(null);
  const [reservaParaAsignarMesa, setReservaParaAsignarMesa] = useState(null);
  const [datosCorteZ, setDatosCorteZ] = useState(null);
  const [socketConectado, setSocketConectado] = useState(false);
  const [alertaSistema, setAlertaSistema] = useState(null);

  // 🔥 MOTOR DE FECHA LOCAL MEXICALI (Erradica el brinco de las 5:00 PM en UTC-7) 🔥
  const obtenerFechaLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const hoy = obtenerFechaLocal();
  const [fechaParaModal, setFechaParaModal] = useState(hoy);
  
  const [menuGlobal, setMenuGlobal] = useState([]); 
  const [mesasGlobal, setMesasGlobal] = useState([]); 
  const [comandas, setComandas] = useState({});
  const [pedidosCocina, setPedidosCocina] = useState([]);
  const [notificacionesCocina, setNotificacionesCocina] = useState([]);
  const [reservacionesRaw, setReservacionesRaw] = useState([]);
  
  const [configEmpresa, setConfigEmpresa] = useState({ iva: 16 });

  const BASE_URL = `http://${window.location.hostname}:3000/api`;

  const sincronizarTodoElSalon = async () => {
    try {
      const [resRes, resCom, resCoc, resMen, resMes, resConf] = await Promise.all([
        fetch(`${BASE_URL}/reservaciones`), 
        fetch(`${BASE_URL}/comandas`), 
        fetch(`${BASE_URL}/cocina`), 
        fetch(`${BASE_URL}/menu`),
        fetch(`${BASE_URL}/mesas`),
        fetch(`${BASE_URL}/configuracion`)
      ]);
      
      if (resRes.ok) setReservacionesRaw(await resRes.json());
      if (resCom.ok) setComandas(await resCom.json());
      if (resCoc.ok) setPedidosCocina(await resCoc.json());
      if (resMen.ok) setMenuGlobal(await resMen.json());
      if (resMes.ok) setMesasGlobal(await resMes.json());
      if (resConf.ok) setConfigEmpresa(await resConf.json());
    } catch (e) { console.error('Error de red:', e); }
  };

  useEffect(() => {
    sincronizarTodoElSalon();
    socket.on('connect', () => setSocketConectado(true));
    socket.on('disconnect', () => setSocketConectado(false));
    socket.on('salon_actualizado', () => sincronizarTodoElSalon());
    socket.on('plato_despachado_kds', p => setNotificacionesCocina(prev => [p, ...prev]));
    return () => socket.off();
  }, []);

  const limpiarFecha = (str) => {
    if (!str) return '';
    const match = String(str).match(/(\d{4})[-/]?(\d{1,2})[-/]?(\d{1,2})/);
    if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    return String(str).split('T')[0].trim();
  };

  const limpiarEstado = (est) => {
    let e = String(est || 'pendientes').toLowerCase().trim();
    if (e === 'pendiente' || e === 'nuevas' || e === 'nueva') e = 'pendientes';
    if (e === 'en curso') e = 'en-curso';
    return e;
  };

  const reservacionesLimpias = reservacionesRaw.map(r => ({
    ...r, fechaNorm: limpiarFecha(r.fecha), estado: limpiarEstado(r.estado)
  }));

  const reservasDeHoy = reservacionesLimpias.filter(r => r.fechaNorm === hoy);

  const mesasOcupadasActualmente = reservacionesLimpias
    .filter(r => r.estado === 'en-curso' && r.numMesa)
    .map(r => ({ num: String(r.numMesa).trim(), nombre: r.nombre }));

  // =========================================================================
  // 🔥 ENRUTADOR INTELIGENTE DE VISTA INICIAL POR ROL 🔥
  // =========================================================================
  const obtenerVistaInicial = (rolUsuario) => {
    const rol = String(rolUsuario || '').toLowerCase().trim();

    if (rol.includes('cocin'))   return 'cocina';       // Cocinero / Chef -> Cocina
    if (rol.includes('host'))    return 'tablero';      // Hostess -> Mapa de Reservas
    if (rol.includes('meser'))   return 'pos';          // Mesero -> Punto de Venta
    if (rol.includes('cajer'))   return 'pos';          // Cajero -> Punto de Venta
    if (rol.includes('almacen')) return 'inventario';   // Almacenista -> Bodega

    return 'dashboard'; // Gerente, Dueño o Admin -> Finanzas
  };

  const handleLogin = (u) => { 
    setUsuario(u); 
    setVistaActiva(obtenerVistaInicial(u.rol)); 
  };
  // =========================================================================

  const handleActualizarComandas = (nuevoEstado) => {
    setComandas(prev => {
      const nuevoObjeto = typeof nuevoEstado === 'function' ? nuevoEstado(prev) : nuevoEstado;
      Object.keys(nuevoObjeto).forEach(resId => {
        fetch(`${BASE_URL}/comandas/${resId}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platillos: nuevoObjeto[resId] || [] })
        }).catch(e => console.error(e));
      });
      return nuevoObjeto;
    });
  };

  const handleMandarCocina = async (mesaObj, platillosEnCuenta) => {
    const items = platillosEnCuenta.filter(p => p.cantidad > (p.enviado || 0)).map(p => ({
      nombre: p.nombre, cantidad: p.cantidad - (p.enviado || 0), comentario: p.comentario || ''
    }));
    if (items.length === 0) return setAlertaSistema({ titulo: 'Aviso', mensaje: 'No hay platillos nuevos por marchar.', icono: '⚠️', color: 'text-amber-500' });
    try {
      const res = await fetch(`${BASE_URL}/cocina`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numMesa: mesaObj.numMesa, platillos: items })
      });
      if (res.ok) {
        const nuevosPlatillos = platillosEnCuenta.map(p => ({ ...p, enviado: p.cantidad }));
        handleActualizarComandas(prev => ({ ...prev, [mesaObj.id]: nuevosPlatillos }));
        setAlertaSistema({ titulo: '¡Enviada!', mensaje: 'Orden marchada a cocina.', icono: '🔥', color: 'text-orange-500' });
      }
    } catch (e) { console.error(e); }
  };

  const handleCompletarPedidoCocina = async (id) => {
    try { await fetch(`${BASE_URL}/cocina/${id}/completar`, { method: 'PUT' }); } catch (e) {}
  };

  const handleDespacharPlatoSalon = (idNotificacion) => {
    setNotificacionesCocina(prev => prev.filter(n => n.id !== idNotificacion));
  };

  const handleCalcularCorteZ = async () => {
    try {
      const res = await fetch(`${BASE_URL}/cortes/preview`);
      if (res.ok) setDatosCorteZ(await res.json());
    } catch (e) { alert(e.message); }
  };

  const handleConfirmarCierre = async () => {
    try {
      const res = await fetch(`${BASE_URL}/cortes`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuarioCierre: usuario?.nombre || 'Admin', datosCorte: datosCorteZ }) 
      });
      if (res.ok) { 
        setComandas({}); setPedidosCocina([]); setNotificacionesCocina([]); setDatosCorteZ(null); 
        setAlertaSistema({ titulo: 'Turno Sellado', mensaje: 'El Corte Z se guardó. Ve a la pestaña "Cortes Z (PDF)" para descargarlo.', icono: '🏛️', color: 'text-indigo-400' }); 
      }
    } catch (e) { alert(e); }
  };

  const handleGuardarReserva = async (datosReserva) => {
    const esEdicion = !!reservaEditando;
    const url = esEdicion ? `${BASE_URL}/reservaciones/${reservaEditando.id}` : `${BASE_URL}/reservaciones`;
    try {
      const res = await fetch(url, { method: esEdicion ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosReserva) });
      if (res.ok) { sincronizarTodoElSalon(); setIsModalOpen(false); setReservaEditando(null); }
    } catch (e) { alert('Error al guardar reserva: ' + e.message); }
  };

  const handleConfirmarAsignacionMesa = async (idReserva, numMesa) => {
    try {
      const res = await fetch(`${BASE_URL}/reservaciones/${idReserva}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'en-curso', numMesa }) });
      if (res.ok) { sincronizarTodoElSalon(); setReservaParaAsignarMesa(null); }
    } catch (e) { alert(e.message); }
  };

  const handleMoverReserva = async (id, nuevoEstado, numMesaForzado = null) => {
    if (nuevoEstado === 'en-curso' && !numMesaForzado) { setReservaParaAsignarMesa(reservacionesLimpias.find(r => r.id === id)); return; }
    try {
      const res = await fetch(`${BASE_URL}/reservaciones/${id}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: nuevoEstado, numMesa: numMesaForzado }) });
      if (res.ok) { sincronizarTodoElSalon(); }
    } catch (e) { console.error('Error al mover reserva:', e); }
  };

  const handleEliminarReserva = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    try { await fetch(`${BASE_URL}/reservaciones/${id}`, { method: 'DELETE' }); sincronizarTodoElSalon(); } catch (e) { console.error(e); }
  };

  if (!usuario) return <Login onLogin={handleLogin} />;

  const renderizarVista = () => {
    switch (vistaActiva) {
      case "dashboard": 
        return <Dashboard reservaciones={reservasDeHoy} onIniciarCorteZ={handleCalcularCorteZ} />;
      
      case "pos": 
        return <PuntoDeVenta 
                 menu={menuGlobal} 
                 reservaciones={reservasDeHoy.filter(r=>r.estado==='en-curso')} 
                 comandas={comandas} 
                 setComandas={handleActualizarComandas} 
                 usuario={usuario} 
                 
                 // =====================================================================
                 // 🔥 ADUANA VISUAL: ABORTA EL COBRO SI LA COCINA SIGUE TRABAJANDO 🔥
                 // =====================================================================
                 onCobrar={async (idReservaPagada) => {
                   const reserva = reservacionesLimpias.find(r => r.id === idReservaPagada);
                   const mesaTarget = String(reserva?.numMesa || '').trim().toLowerCase();

                   const cocinaTrabajando = pedidosCocina.some(p => 
                     String(p.numMesa || '').trim().toLowerCase() === mesaTarget && p.estado === 'pendiente'
                   );

                   if (cocinaTrabajando) {
                     return setAlertaSistema({
                       titulo: 'Mesa en Proceso',
                       mensaje: `La Mesa ${reserva?.numMesa} tiene platillos preparándose en cocina. No puedes cobrar hasta que el chef los marque como terminados.`,
                       icono: '⏳',
                       color: 'text-rose-500'
                     });
                   }

                   try {
                     await fetch(`${BASE_URL}/reservaciones/${idReservaPagada}`, { method: 'DELETE' });
                   } catch (e) { console.error('No se pudo limpiar la reserva:', e); }
                   sincronizarTodoElSalon();
                 }} 
                 // =====================================================================
                 
                 onEnviarCocina={handleMandarCocina}
                 notificacionesCocina={notificacionesCocina} 
                 onDespacharPlato={handleDespacharPlatoSalon}
                 config={configEmpresa}
               />;
      
      case "tablero": 
        return <TableroReservaciones mesas={mesasGlobal} reservaciones={reservasDeHoy} onNuevaReserva={() => { setFechaParaModal(hoy); setReservaEditando(null); setIsModalOpen(true); }} onEditarReserva={(res) => { setReservaEditando(res); setIsModalOpen(true); }} onAsignarMesa={(res) => setReservaParaAsignarMesa(res)} onEliminarReserva={handleEliminarReserva} onMover={handleMoverReserva} usuario={usuario} />;
      case "calendario": 
        return <Calendario reservaciones={reservacionesLimpias} fechaActual={fechaParaModal} setFechaActual={setFechaParaModal} onAbrirModal={(fecha) => { setFechaParaModal(fecha); setReservaEditando(null); setIsModalOpen(true); }} onEditar={(res) => { setReservaEditando(res); setIsModalOpen(true); }} onEliminar={handleEliminarReserva} />;
      case "gestion_menu": return <GestionMenu menu={menuGlobal} onActualizar={() => sincronizarTodoElSalon()} />;
      case "control_mesas": return <ControlMesas mesas={mesasGlobal} onActualizar={() => sincronizarTodoElSalon()} />;
      case "inventario": return <Inventario usuario={usuario} />;
      case "usuarios": return <GestionUsuarios usuarioLogueado={usuario} />;
      case "config_negocio": return <ConfigRestaurante />;
      case "cocina": return <Cocina pedidos={pedidosCocina} onCompletar={handleCompletarPedidoCocina} />;
      default: return <div className="p-12 text-center text-slate-500">Módulo en construcción...</div>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#070b16] text-slate-200 font-sans overflow-hidden select-none">
      {alertaSistema && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className={`text-6xl mb-4 ${alertaSistema.color}`}>{alertaSistema.icono}</div>
            <h2 className="text-2xl font-black text-white mb-2">{alertaSistema.titulo}</h2>
            <p className="text-sm text-slate-400 mb-8">{alertaSistema.mensaje}</p>
            <button onClick={() => setAlertaSistema(null)} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-widest cursor-pointer">Aceptar</button>
          </div>
        </div>
      )}

      <Sidebar vistaActual={vistaActiva} setVistaActual={setVistaActiva} usuario={usuario} socketConectado={socketConectado} onLogout={() => setUsuario(null)} />
      
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto bg-[#070b16]">
        {renderizarVista()}
      </main>
      
      <ModalCorteZ isOpen={datosCorteZ !== null} onClose={() => setDatosCorteZ(null)} onConfirm={handleConfirmarCierre} datos={datosCorteZ} />
      <ModalReserva isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setReservaEditando(null); }} onSave={handleGuardarReserva} reserva={reservaEditando} fechaInicial={fechaParaModal} />
      {reservaParaAsignarMesa && <ModalAsignarMesa isOpen={true} onClose={() => setReservaParaAsignarMesa(null)} reserva={reservaParaAsignarMesa} mesas={mesasGlobal} mesasOcupadas={mesasOcupadasActualmente} onConfirm={(numMesa) => handleConfirmarAsignacionMesa(reservaParaAsignarMesa.id, numMesa)} />}
    </div>
  );
}