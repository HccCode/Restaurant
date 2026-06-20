import React from 'react';

export default function ReservationCard({ reserva }) {
  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-750 transition-all cursor-grab shadow-lg relative overflow-hidden group">
      
      {/* Brillo lateral dinámico según el color de la reserva */}
      <div className={`absolute left-0 top-0 w-1 h-full bg-gradient-to-b ${reserva.color} opacity-70`}></div>
      
      <div className="flex justify-between items-start mb-4 pl-2">
        <div className="flex items-center gap-3">
          {/* Avatar con la inicial del cliente */}
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${reserva.color} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
            {reserva.nombre.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-sm">{reserva.nombre}</h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{reserva.tipo}</p>
          </div>
        </div>
        
        {/* Botón de opciones (tres puntitos) */}
        <button className="text-slate-500 hover:text-white transition-colors">
          <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
          </svg>
        </button>
      </div>
      
      {/* Detalles: Hora y Personas */}
      <div className="flex items-center gap-2 pl-2">
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1.5 rounded text-[10px] font-semibold text-indigo-300 border border-slate-700/50">
          <svg style={{ width: '12px', height: '12px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {reserva.hora}
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1.5 rounded text-[10px] font-semibold text-rose-300 border border-slate-700/50">
          <svg style={{ width: '12px', height: '12px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          {reserva.personas} Personas
        </div>
      </div>
    </div>
  );
}