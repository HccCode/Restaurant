import React, { useState, useEffect } from 'react';

export default function ControlMesas() {
  const [mesas, setMesas] = useState([]);
  const [form, setForm] = useState({ numero: '', zona: 'General', capacidad: 4 });
  const [editandoId, setEditandoId] = useState(null);
  const [alerta, setAlerta] = useState(null);

  const BASE_URL = `http://${window.location.hostname}:3000/api`;
  const zonasDisponibles = ['General', 'Terraza', 'VIP', 'Barra', 'Salón Segundo Piso'];

  const cargarMesas = async () => {
    try {
      const res = await fetch(`${BASE_URL}/mesas`);
      if (res.ok) setMesas(await res.json());
    } catch (e) { setAlerta({ tipo: 'error', texto: 'Error de red al cargar el layout' }); }
  };

  // 👇 CORREGIDO: Eliminamos cargarCarta() que se había colado por error 👇
  useEffect(() => { 
    cargarMesas(); 
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.numero) return;

    const url = editandoId ? `${BASE_URL}/mesas/${editandoId}` : `${BASE_URL}/mesas`;
    const metodo = editandoId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setAlerta({ tipo: 'ok', texto: editandoId ? 'Mesa actualizada en el layout' : 'Mesa inyectada al Salón' });
        setForm({ numero: '', zona: 'General', capacidad: 4 });
        setEditandoId(null);
        cargarMesas();
        setTimeout(() => setAlerta(null), 3000);
      } else {
        alert(data.error || 'Error al guardar la mesa');
      }
    } catch (err) { alert('Error de comunicación con el servidor'); }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Retirar definitivamente esta mesa de la distribución física?')) return;
    try {
      const res = await fetch(`${BASE_URL}/mesas/${id}`, { method: 'DELETE' });
      if (res.ok) { 
        cargarMesas(); 
        setAlerta({ tipo: 'ok', texto: 'Mesa removida del mapa' }); 
        setTimeout(() => setAlerta(null), 2000); 
      }
    } catch (e) {}
  };

  return (
    <div className="flex-1 p-6 md:p-8 bg-[#070b16] text-slate-100 min-h-screen overflow-y-auto font-sans select-none">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Control de Distribución de Mesas</h1>
        <p className="text-xs text-slate-400 mt-1">Modifica la capacidad y distribución física de Terraza, VIP, Barra y Salón General.</p>
      </div>

      {alerta && (
        <div className={`p-4 rounded-xl mb-4 text-xs font-mono font-bold text-center ${
          alerta.tipo === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          {alerta.texto}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL IZQUIERDO: FORMULARIO */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs font-bold text-slate-400 shadow-xl">
          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest">
            {editandoId ? '✏️ Modificar Mesa' : '🪑 Registrar Nueva Mesa'}
          </h3>
          
          <div>
            <label className="block mb-1">Identificador / Número de Mesa</label>
            <input 
              type="text" 
              required 
              placeholder="Ej. T-4 o 12" 
              value={form.numero} 
              onChange={e => setForm({...form, numero: e.target.value})} 
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none focus:border-indigo-500 text-center font-mono text-sm font-black uppercase" 
            />
          </div>

          <div>
            <label className="block mb-1">Ubicación / Zona</label>
            <select 
              value={form.zona} 
              onChange={e => setForm({...form, zona: e.target.value})} 
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none cursor-pointer"
            >
              {zonasDisponibles.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-1">Capacidad Máxima de Comensales</label>
            <input 
              type="number" 
              required 
              min="1" 
              max="30" 
              value={form.capacidad} 
              onChange={e => setForm({...form, capacidad: parseInt(e.target.value) || 4})} 
              className="w-full bg-slate-950 border border-slate-800 text-emerald-400 rounded-xl p-3 outline-none font-mono font-black text-center" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-lg transition-transform active:scale-95"
          >
            {editandoId ? 'Actualizar Layout' : 'Inyectar al Salón'}
          </button>

          {editandoId && (
            <button 
              type="button" 
              onClick={() => { setEditandoId(null); setForm({ numero: '', zona: 'General', capacidad: 4 }); }} 
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
          )}
        </form>

        {/* PANEL DERECHO: DISTRIBUCIÓN ACTUAL */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
            Distribución en Memoria ({mesas.length} mesas configuradas)
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mesas.map(m => (
              <div key={m.id} className="bg-slate-950/80 border border-slate-800/60 p-4 rounded-xl flex items-center justify-between group hover:border-slate-700 transition-colors">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-indigo-400 uppercase">
                    {m.zona}
                  </span>
                  <p className="text-xl font-mono font-black text-white mt-1.5">{m.numero}</p>
                  <p className="text-[10px] font-normal text-slate-500 mt-0.5">👥 Capacidad: {m.capacidad} pax</p>
                </div>

                <div className="flex flex-col gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setForm(m); setEditandoId(m.id); }} 
                    className="p-1.5 hover:text-amber-400 text-slate-500 text-xs cursor-pointer"
                    title="Editar mesa"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleEliminar(m.id)} 
                    className="p-1.5 hover:text-rose-400 text-slate-500 text-xs cursor-pointer"
                    title="Eliminar mesa"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}