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
  const [modalConfirmacion, setModalConfirmacion] = useState({ isOpen: false, titulo: '', mensaje: '', accion: null });

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

  // =========================================================================================
  // 🔥 LÓGICA DE RECONEXIÓN MEJORADA Y AGRESIVA 🔥
  // =========================================================================================
  const handleReconectarServidor = () => {
    // 1. Damos retroalimentación visual al usuario para que no presione mil veces
    setAlertaSistema({ 
      titulo: 'Reconectando...', 
      mensaje: 'Forzando la comunicación con el servidor local...', 
      icono: '📡', 
      color: 'text-amber-500' 
    });

    // 2. Destruimos la conexión actual para resetear el temporizador de Socket.IO
    socket.disconnect();
    
    // 3. Esperamos medio segundo y lanzamos la conexión en limpio
    setTimeout(() => {
      socket.connect();
      sincronizarTodoElSalon();
      
      // Cerramos la ventana de alerta poco después
      setTimeout(() => setAlertaSistema(null), 1500);
    }, 500);
  };
  // =========================================================================================

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

  const obtenerVistaInicial = (rolUsuario) => {
    const rol = String(rolUsuario || '').toLowerCase().trim();
    if (rol.includes('cocin'))   return 'cocina';       
    if (rol.includes('barra') || rol.includes('cantin')) return 'barra'; 
    if (rol.includes('host'))    return 'tablero';      
    if (rol.includes('meser'))   return 'pos';          
    if (rol.includes('cajer'))   return 'pos';          
    if (rol.includes('almacen')) return 'inventario';   
    return 'dashboard'; 
  };

  const handleLogin = (u) => { 
    setUsuario(u); 
    setVistaActiva(obtenerVistaInicial(u.rol)); 
  };

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
    const categoriasDeBarra = ['Bebidas', 'Coctelería', 'Cervezas', 'Licores'];
    
    const items = platillosEnCuenta.filter(p => p.cantidad > (p.enviado || 0)).map(p => ({
      nombre: p.nombre, cantidad: p.cantidad - (p.enviado || 0), comentario: p.comentario || '', categoria: p.categoria 
    }));
    
    if (items.length === 0) return setAlertaSistema({ titulo: 'Aviso', mensaje: 'No hay platillos nuevos por marchar.', icono: '⚠️', color: 'text-amber-500' });
    
    const itemsBarra = items.filter(p => categoriasDeBarra.includes(p.categoria));
    const itemsCocina = items.filter(p => !categoriasDeBarra.includes(p.categoria));

    try {
      if (itemsBarra.length > 0) {
        await fetch(`${BASE_URL}/cocina`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numMesa: mesaObj.numMesa, platillos: itemsBarra })
        });
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (itemsCocina.length > 0) {
        await fetch(`${BASE_URL}/cocina`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numMesa: mesaObj.numMesa, platillos: itemsCocina })
        });
      }

      const nuevosPlatillos = platillosEnCuenta.map(p => ({ ...p, enviado: p.cantidad }));
      handleActualizarComandas(prev => ({ ...prev, [mesaObj.id]: nuevosPlatillos }));
      setAlertaSistema({ titulo: '¡Enviada!', mensaje: 'Orden dividida y enrutada a sus estaciones correspondientes.', icono: '🔥', color: 'text-orange-500' });
      
    } catch (e) { 
      console.error(e); 
    }
  };

  const handleCompletarPedidoCocina = async (id) => {
    try { 
      await fetch(`${BASE_URL}/cocina/${id}/completar`, { method: 'PUT' }); 
      sincronizarTodoElSalon(); 
    } catch (e) {}
  };

  const handleRechazarItemCocina = (pedidoId, itemRechazado, numMesa) => {
    setModalConfirmacion({
      isOpen: true,
      titulo: 'Confirmar "86" (Agotado)',
      mensaje: `¿Deseas eliminar ${itemRechazado.cantidad}x ${itemRechazado.nombre}? Al aceptar, se descontará automáticamente de la cuenta de la mesa y NO se notificará al salón que está listo.`,
      accion: async () => {
        setModalConfirmacion({ isOpen: false, titulo: '', mensaje: '', accion: null }); 
        
        try {
          const reserva = reservacionesLimpias.find(r => String(r.numMesa).trim() === String(numMesa).trim());
          if (reserva) {
            const cuentaActual = [...(comandas[reserva.id] || [])];
            const indexEnCuenta = cuentaActual.findIndex(p => p.nombre === itemRechazado.nombre && (p.comentario || '') === (itemRechazado.comentario || ''));
            
            if (indexEnCuenta >= 0) {
              cuentaActual[indexEnCuenta].cantidad -= itemRechazado.cantidad;
              cuentaActual[indexEnCuenta].enviado -= itemRechazado.cantidad;
              if (cuentaActual[indexEnCuenta].cantidad <= 0) cuentaActual.splice(indexEnCuenta, 1);
              
              await fetch(`${BASE_URL}/comandas/${reserva.id}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platillos: cuentaActual })
              });
            }
          }

          const pedidoActual = pedidosCocina.find(p => p.id === pedidoId);
          if (pedidoActual) {
            const nuevosPlatillos = [...pedidoActual.platillos];
            const idxReal = nuevosPlatillos.findIndex(p => p.nombre === itemRechazado.nombre && p.cantidad === itemRechazado.cantidad);
            if (idxReal >= 0) nuevosPlatillos.splice(idxReal, 1);

            await fetch(`${BASE_URL}/cocina/${pedidoId}`, {
              method: 'PUT', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ 
                ...pedidoActual, 
                platillos: nuevosPlatillos,
                estado: nuevosPlatillos.length === 0 ? 'cancelado' : pedidoActual.estado 
              })
            });
          }

          setAlertaSistema({ titulo: 'Platillo Cancelado (86)', mensaje: `Se eliminó "${itemRechazado.nombre}" del ticket y se descontó de la cuenta.`, icono: '❌', color: 'text-rose-500' });
          sincronizarTodoElSalon();

        } catch (e) {
          console.error(e);
          alert('Error de red al rechazar el platillo.');
        }
      }
    });
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

  const handleEliminarReserva = (id) => {
    setModalConfirmacion({
      isOpen: true,
      titulo: 'Confirmar Eliminación',
      mensaje: '¿Estás seguro de eliminar este registro del salón?',
      accion: async () => {
        setModalConfirmacion({ isOpen: false, titulo: '', mensaje: '', accion: null });
        try { 
          await fetch(`${BASE_URL}/reservaciones/${id}`, { method: 'DELETE' }); 
          sincronizarTodoElSalon(); 
        } catch (e) { console.error(e); }
      }
    });
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
                 onCobrar={async (idReservaPagada) => {
                   const reserva = reservacionesLimpias.find(r => r.id === idReservaPagada);
                   const mesaTarget = String(reserva?.numMesa || '').trim().toLowerCase();
                   const cocinaTrabajando = pedidosCocina.some(p => String(p.numMesa || '').trim().toLowerCase() === mesaTarget && p.estado === 'pendiente');
                   if (cocinaTrabajando) {
                     return setAlertaSistema({ titulo: 'Mesa en Proceso', mensaje: `La Mesa ${reserva?.numMesa} tiene platillos preparándose en cocina. No puedes cobrar hasta que el chef los marque como terminados.`, icono: '⏳', color: 'text-rose-500' });
                   }
                   try { await fetch(`${BASE_URL}/reservaciones/${idReservaPagada}`, { method: 'DELETE' }); } catch (e) {}
                   sincronizarTodoElSalon();
                 }} 
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
      
      case "cocina": return <Cocina pedidos={pedidosCocina} onCompletar={handleCompletarPedidoCocina} onRechazarItem={handleRechazarItemCocina} estacion="Cocina" />;
      case "barra": return <Cocina pedidos={pedidosCocina} onCompletar={handleCompletarPedidoCocina} onRechazarItem={handleRechazarItemCocina} estacion="Barra" />;
      
      default: return <div className="p-12 text-center text-slate-500">Módulo en construcción...</div>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#070b16] text-slate-200 font-sans overflow-hidden select-none">
      
      {modalConfirmacion.isOpen && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0b1120] border border-rose-900/50 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_0_50px_rgba(225,29,72,0.15)] relative flex flex-col text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600"></div>
            
            <div className="text-5xl mb-4 animate-bounce">🗑️</div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-2">{modalConfirmacion.titulo}</h2>
            <p className="text-xs text-rose-200/80 mb-8 leading-relaxed px-2">
              {modalConfirmacion.mensaje}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setModalConfirmacion({ isOpen: false, titulo: '', mensaje: '', accion: null })} 
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest text-[10px] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={modalConfirmacion.accion} 
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-rose-600/20 transition-transform active:scale-95 cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

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

      <Sidebar 
        vistaActual={vistaActiva} 
        setVistaActual={setVistaActiva} 
        usuario={usuario} 
        socketConectado={socketConectado} 
        onLogout={() => setUsuario(null)} 
        onReconectar={handleReconectarServidor}
      />
      
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto bg-[#070b16]">
        {renderizarVista()}
      </main>
      
      <ModalCorteZ isOpen={datosCorteZ !== null} onClose={() => setDatosCorteZ(null)} onConfirm={handleConfirmarCierre} datos={datosCorteZ} />
      <ModalReserva isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setReservaEditando(null); }} onSave={handleGuardarReserva} reserva={reservaEditando} fechaInicial={fechaParaModal} />
      {reservaParaAsignarMesa && <ModalAsignarMesa isOpen={true} onClose={() => setReservaParaAsignarMesa(null)} reserva={reservaParaAsignarMesa} mesas={mesasGlobal} mesasOcupadas={mesasOcupadasActualmente} onConfirm={(numMesa) => handleConfirmarAsignacionMesa(reservaParaAsignarMesa.id, numMesa)} />}
    </div>
  );
}