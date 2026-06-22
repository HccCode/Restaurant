import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
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

const socket = io(`http://${window.location.hostname}:3000`);

export default function App() {
  const [usuario, setUsuario] = useState(null); 
  const [vistaActiva, setVistaActiva] = useState('dashboard'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservaEditando, setReservaEditando] = useState(null);
  const [reservaParaAsignarMesa, setReservaParaAsignarMesa] = useState(null);
  const [datosCorteZ, setDatosCorteZ] = useState(null);
  const [socketConectado, setSocketConectado] = useState(false);

  const hoy = new Date().toISOString().split('T')[0];
  const [fechaParaModal, setFechaParaModal] = useState(hoy);
  
  const [comandas, setComandas] = useState({});
  const [pedidosCocina, setPedidosCocina] = useState([]);
  const [notificacionesCocina, setNotificacionesCocina] = useState([]);
  const [reservaciones, setReservaciones] = useState([]);

  const BASE_URL = `http://${window.location.hostname}:3000/api`;

  const sincronizarTodoElSalon = async () => {
    try {
      const resReserva = await fetch(`${BASE_URL}/reservaciones`);
      if (resReserva.ok) setReservaciones(await resReserva.json());
      
      const resComandas = await fetch(`${BASE_URL}/comandas`);
      if (resComandas.ok) setComandas(await resComandas.json());

      const resCocina = await fetch(`${BASE_URL}/cocina`);
      if (resCocina.ok) setPedidosCocina(await resCocina.json());
    } catch (error) { console.error('❌ Error sincronizando:', error); }
  };

  useEffect(() => {
    sincronizarTodoElSalon();

    socket.on('connect', () => setSocketConectado(true));
    socket.on('disconnect', () => setSocketConectado(false));

    socket.on('salon_actualizado', () => {
      sincronizarTodoElSalon();
    });

    // Receptor real-time de alertas flotantes de platillos listos
    socket.on('plato_despachado_kds', (nuevaOrdenLista) => {
      setNotificacionesCocina(prev => [nuevaOrdenLista, ...prev]);
    });

    return () => {
      socket.off('connect'); socket.off('disconnect'); 
      socket.off('salon_actualizado'); socket.off('plato_despachado_kds');
    };
  }, []);

  const handleActualizarItemsComanda = (nuevoEstadoOFuncion) => {
    const baseComandas = typeof nuevoEstadoOFuncion === 'function' ? nuevoEstadoOFuncion(comandas) : nuevoEstadoOFuncion;
    const nuevasComandasLimpia = {};
    
    Object.keys(baseComandas).forEach(reservaId => {
      nuevasComandasLimpia[reservaId] = (baseComandas[reservaId] || []).map(p => ({
        ...p,
        enviado: p.cantidad < (p.enviado || 0) ? p.cantidad : (p.enviado || 0)
      }));
    });

    setComandas(nuevasComandasLimpia);

    Object.keys(nuevasComandasLimpia).forEach(reservaId => {
      const platillosViejos = JSON.stringify(comandas[reservaId] || []);
      const platillosNuevos = JSON.stringify(nuevasComandasLimpia[reservaId] || []);

      if (platillosViejos !== platillosNuevos) {
        fetch(`${BASE_URL}/comandas/${reservaId}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platillos: nuevasComandasLimpia[reservaId] })
        }).catch(err => console.error(err));
      }
    });
  };

  const mesasOcupadasActualmente = reservaciones
    .filter(r => r.estado === 'en-curso' && r.numMesa)
    .map(r => ({ num: String(r.numMesa).trim(), nombre: r.nombre }));

  const handleLogin = (datosUsuario) => {
    setUsuario(datosUsuario);
    if (datosUsuario.rol === 'Mesero') setVistaActiva('pos');
    else if (datosUsuario.rol === 'Hostess') setVistaActiva('tablero');
    else if (datosUsuario.rol === 'Cocinero') setVistaActiva('cocina');
    else setVistaActiva('dashboard'); 
  };

  const handleLogout = () => setUsuario(null);
  const abrirModalParaFecha = (fechaSeleccionada = hoy) => { setReservaEditando(null); setFechaParaModal(fechaSeleccionada); setIsModalOpen(true); };
  const abrirModalParaEditar = (reserva) => { setReservaEditando(reserva); setIsModalOpen(true); };

  const handleGuardarReserva = async (datosNuevos) => {
    if (reservaEditando) {
      setReservaciones(reservaciones.map(r => r.id === reservaEditando.id ? { ...r, ...datosNuevos } : r));
    } else {
      const colores = ['from-blue-400 to-indigo-500', 'from-emerald-400 to-teal-500', 'from-rose-400 to-orange-400', 'from-pink-500 to-rose-500'];
      const payload = { ...datosNuevos, color: colores[Math.floor(Math.random() * colores.length)] };
      try {
        const respuesta = await fetch(`${BASE_URL}/reservaciones`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (respuesta.ok) setReservaciones([await respuesta.json(), ...reservaciones]);
      } catch (error) { console.error(error); }
    }
    setIsModalOpen(false); setReservaEditando(null);
  };

  const handleMoverReserva = async (id, nuevoEstado, numMesaForzado = null) => {
    if (nuevoEstado === 'en-curso' && !numMesaForzado) {
      setReservaParaAsignarMesa(reservaciones.find(r => r.id === id)); return; 
    }
    try {
      const respuesta = await fetch(`${BASE_URL}/reservaciones/${id}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: nuevoEstado, numMesa: numMesaForzado })
      });
      if (respuesta.ok) {
        const reservaModificada = await respuesta.json();
        setReservaciones(reservaciones.map(r => r.id === id ? reservaModificada : r));
      }
    } catch (error) { console.error(error); }
  };

  const handleConfirmarAsignacionMesa = (numMesaIngresado) => {
    if (reservaParaAsignarMesa) {
      handleMoverReserva(reservaParaAsignarMesa.id, 'en-curso', numMesaIngresado);
      setReservaParaAsignarMesa(null); 
    }
  };

  const handleEliminarReserva = async (id) => {
    try {
      const respuesta = await fetch(`${BASE_URL}/reservaciones/${id}`, { method: 'DELETE' });
      if (respuesta.ok) setReservaciones(reservaciones.filter(r => r.id !== id));
    } catch (error) { console.error(error); }
  };

  const handleCobrarMesa = (idReserva) => {
    handleMoverReserva(idReserva, 'finalizadas');
    handleActualizarItemsComanda(idReserva, []);
  };

  const handleMandarCocina = async (mesaObj, platillosEnCuenta) => {
    const itemsDiferenciales = platillosEnCuenta
      .filter(p => p.cantidad > (p.enviado || 0))
      .map(p => ({ nombre: p.nombre, cantidad: p.cantidad - (p.enviado || 0) }));

    if (itemsDiferenciales.length === 0) {
      alert('⚠️ Toda esta comanda ya fue mandada a cocina previamente.'); return;
    }
    const payload = { numMesa: mesaObj.numMesa, platillos: itemsDiferenciales };
    try {
      const respuesta = await fetch(`${BASE_URL}/cocina`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (respuesta.ok) {
        const nuevoPedidoKDS = await respuesta.json();
        setPedidosCocina(prev => [...prev, nuevoPedidoKDS]);
        const cuentaSincronizada = platillosEnCuenta.map(p => ({ ...p, enviado: p.cantidad }));
        handleActualizarItemsComanda(prev => ({ ...prev, [mesaObj.id]: cuentaSincronizada }));
        alert('🔥 ¡Marchando a la cocina únicamente los nuevos productos!');
      }
    } catch (error) { console.error(error); }
  };

  const handleCompletarPedidoCocina = async (idPedido) => {
    try {
      await fetch(`${BASE_URL}/cocina/${idPedido}/completar`, { method: 'PUT' });
    } catch (error) { console.error(error); }
  };

  const handleDespacharPlatoSalón = (idNotificacion) => {
    setNotificacionesCocina(notificacionesCocina.filter(n => n.id !== idNotificacion));
  };

  const handleCalcularCorteZ = () => {
    const mesasFinalizadas = reservaciones.filter(r => r.estado === 'finalizadas');
    const totalVentas = mesasFinalizadas.length > 0 ? 2840 : 0;
    const subtotalGeneral = totalVentas / 1.16;
    const ticketPromedio = mesasFinalizadas.length > 0 ? totalVentas / mesasFinalizadas.length : 0;
    setDatosCorteZ({ mesasCobradas: mesasFinalizadas.length, totalVentas, subtotalGeneral, ivaGeneral: totalVentas - subtotalGeneral, ticketPromedio });
  };

  const handleConfirmarCierreDeTurnoGlobal = () => {
    setReservaciones(reservaciones.filter(r => r.estado !== 'finalizadas' && r.estado !== 'en-curso'));
    setComandas({}); setPedidosCocina([]); setNotificacionesCocina([]); setDatosCorteZ(null);
    alert('¡Cierre de Turno exitoso!');
  };

  // Cálculo de las órdenes del día corriente
  const reservasDeHoy = reservaciones.filter(r => (r.fecha ? r.fecha.split('T')[0] : '') === hoy);

  if (!usuario) return <Login onLogin={handleLogin} />;

  const esAdmin = ['Gerente', 'Subgerente'].includes(usuario.rol);
  const puedeVerRecepcion = ['Gerente', 'Subgerente', 'Hostess'].includes(usuario.rol);
  const puedeVerPOS = ['Gerente', 'Subgerente', 'Mesero'].includes(usuario.rol);
  const puedeVerCocina = ['Gerente', 'Subgerente', 'Cocinero'].includes(usuario.rol);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shadow-2xl z-20 shrink-0">
        <div>
          <div className="h-20 flex items-center px-6 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">S</div>
            <span className="ml-3 font-extrabold text-xl text-white">Sabor<span className="text-indigo-400">.io</span></span>
          </div>
          <nav className="p-4 space-y-2">
            {esAdmin && <button onClick={() => setVistaActiva('dashboard')} className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer ${ vistaActiva === 'dashboard' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 border' : 'text-slate-400 hover:text-white' }`}>Panel Operativo</button>}
            {puedeVerRecepcion && (
              <>
                <button onClick={() => setVistaActiva('tablero')} className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer ${ vistaActiva === 'tablero' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 border' : 'text-slate-400 hover:text-white' }`}>Tablero Kanban</button>
                <button onClick={() => setVistaActiva('calendario')} className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer ${ vistaActiva === 'calendario' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 border' : 'text-slate-400 hover:text-white' }`}>Calendario</button>
              </>
            )}
            {puedeVerPOS && (
              <div className="pt-2 mt-2 border-t border-slate-800/50">
                <button onClick={() => setVistaActiva('pos')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${ vistaActiva === 'pos' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border' : 'text-slate-400 hover:text-white' }`}>Punto de Venta</button>
              </div>
            )}
            {puedeVerCocina && (
              <div className="pt-2 mt-2 border-t border-slate-800/50">
                <button onClick={() => setVistaActiva('cocina')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${ vistaActiva === 'cocina' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 border' : 'text-slate-400 hover:text-white' }`}>Monitor de Cocina</button>
                <button onClick={() => setVistaActiva('inventario')} className={`w-full mt-2 text-left px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${ vistaActiva === 'inventario' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 border' : 'text-slate-400 hover:text-white' }`}>Control de Almacén</button>
              </div>
            )}
            {esAdmin && (
              <div className="pt-2 mt-2 border-t border-slate-800/50">
                <button onClick={() => setVistaActiva('usuarios')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${ vistaActiva === 'usuarios' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 border' : 'text-slate-400 hover:text-white' }`}>👥 Control de Personal</button>
              </div>
            )}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-indigo-400">{usuario.nombre.charAt(0)}</div>
                <div><p className="text-xs font-bold text-slate-200">{usuario.nombre}</p><p className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase">{usuario.rol}</p></div>
              </div>
              <div className="flex items-center gap-1.5" title={socketConectado ? "Conectado LAN en Vivo" : "Desconectado"}><span className={`w-2.5 h-2.5 rounded-full ${socketConectado ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span></div>
            </div>
            <button onClick={handleLogout} className="w-full py-1.5 bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg text-[11px] font-bold transition-colors border border-slate-800 hover:border-rose-500/20 cursor-pointer">Cerrar Sesión</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full bg-[#020617] relative">
        <div className="relative z-10 w-full h-full flex flex-col overflow-hidden">
          {vistaActiva === 'dashboard' && esAdmin && <Dashboard reservaciones={reservasDeHoy} onIniciarCorteZ={handleCalcularCorteZ} />}
          {vistaActiva === 'calendario' && puedeVerRecepcion && <><header className="h-20 border-b border-slate-800/50 flex items-center px-8 shrink-0"><h1 className="text-2xl font-extrabold text-white">Calendario de Reservas</h1></header><Calendario reservaciones={reservaciones} onAbrirModal={abrirModalParaFecha} onEditar={abrirModalParaEditar} onEliminar={handleEliminarReserva} /></>}
          {vistaActiva === 'tablero' && puedeVerRecepcion && <><header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-8 shrink-0"><h1 className="text-2xl font-extrabold text-white">Flujo de Salón</h1><button onClick={() => abrirModalParaFecha(hoy)} className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-lg text-sm font-bold text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all cursor-pointer">Añadir Reserva</button></header><TableroReservaciones reservaciones={reservasDeHoy} onMover={handleMoverReserva} onEliminar={handleEliminarReserva} onEditar={abrirModalParaEditar} /></>}
          {vistaActiva === 'pos' && puedeVerPOS && <><header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-8 shrink-0 bg-slate-900/50 backdrop-blur-md"><h1 className="text-2xl font-extrabold text-white">Caja y Comandas</h1></header><PuntoDeVenta reservaciones={reservasDeHoy} comandas={comandas} setComandas={handleActualizarItemsComanda} onCobrar={handleCobrarMesa} onEnviarCocina={handleMandarCocina} notificacionesCocina={notificacionesCocina} onDespacharPlato={handleDespacharPlatoSalón} /></>}
          {vistaActiva === 'cocina' && puedeVerCocina && <><header className="h-20 border-b border-rose-900/50 flex items-center justify-between px-8 shrink-0 bg-slate-950"><div><h1 className="text-2xl font-extrabold text-white tracking-tight">KDS • Cocina</h1><p className="text-xs font-medium text-rose-400 mt-1 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>Servicio en vivo</p></div><div className="text-sm font-bold text-slate-400 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">{pedidosCocina.length} Órdenes Pendientes</div></header><Cocina pedidos={pedidosCocina} onCompletar={handleCompletarPedidoCocina} /></>}
          {vistaActiva === 'inventario' && puedeVerCocina && <Inventario usuario={usuario} />}
          {vistaActiva === 'usuarios' && esAdmin && <GestionUsuarios usuarioLogueado={usuario} />}
        </div>
      </main>

      <ModalReserva isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setReservaEditando(null); }} onSave={handleGuardarReserva} fechaInicial={fechaParaModal} reservaAEditar={reservaEditando} />
      <ModalAsignarMesa isOpen={reservaParaAsignarMesa !== null} onClose={() => setReservaParaAsignarMesa(null)} onConfirm={handleConfirmarAsignacionMesa} reserva={reservaParaAsignarMesa} mesasOcupadas={mesasOcupadasActualmente} />
      <ModalCorteZ isOpen={datosCorteZ !== null} onClose={() => setDatosCorteZ(null)} onConfirm={handleConfirmarCierreDeTurnoGlobal} datos={datosCorteZ} />
    </div>
  );
}