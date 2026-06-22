import React, { useState, useEffect } from 'react';
import ModalTicket from './ModalTicket';

export default function PuntoDeVenta({ 
  reservaciones, 
  comandas, 
  setComandas, 
  onCobrar, 
  onEnviarCocina, 
  notificacionesCocina = [], 
  onDespacharPlato 
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
          const categoriesGeneradas = Array.from(new Set(data.map(item => item.categoria)));
          if (categoriesGeneradas.length > 0 && !categoriesGeneradas.includes(categoriaActiva)) {
            setCategoriaActiva(categoriesGeneradas[0]);
          }
        }
      })
      .catch(err => console.error('Error cargando menú:', err));
  }, []);

  const categoriasDinamicas = Array.from(new Set(menuRestaurante.map(item => item.categoria)));
  const categoriasDisponibles = categoriasDinamicas.length > 0 ? categoriasDinamicas : ['Platos Fuertes', 'Entradas', 'Bebidas', 'Postres'];

  const mesaSeleccionada = mesasActivas.find(m => m.id === mesaSeleccionadaId);
  const platillosFiltrados = menuRestaurante.filter(p => p.categoria === categoriaActiva);
  const cuentaActual = (mesaSeleccionadaId ? comandas[mesaSeleccionadaId] : []) || [];

  const subtotal = cuentaActual.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  useEffect(() => {
    if (!mesaSeleccionadaId && mesasActivas.length > 0) {
      setMesaSeleccionadaId(mesasActivas[0].id);
    }
  }, [mesasActivas, mesaSeleccionadaId]);

  const agregarPlatillo = (platillo) => {
    if (!mesaSeleccionadaId) return;
    
    const cuentaVieja = comandas[mesaSeleccionadaId] || [];
    const index = cuentaVieja.findIndex(item => item.id === platillo.id);

    let nuevaCuenta;
    if (index > -1) {
      nuevaCuenta = cuentaVieja.map((item, i) => 
        i === index ? { ...item, cantidad: item.cantidad + 1 } : item
      );
    } else {
      nuevaCuenta = [...cuentaVieja, { id: platillo.id, nombre: platillo.nombre, precio: parseFloat(platillo.precio), cantidad: 1, enviado: 0 }];
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
      nuevaCuenta = cuentaVieja.map(item => 
        item.id === idPlatillo ? { ...item, cantidad: item.cantidad - 1 } : item
      );
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
      
      {/* MODAL CENTRAL DE ALERTA DE PLATILLO TERMINADO */}
      {notificacionesCocina.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] p-8 max-w-sm w-full flex flex-col items-center text-center transform transition-all">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-5 border border-emerald-500/20">
              <span className="text-4xl animate-bounce">🔔</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-1">¡Platillo Terminado!</h2>
            <p className="text-emerald-400 font-bold text-sm mb-6 uppercase tracking-widest">Mesa {notificacionesCocina[0].numMesa}</p>
            
            <div className="bg-slate-950 w-full p-4 rounded-xl border border-slate-800 mb-6 shadow-inner">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Orden lista para entregar:</p>
              <p className="text-base font-black text-emerald-300 leading-snug">{notificacionesCocina[0].resumenPlatos}</p>
              <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-800 pt-2">Atendiendo a: <span className="font-bold text-slate-300">{notificacionesCocina[0].nombreCliente}</span></p>
            </div>
            <button onClick={() => onDespacharPlato(notificacionesCocina[0].id)} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all cursor-pointer">✓ Confirmar Entrega</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 shrink-0 flex items-center gap-3 overflow-x-auto shadow-lg">
        <span className="text-xs font-black text-slate-500 uppercase tracking-wider shrink-0 mr-1">Mesas en Sala:</span>
        {mesasActivas.length === 0 ? (
          <p className="text-xs text-amber-400/80 italic font-medium">No hay mesas en servicio activo.</p>
        ) : (
          mesasActivas.map(mesa => {
            const isSelected = mesa.id === mesaSeleccionadaId;
            const tieneConsumo = (comandas[mesa.id] && comandas[mesa.id].length > 0);
            return (
              <button key={mesa.id} onClick={() => setMesaSeleccionadaId(mesa.id)} className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2.5 shrink-0 transition-all cursor-pointer ${isSelected ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105 ring-2 ring-emerald-400' : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800/80'}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${tieneConsumo ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                Mesa {mesa.numMesa} <span className="opacity-70 font-normal">({mesa.nombre})</span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col bg-slate-950/50 border-r border-slate-800/80 overflow-hidden">
          <div className="flex bg-slate-900/60 p-2 border-b border-slate-800/80 gap-1.5 overflow-x-auto shrink-0">
            {categoriasDisponibles.map(cat => (
              <button key={cat} onClick={() => setCategoriaActiva(cat)} className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide whitespace-nowrap transition-all cursor-pointer ${categoriaActiva === cat ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>{cat}</button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {platillosFiltrados.map(plato => (
                <div key={`menu-item-${plato.id}`} onClick={() => agregarPlatillo(plato)} className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-3 flex flex-col justify-between group transition-all hover:scale-[1.02] hover:shadow-xl cursor-pointer">
                  <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-950 mb-3 relative">
                    <img src={plato.imagen || 'https://via.placeholder.com/200'} alt={plato.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <span className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md text-emerald-400 font-black text-xs px-2.5 py-1 rounded-lg border border-emerald-500/20">${parseFloat(plato.precio).toFixed(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">{plato.nombre}</h4>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{plato.categoria}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-96 bg-slate-900/40 flex flex-col justify-between shrink-0 relative overflow-hidden">
          <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>{mesaSeleccionada ? `Mesa ${mesaSeleccionada.numMesa}` : 'Ninguna Mesa'}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{mesaSeleccionada ? `Atendiendo a: ${mesaSeleccionada.nombre}` : 'Selecciona una mesa arriba'}</p>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-3 divide-y divide-slate-800/40">
            {!mesaSeleccionada ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 p-4"><span className="text-3xl mb-2">👈</span><p className="text-xs font-bold">Selecciona una mesa operativa para ver la cuenta.</p></div>
            ) : cuentaActual.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600"><span className="text-3xl mb-2">🛒</span><p className="text-xs font-bold">La comanda está vacía.</p></div>
            ) : (
              cuentaActual.map((item, index) => (
                <div key={`comanda-item-${item.id}-${index}`} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <h5 className="font-extrabold text-sm text-slate-100 leading-tight">{item.nombre}</h5>
                    <div className="flex gap-2 items-center mt-0.5">
                      <span className="text-xs font-bold text-emerald-400">${parseFloat(item.precio).toFixed(2)}</span>
                      {item.enviado > 0 && <span className="text-[10px] bg-slate-950 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">📦 {item.enviado} en cocina</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
                    <button onClick={() => restaPlatillo(item.id)} className="w-7 h-7 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg font-black text-slate-400 text-sm flex items-center justify-center cursor-pointer">-</button>
                    <span className="w-8 text-center font-black text-xs text-white">{item.cantidad}</span>
                    <button onClick={() => agregarPlatillo(item)} className="w-7 h-7 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg font-black text-slate-400 text-sm flex items-center justify-center cursor-pointer">+</button>
                  </div>

                  <div className="w-16 text-right font-black text-sm text-white">${(parseFloat(item.precio) * item.cantidad).toFixed(2)}</div>
                </div>
              ))
            )}
          </div>

          {mesaSeleccionada && (
            <div className="p-5 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md shrink-0 shadow-2xl">
              <div className="space-y-1.5 mb-4 text-xs">
                <div className="flex justify-between text-slate-400 font-medium"><span>Subtotal:</span><span className="font-bold text-white">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-400 font-medium"><span>IVA (16%):</span><span className="font-bold text-white">${iva.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-800 text-slate-200 font-black">
                  <span className="text-base text-white">TOTAL:</span>
                  <span className="text-xl text-emerald-400 font-black">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={handleMandarCocina} disabled={cuentaActual.length === 0} className="py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-30 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer">🔥 A Cocina</button>
                <button onClick={handleAbrirModalCobro} disabled={cuentaActual.length === 0} className="py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-30 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer">💵 Cobrar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {datosParaTicket && (
        <ModalTicket 
          isOpen={datosParaTicket !== null}
          datos={datosParaTicket}
          onClose={() => setDatosParaTicket(null)}
          onConfirm={handleConfirmarCobroCerrado}
        />
      )}

    </div>
  );
}