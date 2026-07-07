import React, { useState, useEffect } from 'react';

export default function Cocina({ pedidos, onCompletar, onRechazarItem, estacion = 'Cocina' }) {
  const [ahora, setAhora] = useState(Date.now());
  
  const [mesasLayout, setMesasLayout] = useState([]);
  const BASE_URL = `http://${window.location.hostname}:3000/api`;

  // 🔥 NUEVO ESTADO: CANCELACIONES CON MOTIVO (KDS) 🔥
  const [modalCancelacion, setModalCancelacion] = useState({ isOpen: false, idPedido: null, item: null, numMesa: '', motivo: '' });

  useEffect(() => {
    fetch(`${BASE_URL}/mesas`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setMesasLayout(data))
      .catch(() => {});

    const intervalo = setInterval(() => setAhora(Date.now()), 10000); 
    return () => clearInterval(intervalo);
  }, []);

  const calcularTiempo = (horaMilisegundos) => {
    if (!horaMilisegundos) return { texto: '0 min', alerta: false, diffMins: 0 };
    const diffMinutos = Math.floor((ahora - new Date(horaMilisegundos).getTime()) / 60000);
    const minLimpio = Math.max(0, diffMinutos);
    return {
      texto: `${minLimpio} min`,
      alerta: minLimpio >= 15,
      diffMins: minLimpio
    };
  };

  const prioridadesGlobales = {
    'VIP': { nivel: 1, icono: '💎', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30' },
    'Terraza': { nivel: 2, icono: '🌅', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    'General': { nivel: 3, icono: '🍽️', color: 'text-slate-300', bg: 'bg-slate-800', border: 'border-slate-700' },
    'Salón Segundo Piso': { nivel: 4, icono: '🏙️', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    'Segundo Piso': { nivel: 4, icono: '🏙️', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    'Barra': { nivel: 5, icono: '🍸', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
  };

  const categoriasDeBarra = ['Bebidas', 'Coctelería', 'Cervezas', 'Licores'];
  const esModoBarra = estacion === 'Barra';

  const pedidosConPrioridad = (pedidos || []).map(pedido => {
    const mesaEncontrada = mesasLayout.find(m => String(m.numero).toUpperCase().trim() === String(pedido.numMesa).toUpperCase().trim());
    const zonaStr = mesaEncontrada ? mesaEncontrada.zona : 'General';
    const configZona = prioridadesGlobales[zonaStr] || prioridadesGlobales['General'];

    const platillosDeEstaEstacion = (pedido.platillos || []).filter(p => {
      const esBebida = categoriasDeBarra.includes(p.categoria);
      return esModoBarra ? esBebida : !esBebida;
    });

    return {
      ...pedido,
      zona: zonaStr,
      nivelPrioridad: configZona.nivel,
      configZona: configZona,
      platillosFiltrados: platillosDeEstaEstacion,
      ...calcularTiempo(pedido.id) 
    };
  }).filter(pedido => pedido.platillosFiltrados.length > 0);

  const pedidosOrdenados = [...pedidosConPrioridad].sort((a, b) => {
    if (b.diffMins !== a.diffMins) {
      return b.diffMins - a.diffMins; 
    }
    return a.nivelPrioridad - b.nivelPrioridad; 
  });

  // 🔥 EJECUCIÓN DE LA CANCELACIÓN EN KDS 🔥
  const ejecutarRechazo = async () => {
    if (!modalCancelacion.motivo.trim()) return alert("Debes ingresar un motivo para cancelar este platillo.");
    try {
      // 1. Guardar en Base de Datos
      await fetch(`http://${window.location.hostname}:3000/api/cancelaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platillo: modalCancelacion.item.nombre || modalCancelacion.item.platillo,
          cantidad: modalCancelacion.item.cantidad, 
          precio: modalCancelacion.item.precioBase || modalCancelacion.item.precio || 0,
          motivo: modalCancelacion.motivo,
          usuario: estacion // Guardamos que se canceló desde Cocina o Barra
        })
      });
      // 2. Limpiar localmente el UI
      onRechazarItem(modalCancelacion.idPedido, modalCancelacion.item, modalCancelacion.numMesa);
      setModalCancelacion({ isOpen: false, idPedido: null, item: null, numMesa: '', motivo: '' });
    } catch(e) {
      alert('Error de red al cancelar el platillo.');
    }
  };

  const colorEstacion = esModoBarra ? 'cyan' : 'rose';
  const iconoEstacion = esModoBarra ? '🍸' : '🍳';
  const tituloEstacion = esModoBarra ? 'Barra al día e impecable' : 'Cocina al día e impecable';

  return (
    <div className="flex-1 bg-[#070b16] p-8 overflow-x-auto select-none min-h-[calc(100vh-80px)] flex gap-6 items-start relative">

      {/* 🔥 MODAL CANCELACIÓN POR CHEF (KDS) 🔥 */}
      {modalCancelacion.isOpen && (
        <div className="fixed inset-0 z-[700] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#1a0f14] border border-rose-900/50 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(225,29,72,0.15)] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600"></div>
            <header className="mb-5 text-center">
              <span className="text-4xl block mb-2">🗑️</span>
              <h2 className="text-xl font-black text-white tracking-tight">Rechazar Platillo</h2>
              <p className="text-[11px] text-rose-400 mt-1 uppercase tracking-widest font-bold">Quitar de la fila de preparación</p>
            </header>

            <div className="bg-rose-950/30 border border-rose-900/30 p-3 rounded-xl mb-5 text-center">
              <p className="text-slate-300 text-sm font-bold truncate">{modalCancelacion.item?.cantidad}x {modalCancelacion.item?.nombre || modalCancelacion.item?.platillo}</p>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Motivo del rechazo</label>
              <select 
                value={modalCancelacion.motivo} 
                onChange={e => setModalCancelacion({...modalCancelacion, motivo: e.target.value})}
                className="w-full bg-[#0b1120] border border-slate-700 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-rose-500 font-sans cursor-pointer"
              >
                <option value="" disabled>Seleccione un motivo...</option>
                <option value="Falta de insumo en estación">Falta de insumo en estación</option>
                <option value="Platillo arruinado / Merma">Platillo arruinado / Quemado</option>
                <option value="Petición del mesero">Petición directa del mesero</option>
                <option value="Otro">Otro...</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalCancelacion({ isOpen: false, idPedido: null, item: null, numMesa: '', motivo: '' })} className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-colors shadow-sm">Cancelar</button>
              <button onClick={ejecutarRechazo} className="flex-1 font-black rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-all shadow-lg text-white bg-rose-600 hover:bg-rose-500 shadow-rose-600/20">
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}

      {pedidosOrdenados.length === 0 ? (
        <div className="w-full h-96 border-2 border-dashed border-slate-800/80 rounded-3xl flex flex-col items-center justify-center text-slate-500 gap-3 shadow-inner">
          <span className="text-6xl animate-bounce">{iconoEstacion}</span>
          <h2 className="text-xl font-black tracking-wide text-slate-400 uppercase font-sans">{tituloEstacion}</h2>
          <p className="text-xs font-mono text-emerald-400/80 bg-emerald-950/30 px-4 py-1.5 rounded-full border border-emerald-800/30 font-bold">
            No hay comandas pendientes de preparación
          </p>
        </div>
      ) : (
        pedidosOrdenados.map((pedido) => {
          return (
            <div 
              key={pedido.id || Math.random()} 
              className={`min-w-[320px] max-w-sm bg-slate-900/80 border rounded-3xl p-6 flex flex-col justify-between shadow-2xl transition-all shrink-0 relative overflow-hidden ${
                pedido.alerta ? `border-${colorEstacion}-500/80 shadow-[0_0_30px_rgba(${esModoBarra ? '6,182,212' : '225,29,72'},0.15)]` : 'border-slate-800'
              }`}
            >
              <div className={`absolute top-0 left-0 w-full h-1.5 ${esModoBarra ? 'bg-cyan-500' : 'bg-orange-500'}`}></div>

              <div>
                <div className="flex justify-between items-start border-b border-slate-800/80 pb-4 mb-4 mt-1 relative">
                  <div>
                    <span className="text-[10px] font-black font-mono tracking-widest text-slate-400 block uppercase">Comanda en {estacion}</span>
                    <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
                      MESA #{pedido.numMesa}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border flex items-center gap-1.5 shadow-sm ${pedido.configZona.bg} ${pedido.configZona.border} ${pedido.configZona.color}`}>
                      <span>{pedido.configZona.icono}</span> {pedido.zona}
                    </span>
                    
                    <span className={`text-xs font-black font-mono px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${
                      pedido.alerta 
                        ? `bg-${colorEstacion}-500/20 border-${colorEstacion}-500/40 text-${colorEstacion}-300 animate-pulse font-extrabold` 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pedido.alerta ? `bg-${colorEstacion}-400` : 'bg-emerald-400'}`}></span>
                      {pedido.texto}
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5 my-2 overflow-y-auto max-h-[55vh] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {pedido.platillosFiltrados?.map((item, idx) => {
                    const notaLimpia = item.comentario || item.nota || item.notas || '';
                    const tieneModificadores = item.modificadores && item.modificadores.length > 0;

                    return (
                      <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 transition-all hover:border-slate-700 shadow-sm flex flex-col">
                        
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <span className={`bg-${esModoBarra ? 'cyan' : 'indigo'}-600/20 border border-${esModoBarra ? 'cyan' : 'indigo'}-500/30 text-${esModoBarra ? 'cyan' : 'indigo'}-300 text-xs font-black font-mono px-2.5 py-1 rounded-xl shrink-0 mt-0.5`}>
                              {item.cantidad}x
                            </span>
                            <div className="flex flex-col">
                              <span className="text-white font-extrabold text-sm leading-snug pt-0.5">
                                {item.nombre || item.platillo}
                              </span>
                              
                              {tieneModificadores && (
                                <div className="mt-1.5 space-y-0.5">
                                  {item.modificadores.map((mod, modIdx) => (
                                    <div key={modIdx} className="flex items-start gap-1.5 text-[10px] text-slate-400 font-mono">
                                      <span className="text-slate-600 mt-[-1px]">└</span> 
                                      <span className="leading-tight">+ {mod.nombre}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                            </div>
                          </div>

                          {/* 🔥 BOTÓN MODIFICADO PARA ABRIR MODAL DE MOTIVO 🔥 */}
                          <button
                            onClick={() => setModalCancelacion({ isOpen: true, idPedido: pedido.id, item, numMesa: pedido.numMesa, motivo: '' })}
                            className="text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-500/10 p-1.5 rounded-lg transition-colors shadow-sm border border-rose-500/20 shrink-0 ml-2 cursor-pointer"
                            title="Agotado: Eliminar ítem y reportar merma/falta"
                          >
                            🗑️
                          </button>
                        </div>

                        {notaLimpia.trim() !== '' && (
                          <div className="mt-2.5 ml-9 px-3 py-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-200 text-xs font-medium flex items-start gap-2 shadow-inner">
                            <span className="text-amber-400 select-none text-sm leading-none mt-0.5">⚠️</span>
                            <div className="leading-relaxed">
                              <span className="text-[10px] font-black uppercase font-mono tracking-wider text-amber-400/90 block mb-0.5">Nota de mesero:</span>
                              {notaLimpia}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => onCompletar(pedido.id)}
                className={`w-full mt-6 py-3.5 ${esModoBarra ? 'bg-cyan-600 hover:bg-cyan-500 border-cyan-400/20 shadow-cyan-600/30' : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400/20 shadow-indigo-600/30'} active:scale-95 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 border`}
              >
                <span>🚀</span>
                <span>¡{esModoBarra ? 'Barra Lista' : 'Plato Listo'}!</span>
              </button>

            </div>
          );
        })
      )}
    </div>
  );
}