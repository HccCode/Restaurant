import React, { useState } from 'react';

export default function ControlMesas({ mesas = [], onActualizar }) {
  const [form, setForm] = useState({ numero: '', zona: 'General', capacidad: 4 });
  const [modoEdicionId, setModoEdicionId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const BASE_URL = `http://${window.location.hostname}:3000/api`;
  const zonasLista = ['General', 'Terraza', 'VIP', 'Barra', 'Salón Segundo Piso'];

  // 🔥 AGRUPADOR MATEMÁTICO: Ordena las mesas por zona para empaquetarlas 🔥
  const mesasPorZona = mesas.reduce((acc, mesa) => {
    const z = mesa.zona || 'General';
    if (!acc[z]) acc[z] = [];
    acc[z].push(mesa);
    return acc;
  }, {});

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.numero.trim()) return alert("Escribe un identificador para la mesa");
    setGuardando(true);

    const url = modoEdicionId ? `${BASE_URL}/mesas/${modoEdicionId}` : `${BASE_URL}/mesas`;
    const method = modoEdicionId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setForm({ numero: '', zona: 'General', capacidad: 4 });
        setModoEdicionId(null);
        onActualizar();
      } else {
        const err = await res.json();
        alert(err.error || "Error al procesar la mesa");
      }
    } catch (err) { alert("Error de conexión con el servidor"); }
    setGuardando(false);
  };

  const handlePrepararEdicion = (m) => {
    setForm({ numero: m.numero, zona: m.zona, capacidad: m.capacidad });
    setModoEdicionId(m.id);
  };

  const handleCancelarEdicion = () => {
    setForm({ numero: '', zona: 'General', capacidad: 4 });
    setModoEdicionId(null);
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar la mesa "${nombre}" del mapa del restaurante?`)) return;
    try {
      await fetch(`${BASE_URL}/mesas/${id}`, { method: 'DELETE' });
      onActualizar();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex-1 p-6 md:p-8 bg-[#070b16] text-slate-100 font-sans select-none h-full flex flex-col overflow-hidden">
      
      {/* ENCABEZADO */}
      <header className="mb-6 shrink-0">
        <h1 className="text-3xl font-black text-white tracking-tight">Control de Distribución de Mesas</h1>
        <p className="text-xs text-slate-400 mt-1">Modifica la capacidad y distribución física de Terraza, VIP, Barra y Salón General.</p>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden items-start">
        
        {/* =========================================================================
            PANEL IZQUIERDO: FORMULARIO DE REGISTRO / EDICIÓN
            ========================================================================= */}
        <div className="w-full lg:w-80 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shrink-0 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <span>🪑</span> {modoEdicionId ? 'Modificando Mesa' : 'Registrar Mesa'}
            </span>
            {modoEdicionId && (
              <button onClick={handleCancelarEdicion} className="text-[10px] text-rose-400 hover:underline font-bold">Cancelar</button>
            )}
          </div>

          <form onSubmit={handleGuardar} className="space-y-4 text-xs font-bold text-slate-300">
            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-[10px] text-slate-400">Ubicación / Zona</label>
              <select 
                value={form.zona} 
                onChange={e => setForm({...form, zona: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-white focus:border-indigo-500 outline-none font-bold"
              >
                {zonasLista.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-[10px] text-slate-400">Identificador (Ej. M-6, T-10)</label>
              <input 
                type="text" 
                placeholder="M-6" 
                value={form.numero} 
                onChange={e => setForm({...form, numero: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none font-mono font-black text-sm tracking-wider uppercase text-center"
              />
            </div>

            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-[10px] text-slate-400">Capacidad de Comensales</label>
              <input 
                type="number" 
                min="1" max="30" 
                value={form.capacidad} 
                onChange={e => setForm({...form, capacidad: parseInt(e.target.value) || 1})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-emerald-400 focus:border-emerald-400 outline-none font-mono font-black text-sm text-center"
              />
            </div>

            <button 
              type="submit" 
              disabled={guardando}
              className={`w-full py-4 text-white font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer mt-2 ${
                modoEdicionId 
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20 text-slate-950' 
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
              }`}
            >
              {guardando ? 'Procesando...' : modoEdicionId ? '🔄 Actualizar Mesa' : '⚡ Inyectar al Salón'}
            </button>
          </form>
        </div>

        {/* =========================================================================
            PANEL DERECHO: DISTRIBUCIÓN PROPORCIONAL EN MEMORIA (Flex Wrap)
            ========================================================================= */}
        <div className="flex-1 w-full bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col h-full overflow-hidden shadow-inner">
          
          <div className="border-b border-slate-800 pb-3 mb-6 flex justify-between items-end shrink-0">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Distribución en Memoria ({mesas.length} Mesas)</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Las píldoras se auto-ajustan al texto para erradicar el espacio desaprovechado.</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-7 pr-2 scrollbar-thin scrollbar-thumb-slate-800 pb-12">
            {zonasLista.map(zona => {
              const lista = mesasPorZona[zona] || [];
              if (lista.length === 0) return null;

              return (
                <div key={zona} className="space-y-3 animate-fade-in">
                  
                  {/* Etiqueta de la Zona */}
                  <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1.5 pl-1">
                    <span className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-widest">{zona}</span>
                    <span className="text-[9px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-bold">{lista.length}</span>
                  </div>

                  {/* 🔥 MAGIA FLEX WRAP: Las tarjetas fluyen como texto continuo 🔥 */}
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {lista.map(m => {
                      const editandoEsta = modoEdicionId === m.id;

                      return (
                        <div
                          key={m.id}
                          className={`inline-flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border transition-all select-none group shrink-0 ${
                            editandoEsta
                              ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105 z-10'
                              : 'bg-[#0b1120] border-slate-800 hover:border-slate-600 text-slate-200'
                          }`}
                        >
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-black font-mono tracking-wider">{m.numero}</span>
                            <span className={`text-[10px] font-mono ${editandoEsta ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                              ({m.capacidad} pax)
                            </span>
                          </div>

                          {/* Botonera compacta integrada */}
                          <div className={`flex items-center gap-2 pl-2 border-l transition-opacity ${editandoEsta ? 'border-amber-600 opacity-100' : 'border-slate-800 opacity-30 group-hover:opacity-100'}`}>
                            <button onClick={() => handlePrepararEdicion(m)} className="hover:scale-125 transition-transform text-xs cursor-pointer" title="Modificar">✏️</button>
                            <button onClick={() => handleEliminar(m.id, m.numero)} className="hover:scale-125 transition-transform text-xs cursor-pointer" title="Borrar">🗑️</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}

            {mesas.length === 0 && (
              <div className="h-48 flex items-center justify-center text-slate-600 italic text-xs border border-dashed border-slate-800 rounded-2xl">
                No hay mesas registradas en la memoria.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}