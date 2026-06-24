import React, { useState, useEffect } from 'react';

export default function TableroReservaciones({ reservaciones, onMover, onEliminar, onEditar, usuario }) {
  const [mesasLayout, setMesasLayout] = useState([]);
  const BASE_URL = `http://${window.location.hostname}:3000/api`;

  const cargarMesas = async () => {
    try {
      const res = await fetch(`${BASE_URL}/mesas`);
      if (res.ok) setMesasLayout(await res.json());
    } catch (e) {}
  };

  useEffect(() => { cargarMesas(); }, [reservaciones]);

  // CATEGORÍAS KANBAN
  const columnas = [
    { id: 'pendientes', titulo: 'Pendientes', color: 'border-blue-500/40 text-blue-400' },
    { id: 'espera', titulo: 'Sala de Espera', color: 'border-amber-500/40 text-amber-400' },
    { id: 'en-curso', titulo: 'En Curso', color: 'border-emerald-500/40 text-emerald-400' }
  ];

  // FILTRAR SAlA DE ESPERA (Hostess y Gerentes únicamente)
  const esPersonalAutorizado = usuario?.rol === 'Gerente' || usuario?.rol === 'Hostess';
  
  // Calcular métricas de la sala de espera
  const clientesEsperando = reservaciones.filter(r => r.estado === 'espera');
  const totalPersonasEspera = clientesEsperando.reduce((acc, curr) => acc + (parseInt(curr.personas) || 0), 0);

  // Mapear cuáles números de mesa están ocupados hoy y quién los tiene
  const mapaMesasOcupadas = {};
  reservaciones.forEach(r => {
    if (r.estado === 'en-curso' && r.numMesa) {
      mapaMesasOcupadas[String(r.numMesa).toUpperCase().trim()] = r.nombre;
    }
  });

  return (
    <div className="flex-1 w-full h-full flex flex-col xl:flex-row overflow-hidden font-sans select-none p-4 md:p-6 gap-6 bg-[#070b16]">
      
      {/* =========================================================================
          COLUMNA IZQUIERDA: EL TABLERO KANBAN DE CONTROL
          ========================================================================= */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        
        {/* INDICADOR PRIVADO SAlA DE ESPERA */}
        {esPersonalAutorizado && (
          <div className="w-full bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between animate-fade-in shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-pulse">⏳</span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">Sala de Espera Activa</h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Control de flujo de comensales en recepción.</p>
              </div>
            </div>
            <div className="flex gap-4 font-mono">
              <div className="bg-slate-950/80 border border-slate-800 px-4 py-1.5 rounded-xl text-center">
                <span className="text-xs text-slate-500 block text-[9px] font-sans uppercase">Grupos</span>
                <span className="text-sm font-black text-white">{clientesEsperando.length}</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 px-4 py-1.5 rounded-xl text-center">
                <span className="text-xs text-slate-500 block text-[9px] font-sans uppercase">Total Pax</span>
                <span className="text-sm font-black text-emerald-400">{totalPersonasEspera}</span>
              </div>
            </div>
          </div>
        )}

        {/* LAS COLUMNAS KANBAN */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto pr-1">
          {columnas.map(col => {
            const lista = reservaciones.filter(r => r.estado === col.id);
            return (
              <div key={col.id} className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 flex flex-col h-[500px] md:h-full">
                <div className={`border-b pb-2 mb-3 font-black text-xs uppercase tracking-widest flex justify-between items-center ${col.color}`}>
                  <span>{col.titulo}</span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded font-mono text-[10px]">{lista.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {lista.map(r => (
                    <div key={r.id} className="bg-slate-950/90 border border-slate-800/80 p-3.5 rounded-xl space-y-2 relative group hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-white leading-tight">{r.nombre}</h4>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-slate-900 text-slate-400 rounded border border-slate-800 mt-1 inline-block">{r.hora} • {r.personas} pax</span>
                        </div>
                        {r.numMesa && <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-mono font-black px-2 py-0.5 rounded text-[10px] uppercase">Mesa: {r.numMesa}</span>}
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex justify-end gap-2 text-[10px] font-bold">
                        {col.id === 'pendientes' && <button onClick={() => onMover(r.id, 'espera')} className="text-amber-400 bg-amber-500/5 px-2 py-1 rounded hover:bg-amber-500/10 cursor-pointer">⏳ A Espera</button>}
                        {col.id !== 'en-curso' && <button onClick={() => onMover(r.id, 'en-curso')} className="text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded hover:bg-emerald-500/10 cursor-pointer">🚀 Sentar</button>}
                        {col.id === 'en-curso' && <button onClick={() => onMover(r.id, 'finalizadas')} className="text-slate-400 bg-slate-800 px-2 py-1 rounded hover:bg-slate-700 cursor-pointer">🏁 Cobrar</button>}
                        <button onClick={() => onEliminar(r.id)} className="text-rose-500 opacity-20 group-hover:opacity-100 p-1 cursor-pointer">🗑️</button>
                      </div>
                    </div>
                  ))}
                  {lista.length === 0 && <div className="text-center text-[11px] text-slate-600 font-serif italic py-10">Bandeja vacía</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          👇 COLUMNA DERECHA: EL MONITOR MAPA DE OCUPACIÓN EN VIVO 👇
          ========================================================================= */}
      <div className="w-full xl:w-80 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col h-fit xl:h-full shrink-0">
        <div className="border-b border-slate-800 pb-2 mb-4 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Ocupación en Tiempo Real</h3>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* AGRUPADOR POR ZONAS (Terraza, VIP, Barra, etc.) */}
          {['General', 'Terraza', 'VIP', 'Barra'].map(zona => {
            const mesasDeLaZona = mesasLayout.filter(m => m.zona === zona);
            if (mesasDeLaZona.length === 0) return null;

            return (
              <div key={zona} className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase block pl-1">{zona}</span>
                <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-3 gap-2">
                  {mesasDeLaZona.map(mesa => {
                    const clienteOcupando = mapaMesasOcupadas[String(mesa.numero).toUpperCase().trim()];
                    const estaOcupada = !!clienteOcupando;

                    return (
                      <div
                        key={mesa.id}
                        title={estaOcupada ? `Ocupada por: ${clienteOcupando}` : 'Disponible'}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center font-mono transition-all relative ${
                          estaOcupada
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-md shadow-rose-900/5' // <-- Rojo claro si está ocupada
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' // <-- Verde brillante si está disponible
                        }`}
                      >
                        <span className="text-xs font-black block tracking-wider">{mesa.numero}</span>
                        
                        {/* MINI METRICA DE CAPACIDAD */}
                        <span className="text-[9px] font-sans font-medium mt-0.5 opacity-40">👥 {mesa.capacidad}</span>

                        {/* SUBTEXTO DEL CLIENTE OCUPANDO */}
                        {estaOcupada && (
                          <span className="text-[8px] font-sans font-bold block truncate w-full mt-1 px-0.5 bg-rose-500/10 rounded text-rose-300">
                            {clienteOcupando.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}