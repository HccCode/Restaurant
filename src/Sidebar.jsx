import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shadow-2xl z-20 shrink-0">
      <div>
        {/* Logo Elite */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-900 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
            S
          </div>
          <span className="ml-3 font-extrabold text-xl tracking-widest text-white uppercase font-serif">
            Sabor<span className="text-amber-500 font-sans">.io</span>
          </span>
        </div>

        {/* Menú de Maître D' */}
        <nav className="p-4 space-y-2 mt-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 font-semibold transition-all shadow-sm">
            <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            <span className="text-sm tracking-wide">Plano de Sala</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-medium">
            <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span className="text-sm tracking-wide">Libro de Reservas</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-medium">
            <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
            <span className="text-sm tracking-wide">Directorio VIP</span>
          </button>
        </nav>
      </div>

      {/* Estado del Restaurante */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Ocupación Salón Principal</h4>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-amber-400 w-[85%] h-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
          </div>
          <div className="flex justify-between mt-3">
            <p className="text-xs font-semibold text-amber-500">85% Capacidad</p>
            <p className="text-xs font-medium text-slate-500">3 Mesas Libres</p>
          </div>
        </div>
      </div>
    </aside>
  );
}