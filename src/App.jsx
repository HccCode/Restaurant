import React, { useState } from 'react';
import TableroReservaciones from './components/TableroReservaciones';

export default function App() {
  // Los datos de las reservas (en el futuro esto vendrá de tu base de datos)
  const [reservaciones, setReservaciones] = useState([
    { id: 1, nombre: 'Ana Gómez', hora: '14:00', personas: 4, estado: 'nuevas', tipo: 'Mesa VIP', color: 'from-violet-500 to-fuchsia-500' },
    { id: 2, nombre: 'Carlos Ruiz', hora: '14:30', personas: 2, estado: 'nuevas', tipo: 'Terraza', color: 'from-blue-400 to-indigo-500' },
    { id: 3, nombre: 'Familia Mendoza', hora: '13:15', personas: 6, estado: 'confirmadas', tipo: 'Aniversario', color: 'from-rose-400 to-orange-400' },
    { id: 4, nombre: 'Directiva', hora: '12:00', personas: 8, estado: 'en-curso', tipo: 'Negocios', color: 'from-emerald-400 to-teal-500' },
  ]);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* ================= BARRA LATERAL (SIDEBAR) ================= */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shadow-2xl z-20 shrink-0">
        <div>
          <div className="h-20 flex items-center px-6 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.5)] shrink-0">S</div>
            <span className="ml-3 font-extrabold text-xl tracking-tight text-white">Sabor<span className="text-indigo-400">.io</span></span>
          </div>

          <nav className="p-4 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 font-semibold transition-all">
              <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Tablero de Flujo
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-medium">
              <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Calendario
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Ocupación Sala Principal</h4>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 w-3/4 h-full"></div>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs font-semibold text-indigo-400">75% Lleno</p>
              <p className="text-xs font-medium text-slate-500">12 libres</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="flex-1 flex flex-col h-full bg-[#020617] relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Encabezado Superior (Header) */}
        <header className="h-20 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Gestión Operativa</h1>
            <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              Turno Matutino • Terminal Autorizada
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input type="text" placeholder="Buscar reserva..." className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-all w-64 text-white placeholder-slate-600" />
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]">
              <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Añadir Reserva
            </button>
          </div>
        </header>

        {/* ================= INYECCIÓN DEL TABLERO KANBAN ================= */}
        {/* Le pasamos las reservaciones como propiedad (props) al tablero */}
        <TableroReservaciones reservaciones={reservaciones} />
        
      </main>
    </div>
  );
}