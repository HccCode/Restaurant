import React from 'react';

export default function Header() {
  return (
    <header className="h-20 border-b border-slate-800/50 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between px-8 z-10 shrink-0">
      <div>
        <h1 className="text-2xl font-serif font-bold text-white tracking-wide">Gestión de Servicio</h1>
        <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
          Servicio de Cena • Terminal Central
        </p>
      </div>

      <div className="flex items-center gap-5">
        {/* Buscador Elegante */}
        <div className="relative group">
          <svg style={{ width: '16px', height: '16px' }} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Buscar comensal..." 
            className="pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all w-64 text-white placeholder-slate-600"
          />
        </div>
        
        {/* Botón de Acción Principal */}
        <button className="bg-amber-600 hover:bg-amber-500 text-slate-900 px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-[0_4px_15px_0_rgba(217,119,6,0.3)]">
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Nueva Reserva
        </button>

        {/* Avatar Maître D' */}
        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center cursor-pointer hover:border-amber-500 transition-colors">
          <span className="text-xs font-bold text-amber-500">HM</span>
        </div>
      </div>
    </header>
  );
}