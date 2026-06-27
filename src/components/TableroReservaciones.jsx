import React, { useState, useEffect } from 'react';

export default function TableroReservaciones({ reservaciones = [], onNuevaReserva, onEditarReserva, onEliminarReserva, onAsignarMesa, onMover, usuario }) {
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
    { id: 'pendientes', titulo: 'Pendientes', color: 'border-blue-500/40 text-blue-400', hex: 'bg-blue-500' },
    { id: 'espera', titulo: 'Sala de Espera', color: 'border-amber-500/40 text-amber-400', hex: 'bg-amber-500' },
    { id: 'en-curso', titulo: 'En Curso', color: 'border-emerald-500/40 text-emerald-400', hex: 'bg-emerald-500' }
  ];

  // 🔥 TRUCO MAGNÉTICO: Atrapa la reserva sin importar cómo la escribió SQL 🔥
  const empatarColumna = (reserva, colId) => {
    const est = String(reserva.estado || 'pendientes').toLowerCase().trim();
    
    if (colId === 'pendientes') return ['pendientes', 'pendiente', 'nuevas', 'nueva', 'confirmada', ''].includes(est);
    if (colId === 'espera')     return ['espera', 'sala-espera', 'arribo', 'en espera'].includes(est);
    if (colId === 'en-curso')   return ['en-curso', 'en curso', 'sentado', 'salon'].includes(est);
    return false;
  };

  const esPersonalAutorizado = usuario?.rol === 'Gerente' || usuario?.rol === 'Hostess';
  
  const clientesEsperando = reservaciones.filter(r => empatarColumna(r, 'espera'));
  const totalPersonasEspera = clientesEsperando.reduce((acc, curr) => acc + (parseInt(curr.personas) || 0), 0);

  const mapaMesasOcupadas = {};
  reservaciones.forEach(r => {
    if (empatarColumna(r, 'en-curso') && r.numMesa) {
      mapaMesasOcupadas[String(r.numMesa).toUpperCase().trim()] = r.nombre;
    }
  });

  return (
    <div className="flex-1 w-full h-full flex flex-col xl:flex-row overflow-hidden font-sans select-none p-4 md:p-6 gap-6 bg-[#070b16]">
      
      {/* COLUMNA IZQUIERDA: EL TABLERO KANBAN */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Flujo del Salón (Kanban)</h1>
            <p className="text-xs text-slate-400 mt-1">Controla el ciclo de vida del comensal y asigna mesas en vivo.</p>
          </div>
          
          <button
            onClick={onNuevaReserva}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>➕ Nueva Reservación</span>
          </button>
        </header>

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
                <span className="text-slate-500 block text-[9px] font-sans uppercase">Grupos</span>
                <span className="text-sm font-black text-white">{clientesEsperando.length}</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 px-4 py-1.5 rounded-xl text-center">
                <span className="text-slate-500 block text-[9px] font-sans uppercase">Total Pax</span>
                <span className="text-sm font-black text-emerald-400">{totalPersonasEspera}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto pr-1">
          {columnas.map(col => {
            const lista = reservaciones.filter(r => empatarColumna(r, col.id));
            
            return (
              <div key={col.id} className="bg-[#0b1120]/40 border border-slate-800/60 rounded-2xl p-4 flex flex-col h-[500px] md:h-full">
                
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800/80 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.hex}`}></span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">{col.titulo}</h3>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">{lista.length}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none">
                  {lista.length === 0 ? (
                    <div className="p-6 text-center text-slate-600 italic text-[11px] border border-dashed border-slate-800/80 rounded-xl mt-2">Bandeja vacía</div>
                  ) : (
                    lista.map(r => (
                      <TarjetaReserva 
                        key={r.id} 
                        r={r} 
                        colId={col.id}
                        onEditarReserva={onEditarReserva} 
                        onEliminarReserva={onEliminarReserva} 
                        onAsignarMesa={onAsignarMesa} 
                        onMover={onMover} 
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COLUMNA DERECHA: MAPA DE OCUPACIÓN EN VIVO */}
      <div className="w-full xl:w-80 bg-[#0a0f1d] border border-slate-800/80 rounded-2xl p-4 flex flex-col h-fit xl:h-full shrink-0">
        <div className="border-b border-slate-800 pb-2 mb-4 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Ocupación en Tiempo Real</h3>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 pb-20">
          {['General', 'Terraza', 'VIP', 'Barra', 'Salón Segundo Piso'].map(zona => {
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
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-md' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        }`}
                      >
                        <span className="text-xs font-black block tracking-wider">{mesa.numero}</span>
                        <span className="text-[9px] font-sans font-medium mt-0.5 opacity-40">👥 {mesa.capacidad}</span>
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
          {mesasLayout.length === 0 && (
            <p className="text-xs text-slate-500 text-center italic mt-10">Aún no has configurado tus mesas.</p>
          )}
        </div>
      </div>

    </div>
  );
}

function TarjetaReserva({ r, colId, onEditarReserva, onEliminarReserva, onAsignarMesa, onMover }) {
  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-md hover:border-slate-700 transition-all flex flex-col gap-3 group relative">
      <div className="flex justify-between items-center">
        <span className="bg-slate-950 px-2 py-0.5 rounded font-mono font-bold text-indigo-400 text-[10px]">⏰ {r.hora}</span>
        <span className="text-slate-400 text-[11px] font-bold">👥 {r.personas} pax</span>
      </div>

      <div>
        <h4 className="text-xs font-black text-white leading-tight truncate">{r.nombre}</h4>
        {r.telefono && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{r.telefono}</p>}
      </div>

      <div className="flex flex-wrap gap-1.5 items-center mt-1">
        <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded font-semibold">📍 {r.tipo}</span>
        
        {r.numMesa ? (
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-black uppercase font-mono">🪑 Mesa {r.numMesa}</span>
        ) : colId === 'en-curso' ? (
          <button onClick={() => onAsignarMesa(r)} className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] px-1.5 py-0.5 rounded font-black uppercase cursor-pointer animate-pulse">⚠️ Asignar Mesa</button>
        ) : null}
        
        {r.etiqueta && <span className="bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[9px] px-1.5 py-0.5 rounded font-bold">✨ {r.etiqueta}</span>}
      </div>

      <div className="flex justify-between items-center pt-2.5 border-t border-slate-800/60 mt-1">
        <div className="flex gap-2 text-slate-500">
          <button onClick={() => onEditarReserva(r)} className="hover:text-white transition-colors cursor-pointer text-xs" title="Editar">✏️</button>
          <button onClick={() => onEliminarReserva(r.id)} className="hover:text-rose-400 transition-colors cursor-pointer text-xs" title="Eliminar">🗑️</button>
          {!r.numMesa && colId !== 'en-curso' && (
            <button onClick={() => onAsignarMesa(r)} className="hover:text-emerald-400 transition-colors cursor-pointer text-xs" title="Vincular mesa">🪑</button>
          )}
        </div>

        <div className="flex gap-1.5">
          {colId === 'espera' && <button onClick={() => onMover(r.id, 'pendientes', r.numMesa)} className="w-6 h-6 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded flex items-center justify-center font-bold text-[10px] text-slate-400 hover:text-white cursor-pointer">◀</button>}
          {colId === 'en-curso' && <button onClick={() => onMover(r.id, 'espera', r.numMesa)} className="w-6 h-6 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded flex items-center justify-center font-bold text-[10px] text-slate-400 hover:text-white cursor-pointer">◀</button>}
          {colId === 'pendientes' && <button onClick={() => onMover(r.id, 'espera', r.numMesa)} className="text-[9px] px-2 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded font-bold uppercase cursor-pointer">A Espera ▶</button>}
          {colId === 'espera' && <button onClick={() => onMover(r.id, 'en-curso', r.numMesa)} className="text-[9px] px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded font-bold uppercase cursor-pointer">Sentar ▶</button>}
          {colId === 'en-curso' && <span className="text-slate-500 bg-slate-900 px-2 py-1 rounded select-none uppercase tracking-wider text-[8px]">En Salón</span>}
        </div>
      </div>
    </div>
  );
}