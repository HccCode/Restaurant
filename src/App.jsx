import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Componentes
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
import HistorialCortes from './components/HistorialCortes';
import ConfigRestaurante from './components/ConfigRestaurante';
import GestionMenu from './components/GestionMenu';
import ControlMesas from './components/ControlMesas';

const socket = io(`http://${window.location.hostname}:3000`);

const VistaEnConstruccion = ({ titulo, icono }) => (
  <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 select-none p-6">
    <span className="text-6xl mb-4 animate-bounce">{icono}</span>
    <h2 className="text-2xl font-black tracking-wide text-slate-300">{titulo}</h2>
    <p className="text-xs mt-2 text-indigo-400 font-mono bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-800/30">Módulo en desarrollo</p>
  </div>
);

export default function App() {
  const [usuario, setUsuario] = useState(null); 
  const [vistaActiva, setVistaActiva] = useState('dashboard'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservaEditando, setReservaEditando] = useState(null);
  const [reservaParaAsignarMesa, setReservaParaAsignarMesa] = useState(null);
  const [datosCorteZ, setDatosCorteZ] = useState(null);
  const [socketConectado, setSocketConectado] = useState(false);
  const [alertaSistema, setAlertaSistema] = useState(null);

  // =========================================================================
  // ⚡ BLINDAJE ABSOLUTO DE FECHAS (Corte de texto sin conversión de horas)
  // =========================================================================
  const formatearAFechaLocal = (input) => {
    if (!input) return '';
    
    // CASO 1: Viene de PostgreSQL ("2026-06-23T00:00:00.000Z")
    // Lo cortamos por la T y extraemos los 10 dígitos. Ignoramos a Londres y a Mexicali.
    if (typeof input === 'string') {
      return input.split('T')[0].substring(0, 10);
    }
    
    // CASO 2: Es el objeto local del navegador (new Date() del día de hoy)
    if (input instanceof Date) {
      const yyyy = input.getFullYear();
      const mm = String(input.getMonth() + 1).padStart(2, '0');
      const dd = String(input.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    // Caso de respaldo
    return String(input).split('T')[0].substring(0, 10);
  };

  // Esta variable siempre tendrá "2026-06-23" (o el día que sea hoy localmente)
  const hoy = formatearAFechaLocal(new Date());
  
  const [fechaParaModal, setFechaParaModal] = useState(hoy);
  const [menuGlobal, setMenuGlobal] = useState([]); 
  const [comandas, setComandas] = useState({});
  const [pedidosCocina, setPedidosCocina] = useState([]);
  const [notificacionesCocina, setNotificacionesCocina] = useState([]);
  const [reservaciones, setReservaciones] = useState([]);

  const BASE_URL = `http://${window.location.hostname}:3000/api`;

  const sincronizarTodoElSalon = async () => {
    try {
      const [resRes, resCom, resCoc, resMen] = await Promise.all([
        fetch(`${BASE_URL}/reservaciones`),
        fetch(`${BASE_URL}/comandas`),
        fetch(`${BASE_URL}/cocina`),
        fetch(`${BASE_URL}/menu`)
      ]);

      if (resRes.ok) setReservaciones(await resRes.json());
      if (resCom.ok) setComandas(await resCom.json());
      if (resCoc.ok) setPedidosCocina(await resCoc.json());
      if (resMen.ok) setMenuGlobal(await resMen.json());
    } catch (error) { console.error('Error de red:', error); }
  };

  useEffect(() => {
    sincronizarTodoElSalon();
    socket.on('connect', () => setSocketConectado(true));
    socket.on('disconnect', () => setSocketConectado(false));
    socket.on('salon_actualizado', () => sincronizarTodoElSalon());
    socket.on('plato_despachado_kds', (nuevaOrden) => setNotificacionesCocina(prev => [nuevaOrden, ...prev]));

    return () => {
      socket.off('connect'); socket.off('disconnect'); 
      socket.off('salon_actualizado'); socket.off('plato_despachado_kds');
    };
  }, []);

  const handleActualizarItemsComanda = (nuevoEstadoOFuncion) => {
    const baseComandas = typeof nuevoEstadoOFuncion === 'function' ? nuevoEstadoOFuncion(comandas) : nuevoEstadoOFuncion;
    const nuevasLimpia = {};
    
    Object.keys(baseComandas).forEach(resId => {
      nuevasLimpia[resId] = (baseComandas[resId] || []).map(p => ({
        ...p, enviado: p.cantidad < (p.enviado || 0) ? p.cantidad : (p.enviado || 0)
      }));
    });

    setComandas(nuevasLimpia);
    Object.keys(nuevasLimpia).forEach(resId => {
      if (JSON.stringify(comandas[resId] || []) !== JSON.stringify(nuevasLimpia[resId] || [])) {
        fetch(`${BASE_URL}/comandas/${resId}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platillos: nuevasLimpia[resId] })
        }).catch(err => console.error(err));
      }
    });
  };

  const mesasOcupadasActualmente = reservaciones
    .filter(r => r.estado === 'en-curso' && r.numMesa)
    .map(r => ({ num: String(r.numMesa).trim(), nombre: r.nombre }));

  const handleLogin = (u) => {
    setUsuario(u);
    if (u.rol === 'Mesero') setVistaActiva('pos');
    else if (u.rol === 'Hostess') setVistaActiva('tablero');
    else if (u.rol === 'Cocinero') setVistaActiva('cocina');
    else setVistaActiva('dashboard'); 
  };

  const abrirModalParaFecha = (f = hoy) => { setReservaEditando(null); setFechaParaModal(f); setIsModalOpen(true); };
  const abrirModalParaEditar = (r) => { setReservaEditando(r); setIsModalOpen(true); };

  const handleGuardarReserva = async (datosNuevos) => {
    if (reservaEditando) {
      try {
        const res = await fetch(`${BASE_URL}/reservaciones/${reservaEditando.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosNuevos)
        });
        if (res.ok) {
          const reservaActualizada = await res.json();
          setReservaciones(reservaciones.map(r => r.id === reservaEditando.id ? reservaActualizada : r));
        }
      } catch (e) { console.error(e); }
    } else {
      const colores = ['from-blue-400 to-indigo-500', 'from-emerald-400 to-teal-500', 'from-rose-400 to-orange-400', 'from-pink-500 to-rose-500'];
      const payload = { ...datosNuevos, color: colores[Math.floor(Math.random() * colores.length)] };
      
      try {
        const res = await fetch(`${BASE_URL}/reservaciones`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (res.ok) {
          const nuevaReserva = await res.json(); 
          setReservaciones(prev => [nuevaReserva, ...prev]); 
        } else {
          const errorData = await res.json();
          alert(`Error DB:\n${errorData.error}`);
        }
      } catch (e) { alert(`Fallo de red: ${e.message}`); }
    }
    setIsModalOpen(false); setReservaEditando(null);
  };

  const handleMoverReserva = async (id, nuevoEstado, numMesaForzado = null) => {
    if (nuevoEstado === 'en-curso' && !numMesaForzado) {
      setReservaParaAsignarMesa(reservaciones.find(r => r.id === id)); return; 
    }
    try {
      const res = await fetch(`${BASE_URL}/reservaciones/${id}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: nuevoEstado, numMesa: numMesaForzado })
      });
      if (res.ok) {
        const reservaModificada = await res.json();
        setReservaciones(reservaciones.map(r => r.id === id ? reservaModificada : r));
      }
    } catch (e) { console.error(e); }
  };

  const handleConfirmarAsignacionMesa = (num) => {
    if (reservaParaAsignarMesa) {
      handleMoverReserva(reservaParaAsignarMesa.id, 'en-curso', num);
      setReservaParaAsignarMesa(null); 
    }
  };

  const handleEliminarReserva = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/reservaciones/${id}`, { method: 'DELETE' });
      if (res.ok) setReservaciones(reservaciones.filter(r => r.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleCobrarMesa = (id) => { handleMoverReserva(id, 'finalizadas'); handleActualizarItemsComanda(id, []); };

  const handleMandarCocina = async (mesaObj, platillosEnCuenta) => {
    const items = platillosEnCuenta.filter(p => !p.whitespace && p.cantidad > (p.enviado || 0)).map(p => ({
      nombre: p.nombre, cantidad: p.cantidad - (p.enviado || 0), comentario: p.comentario || ''
    }));

    if (items.length === 0) return setAlertaSistema({ titulo: 'Aviso', mensaje: 'Comanda mandada previamente.', icono: '⚠️', color: 'text-amber-500' });
    
    try {
      const res = await fetch(`${BASE_URL}/cocina`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numMesa: mesaObj.numMesa, platillos: items })
      });
      if (res.ok) {
        const nuevoPedidoKDS = await res.json();
        setPedidosCocina(prev => [...prev, nuevoPedidoKDS]);
        handleActualizarItemsComanda(prev => ({ ...prev, [mesaObj.id]: platillosEnCuenta.map(p => ({ ...p, enviado: p.cantidad })) }));
        setAlertaSistema({ titulo: '¡Enviada!', mensaje: 'Marchando a cocina.', icono: '🔥', color: 'text-orange-500' });
      }
    } catch (e) { console.error(e); }
  };

  const handleCompletarPedidoCocina = async (id) => { try { await fetch(`${BASE_URL}/cocina/${id}/completar`, { method: 'PUT' }); } catch (e) {} };
  const handleDespacharPlatoSalón = (id) => setNotificacionesCocina(notificacionesCocina.filter(n => n.id !== id));

  const handleCalcularCorteZ = async () => {
    try { const res = await fetch(`${BASE_URL}/cortes/preview`); if (res.ok) setDatosCorteZ(await res.json()); } catch (e) {}
  };

  const handleConfirmarCierre = async () => {
    try {
      const res = await fetch(`${BASE_URL}/cortes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuarioCierre: usuario.nombre, datosCorte: datosCorteZ })
      });
      if (res.ok) {
        setComandas({}); setPedidosCocina([]); setNotificacionesCocina([]); setDatosCorteZ(null);
        setAlertaSistema({ titulo: 'Turno Cerrado', mensaje: 'Reporte guardado en SQL exitosamente.', icono: '💰', color: 'text-emerald-400' });
      }
    } catch (e) {}
  };

  // 1. OBTENEMOS LAS RESERVAS DEL DÍA (El bug vivía aquí)
  const reservasDeHoy = reservaciones.filter(r => formatearAFechaLocal(r.fecha) === hoy);

  if (!usuario) return <Login onLogin={handleLogin} />;

  const renderizarVista = () => {
    switch (vistaActiva) {
      case "pos": return <PuntoDeVenta menu={menuGlobal} reservaciones={reservasDeHoy} comandas={comandas} setComandas={handleActualizarItemsComanda} onCobrar={handleCobrarMesa} onEnviarCocina={handleMandarCocina} notificacionesCocina={notificacionesCocina} onDespacharPlato={handleDespacharPlatoSalón} />;
      case "dashboard": return <Dashboard reservaciones={reservasDeHoy} onIniciarCorteZ={handleCalcularCorteZ} />;
      case "historial_cortes": return <HistorialCortes />;
      case "config_negocio": return <ConfigRestaurante />;
      case "menu_edit": return <GestionMenu />;
      case "calendario": return <><header className="h-20 border-b border-slate-800/50 flex items-center px-8 shrink-0"><h1 className="text-2xl font-extrabold text-white">Calendario</h1></header><Calendario reservaciones={reservaciones} onAbrirModal={abrirModalParaFecha} onEditar={abrirModalParaEditar} onEliminar={handleEliminarReserva} /></>;
      case "tablero": {
        // 2. CALCULAMOS LAS FUTURAS TAMBIÉN (Cero conflictos horarios)
        const futuras = reservaciones.filter(r => formatearAFechaLocal(r.fecha) > hoy && r.estado !== 'finalizadas').length;
        return (
          <>
            <header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-8 shrink-0 bg-[#0a0f1d]/40 backdrop-blur-md">
              <div className="flex items-center gap-3"><h1 className="text-2xl font-extrabold text-white">Salón</h1><span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full font-mono font-bold">{hoy}</span></div>
              <div className="flex items-center gap-3">
                {futuras > 0 && <button onClick={() => setVistaActiva('calendario')} className="bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl font-bold">📅 {futuras} reserva(s) futuras</button>}
                <button onClick={() => abrirModalParaFecha(hoy)} className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl text-sm font-bold text-white">+ Reserva</button>
              </div>
            </header>
            <TableroReservaciones reservaciones={reservasDeHoy} onMover={handleMoverReserva} onEliminar={handleEliminarReserva} onEditar={abrirModalParaEditar} usuario={usuario} />
          </>
        );
      }
      case "cocina": return <><header className="h-20 border-b border-rose-900/50 flex items-center justify-between px-8 bg-slate-950"><h1 className="text-2xl font-extrabold text-white">KDS • Cocina</h1><div className="text-sm font-bold text-slate-400 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">{pedidosCocina.length} Pendientes</div></header><Cocina pedidos={pedidosCocina} onCompletar={handleCompletarPedidoCocina} /></>;
      case "inventario": return <Inventario usuario={usuario} />;
      case "usuarios": return <GestionUsuarios usuarioLogueado={usuario} />;
      case "control_mesas": return <ControlMesas />;
      default: return <VistaEnConstruccion titulo="Módulo Pendiente" icono="🚧" />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#070b16] text-slate-200 font-sans overflow-hidden">
      {alertaSistema && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className={`text-6xl mb-4 ${alertaSistema.color}`}>{alertaSistema.icono}</div>
            <h2 className="text-2xl font-black text-white mb-2">{alertaSistema.titulo}</h2>
            <p className="text-sm text-slate-400 mb-8">{alertaSistema.mensaje}</p>
            <button onClick={() => setAlertaSistema(null)} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-widest cursor-pointer">Aceptar</button>
          </div>
        </div>
      )}

      <Sidebar vistaActual={vistaActiva} setVistaActual={setVistaActiva} usuario={usuario} socketConectado={socketConectado} onLogout={() => setUsuario(null)} />
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto bg-[#070b16]">{renderizarVista()}</main>

      <ModalReserva isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setReservaEditando(null); }} onSave={handleGuardarReserva} fechaInicial={fechaParaModal} reservaAEditar={reservaEditando} />
      <ModalAsignarMesa isOpen={reservaParaAsignarMesa !== null} onClose={() => setReservaParaAsignarMesa(null)} onConfirm={handleConfirmarAsignacionMesa} reserva={reservaParaAsignarMesa} mesasOcupadas={mesasOcupadasActualmente} />
      <ModalCorteZ isOpen={datosCorteZ !== null} onClose={() => setDatosCorteZ(null)} onConfirm={handleConfirmarCierre} datos={datosCorteZ} />
    </div>
  );
}