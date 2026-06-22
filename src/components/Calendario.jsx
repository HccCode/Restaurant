import React, { useState } from 'react';

export default function Calendario({ reservaciones, onAbrirModal, onEditar, onEliminar }) {
  const hoy = new Date().toISOString().split('T')[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

  const reservasDelDia = reservaciones.filter(r => r.fecha === fechaSeleccionada);
  const diasMes = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden p-6 gap-6">
      
      {/* PANEL IZQUIERDO: Contenedor expandido al +20% exacto (max-w-[595px]) */}
      <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
        
        {/* <-- AQUÍ ESTÁ EL AJUSTE: max-w-[920px] */}
        <div className="w-full max-w-[920px] flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-white">Junio 2026</h2>
            <div className="flex gap-2">
              <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
              <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
            </div>
          </div>

          {/* Regresamos el gap a 2 (8px) porque ahora hay espacio de sobra */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
              <div key={dia} className="text-center text-xs font-bold text-slate-500 uppercase">{dia}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 flex-1 content-start">
            <div className="aspect-square"></div>
            {diasMes.map(dia => {
              const fechaCelda = `2026-06-${dia.toString().padStart(2, '0')}`;
              const isSelected = fechaCelda === fechaSeleccionada;
              const isToday = fechaCelda === hoy;
              const countReservas = reservaciones.filter(r => r.fecha === fechaCelda).length;

              return (
                <button 
                  key={dia}
                  onClick={() => setFechaSeleccionada(fechaCelda)}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all ${
                    isSelected ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)] scale-105' 
                    : isToday ? 'bg-slate-800/80 border-slate-500 text-white'
                    : 'bg-slate-900/50 border-slate-800/50 hover:border-slate-600 text-slate-400 hover:text-white'
                  }`}
                >
                  {/* <-- Aumentamos la fuente de text-sm a text-base para rellenar la nueva super-celda */}
                  <span className="text-base font-bold">{dia}</span>
                  {countReservas > 0 && <span className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-400' : 'bg-emerald-500'}`}></span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* PANEL DERECHO (Se mantiene intacto con tus etiquetas al +5%) */}
      <div className="w-full md:w-96 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col backdrop-blur-sm overflow-hidden shrink-0">
        <div className="p-6 border-b border-slate-800 bg-slate-800/30">
          <h3 className="font-bold text-white text-lg">Agenda Diaria</h3>
          <p className="text-xs text-indigo-400 font-semibold mt-1">
            {fechaSeleccionada === hoy ? 'Hoy' : fechaSeleccionada}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {reservasDelDia.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-500">
              <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <p className="text-sm font-medium">No hay reservas agendadas</p>
            </div>
          ) : (
            reservasDelDia.sort((a,b) => a.hora.localeCompare(b.hora)).map(reserva => (
              <div key={reserva.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex gap-4 relative overflow-visible group">
                <div className={`absolute left-0 top-0 w-1 h-full bg-gradient-to-b ${reserva.color}`}></div>
                
                <div className="flex flex-col items-center justify-center pr-4 border-r border-slate-700">
                  <span className="text-sm font-extrabold text-white">{reserva.hora}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-200 text-sm">{reserva.nombre}</h4>
                    
                    <div className="relative">
                      <button onClick={() => setMenuAbiertoId(menuAbiertoId === reserva.id ? null : reserva.id)} className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                      </button>

                      {menuAbiertoId === reserva.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuAbiertoId(null)}></div>
                          <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-fade-in">
                            <button onClick={() => { onEditar(reserva); setMenuAbiertoId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-indigo-400 transition-colors flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg> Editar
                            </button>
                            <button onClick={() => { onEliminar(reserva.id); setMenuAbiertoId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-colors flex items-center gap-2 border-t border-slate-800 mt-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2.5 flex-wrap">
                    <span className="text-[10.5px] bg-slate-900 text-slate-300 px-2.5 py-1 rounded border border-slate-700 font-medium">{reserva.personas} Pax</span>
                    <span className="text-[10.5px] bg-slate-900 text-indigo-300 px-2.5 py-1 rounded border border-slate-700 font-medium">{reserva.tipo}</span>
                    
                    {reserva.etiqueta && reserva.etiqueta !== 'Normal' && (
                      <span className="text-[10.5px] bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded border border-rose-500/20 font-bold tracking-wider uppercase">
                        {reserva.etiqueta}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button 
            onClick={() => onAbrirModal(fechaSeleccionada)} 
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            Agendar para este día
          </button>
        </div>
      </div>
    </div>
  );
}