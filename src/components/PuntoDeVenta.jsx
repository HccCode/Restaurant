import React, { useState, useEffect } from 'react';
import ModalTicket from './ModalTicket';

export default function PuntoDeVenta({ 
  reservaciones, comandas, setComandas, onCobrar, onEnviarCocina, notificacionesCocina = [], onDespacharPlato 
}) {
  const mesasActivas = reservaciones.filter(r => r.estado === 'en-curso');
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState('Platos Fuertes');
  const [datosParaTicket, setDatosParaTicket] = useState(null);
  const [menuRestaurante, setMenuRestaurante] = useState([]);

  useEffect(() => {
    const BASE_URL = `http://${window.location.hostname}:3000/api`;
    fetch(`${BASE_URL}/menu`)
      .then(res => res.json())
      .then(data => {
        setMenuRestaurante(data);
        if (data.length > 0) {
          const cats = Array.from(new Set(data.map(item => item.categoria)));
          if (cats.length > 0 && !cats.includes(categoriaActiva)) setCategoriaActiva(cats[0]);
        }
      }).catch(err => console.error('Error cargando menú:', err));
  }, []);

  const categoriasDisponibles = Array.from(new Set(menuRestaurante.map(item => item.categoria))).length > 0 
    ? Array.from(new Set(menuRestaurante.map(item => item.categoria))) 
    : ['Platos Fuertes', 'Entradas', 'Bebidas', 'Postres'];

  const mesaSeleccionada = mesasActivas.find(m => m.id === mesaSeleccionadaId);
  const platillosFiltrados = menuRestaurante.filter(p => p.categoria === categoriaActiva);
  const cuentaActual = (mesaSeleccionadaId ? comandas[mesaSeleccionadaId] : []) || [];

  const subtotal = cuentaActual.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  useEffect(() => {
    if (!mesaSeleccionadaId && mesasActivas.length > 0) setMesaSeleccionadaId(mesasActivas[0].id);
  }, [mesasActivas, mesaSeleccionadaId]);

  const agregarPlatillo = (platillo) => {
    if (!mesaSeleccionadaId) return;
    const cuentaVieja = comandas[mesaSeleccionadaId] || [];
    const index = cuentaVieja.findIndex(item => item.id === platillo.id);

    let nuevaCuenta;
    if (index > -1) {
      nuevaCuenta = cuentaVieja.map((item, i) => i === index ? { ...item, cantidad: item.cantidad + 1 } : item);
    } else {
      nuevaCuenta = [...cuentaVieja, { id: platillo.id, nombre: platillo.nombre, precio: parseFloat(platillo.precio), cantidad: 1, enviado: 0, comentario: '' }];
    }
    setComandas({ ...comandas, [mesaSeleccionadaId]: nuevaCuenta });
  };

  const restaPlatillo = (idPlatillo) => {
    if (!mesaSeleccionadaId) return;
    const cuentaVieja = comandas[mesaSeleccionadaId] || [];
    const itemTarget = cuentaVieja.find(item => item.id === idPlatillo);
    if (!itemTarget) return;

    let nuevaCuenta;
    if (itemTarget.cantidad > 1) {
      nuevaCuenta = cuentaVieja.map(item => item.id === idPlatillo ? { ...item, cantidad: item.cantidad - 1 } : item);
    } else {
      nuevaCuenta = cuentaVieja.filter(item => item.id !== idPlatillo);
    }
    setComandas({ ...comandas, [mesaSeleccionadaId]: nuevaCuenta });
  };

  const handleMandarCocina = () => {
    if (!mesaSeleccionada || cuentaActual.length === 0) return;
    onEnviarCocina(mesaSeleccionada, cuentaActual);
  };

  const handleAbrirModalCobro = () => {
    if (!mesaSeleccionada || cuentaActual.length === 0) return;
    setDatosParaTicket({
      mesa: mesaSeleccionada.numMesa,
      cliente: mesaSeleccionada.nombre,
      items: cuentaActual,
      subtotal, iva, total,
      idReserva: mesaSeleccionada.id
    });
  };

  const handleConfirmarCobroCerrado = () => {
    if (datosParaTicket) {
      onCobrar(datosParaTicket.idReserva);
      setDatosParaTicket(null);
      setMesaSeleccionadaId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#020617] text-slate-200 select-none overflow-hidden relative">
      
      {/* VENTANA MODAL FLOTANTE DE NOTIFICACIÓN DE COCINA CENTRAL */}
      {notificacionesCocina.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
              <span className="text-3xl animate-bounce">🔔</span>
            </div>
            <h2 className="text-xl font-black text-white">¡Platillo Terminado!</h2>
            <p className="text-emerald-400 font-bold text-xs mb-4 uppercase">Mesa {notificacionesCocina[0].numMesa}</p>
            <div className="bg-slate-950 w-full p-4 rounded-xl border border-slate-800 mb-5 text-left">
              <p className="text-sm font-black text-emerald-300">{notificacionesCocina[0].resumenPlatos}</p>
              <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">Cliente: <span className="text-slate-200 font-bold">{notificacionesCocina[0].nombreCliente}</span></p>
            </div>
            <button onClick={() => onDespacharPlato(notificacionesCocina[0].id)} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer">✓ Confirmar Entrega</button>
          </div>
        </div>
      )}

      {/* HEADER DE SALA */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-4 shrink-0 flex items-center gap-3 overflow-x-auto shadow-lg">
        {mesasActivas.length === 0 ? (
          <p className="text-xs text-amber-400/80 italic font-medium">No hay mesas en servicio activo.</p>
        ) : (
          mesasActivas.map(mesa => {
            const isSelected = mesa.id === mesaSeleccionadaId;
            const tieneConsumo = (comandas[mesa.id] && comandas[mesa.id].length > 0);
            return (
              <button key={mesa.id} onClick={() => setMesaSeleccionadaId(mesa.id)} className={`px-4 py-2.5 rounded-2xl font-bold text-xs shrink-0 cursor-pointer ${isSelected ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-950/80 border border-slate-800'}`}>
                <span className={`w-2.5 h-2.5 inline-block rounded-full mr-2 ${tieneConsumo ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                Mesa {mesa.numMesa} ({mesa.nombre})
              </button>
            );
          })
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* GRILLA DE PRODUCTOS */}
        <div className="flex-1 flex flex-col bg-slate-950/50 border-r border-slate-800/80 overflow-hidden">
          <div className="flex bg-slate-900/60 p-2 border-b border-slate-800/80 gap-1.5 overflow-x-auto shrink-0">
            {categoriasDisponibles.map(cat => (
              <button key={cat} onClick={() => setCategoriaActiva(cat)} className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide whitespace-nowrap cursor-pointer ${categoriaActiva === cat ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{cat}</button>
            ))}
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {platillosFiltrados.map(plato => (
                <div key={`menu-item-${plato.id}`} onClick={() => agregarPlatillo(plato)} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between group transition-all hover:scale-[1.02] cursor-pointer">
                  <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-950 mb-2 relative">
                    <img src={plato.imagen || 'https://via.placeholder.com/200'} alt={plato.nombre} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-slate-950/90 text-emerald-400 font-black text-[11px] px-2 py-0.5 rounded-md border border-emerald-500/10">${parseFloat(plato.precio).toFixed(0)}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-100 group-hover:text-indigo-400 truncate">{plato.nombre}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR DE CONTROL DE CONSUMO */}
        <div className="w-96 bg-slate-900/40 flex flex-col justify-between shrink-0 overflow-hidden">
          <div className="p-4 bg-slate-900 border-b border-slate-800">
            <h3 className="font-black text-sm text-white">{mesaSeleccionada ? `Mesa ${mesaSeleccionada.numMesa}` : 'Selecciona Mesa'}</h3>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 divide-y divide-slate-800/40">
            {cuentaActual.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 p-4">
                <span className="text-3xl mb-2">🛒</span>
                <p className="text-xs font-bold">La comanda está vacía.</p>
              </div>
            ) : (
              cuentaActual.map((item, index) => (
                <div key={`comanda-item-${item.id}-${index}`} className="pt-4 first:pt-0 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-sm text-slate-100 truncate">{item.nombre}</h5>
                      <div className="flex gap-2 items-center mt-1 flex-wrap">
                        <span className="text-xs font-bold text-emerald-400">${parseFloat(item.precio).toFixed(2)}</span>
                        {item.enviado > 0 && <span className="text-[10px] bg-slate-950 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-black">📦 {item.enviado} en cocina</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 h-9 shrink-0">
                      <button onClick={() => restaPlatillo(item.id)} className="w-7 h-7 hover:text-rose-400 rounded-lg font-bold text-sm cursor-pointer">-</button>
                      <span className="w-7 text-center font-black text-xs text-white">{item.cantidad}</span>
                      <button onClick={() => agregarPlatillo(item)} className="w-7 h-7 hover:text-emerald-400 rounded-lg font-bold text-sm cursor-pointer">+</button>
                    </div>
                    <div className="w-16 text-right font-black text-sm text-white shrink-0 pt-1">${(parseFloat(item.precio) * item.cantidad).toFixed(2)}</div>
                  </div>
                  
                  {/* BOTÓN DE NOTA AMPLIADO */}
                  <div className="mt-1">
                    <button 
                      onClick={() => {
                        const nota = window.prompt(`Nota de preparación para ${item.nombre}:`, item.comentario || '');
                        if (nota !== null) {
                          const copia = [...cuentaActual];
                          copia[index] = { ...copia[index], comentario: nota };
                          setComandas({ ...comandas, [mesaSeleccionadaId]: copia });
                        }
                      }}
                      className={`text-[11px] px-3 py-1.5 w-full text-left rounded-lg font-bold cursor-pointer transition-all shadow-sm border ${
                        item.comentario 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400' 
                          : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {item.comentario ? `💬 Nota: ${item.comentario}` : '📝 + Agregar Nota o Término'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {mesaSeleccionada && (
            <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
              <div className="space-y-1 mb-3 text-xs">
                <div className="flex justify-between text-slate-400"><span>Subtotal:</span><span className="font-bold text-white">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-400"><span>IVA (16%):</span><span className="font-bold text-white">${iva.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-800 text-slate-200 font-black">
                  <span>TOTAL:</span><span className="text-base text-emerald-400">${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleMandarCocina} disabled={cuentaActual.length === 0} className="py-3 bg-gradient-to-r from-amber-500 to-orange-500 disabled:opacity-30 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer">🔥 A Cocina</button>
                <button onClick={handleAbrirModalCobro} disabled={cuentaActual.length === 0} className="py-3 bg-gradient-to-r from-emerald-500 to-teal-600 disabled:opacity-30 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer">💵 Cobrar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {datosParaTicket && (
        <ModalTicket isOpen={datosParaTicket !== null} datos={datosParaTicket} onClose={() => setDatosParaTicket(null)} onConfirm={handleConfirmarCobroCerrado} />
      )}
    </div>
  );
}