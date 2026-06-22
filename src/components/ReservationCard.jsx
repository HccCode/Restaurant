import React, { useState } from 'react';

export default function ReservationCard({ reserva, onMover, onEliminar, onEditar }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Variable de seguridad: Si está finalizada, se bloquea su movimiento
  const isLocked = reserva.estado === 'finalizadas';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('idReserva', reserva.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      draggable={!isLocked} // <-- CANDADO: Ya no se puede arrastrar si está pagada
      onDragStart={!isLocked ? handleDragStart : undefined}
      className={`bg-slate-800 p-4 rounded-xl border border-slate-700 transition-all shadow-lg relative overflow-visible group ${
        isLocked 
          ? 'opacity-80 cursor-default' // Aspecto de tarjeta bloqueada/inactiva
          : 'cursor-grab active:cursor-grabbing hover:border-indigo-500/50 hover:bg-slate-750'
      }`}
    >
      <div className={`absolute left-0 top-0 w-1 h-full bg-gradient-to-b ${reserva.color} opacity-70`}></div>
      
      <div className="flex justify-between items-start mb-3 pl-2">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${reserva.color} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
            {reserva.nombre.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
              {reserva.numMesa && (reserva.estado === 'en-curso' || reserva.estado === 'finalizadas') && (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-black">
                  #{reserva.numMesa}
                </span>
              )}
              {reserva.nombre}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{reserva.tipo}</p>
            
            {reserva.telefono && (
              <div className="text-[10.5px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                {reserva.telefono}
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <button onClick={() => setMenuAbierto(!menuAbierto)} className="text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors p-1.5 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
          </button>

          {menuAbierto && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuAbierto(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-fade-in">
                
                <button onClick={() => { onEditar(reserva); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2 cursor-pointer border-b border-slate-800/80 bg-indigo-500/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  Editar datos
                </button>

                {/* CANDADO: Si no está bloqueada, mostramos las opciones de mover */}
                {!isLocked && (
                  <>
                    <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/40">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mover a:</span>
                    </div>
                    {reserva.estado !== 'nuevas' && <button onClick={() => { onMover(reserva.id, 'nuevas'); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-colors cursor-pointer">Nuevas Reservas</button>}
                    {reserva.estado !== 'confirmadas' && <button onClick={() => { onMover(reserva.id, 'confirmadas'); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors cursor-pointer">Confirmadas</button>}
                    {reserva.estado !== 'en-curso' && <button onClick={() => { onMover(reserva.id, 'en-curso'); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors cursor-pointer">En Sala (Comiendo)</button>}
                    {/* El botón manual a 'Finalizadas' fue eliminado a propósito aquí */}
                  </>
                )}
                
                <div className="border-t border-slate-800 mt-1 pt-1">
                  <button onClick={() => { onEliminar(reserva.id); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-colors flex items-center gap-2 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> Cancelar / Eliminar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 pl-2 flex-wrap mt-1">
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded text-[10.5px] font-semibold text-indigo-300 border border-slate-700/50">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {reserva.hora}
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded text-[10.5px] font-semibold text-rose-300 border border-slate-700/50">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          {reserva.personas} Pax
        </div>
        {reserva.etiqueta && reserva.etiqueta !== 'Normal' && (
          <span className="text-[10.5px] bg-rose-500/10 text-rose-400 px-2.5 py-1.5 rounded border border-rose-500/20 font-bold tracking-wider uppercase ml-0.5">
            {reserva.etiqueta}
          </span>
        )}
      </div>
    </div>
  );
}