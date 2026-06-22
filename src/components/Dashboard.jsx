import React from 'react';

export default function Dashboard({ reservaciones = [], onIniciarCorteZ }) {
  // Cálculos rápidos de analítica interna para el panel gerencial
  const totalMesasHoy = reservaciones.length;
  const activas = reservaciones.filter(r => r.estado === 'en-curso').length;
  const terminadas = reservaciones.filter(r => r.estado === 'finalizadas').length;
  const noAsistio = reservaciones.filter(r => r.estado === 'canceladas' || r.estado === 'nuevas').length;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#020617] custom-scrollbar space-y-8">
      
      {/* Encabezado Principal */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Panel de Control Operativo</h1>
        <p className="text-xs text-slate-400 mt-1">Indicadores clave de rendimiento y auditoría financiera del turno actual.</p>
      </div>

      {/* Grid de Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-2">Tráfico Total</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalMesasHoy}</span>
            <span className="text-xs text-slate-400">mesas registradas</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px] block mb-2">Comensales Sentados</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{activas}</span>
            <span className="text-xs text-slate-400">mesas activas</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <span className="text-indigo-500 font-bold uppercase tracking-wider text-[10px] block mb-2">Cuentas Liquidadas</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-400">{terminadas}</span>
            <span className="text-xs text-slate-400">listas para archivar</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <span className="text-amber-500 font-bold uppercase tracking-wider text-[10px] block mb-2">Espera en Lobby</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{noAsistio}</span>
            <span className="text-xs text-slate-400">sin sentar</span>
          </div>
        </div>
      </div>

      {/* ================= SECCIÓN DE CONTROL ADMINISTRATIVO: CORTE Z ================= */}
      <div className="bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900 border border-rose-900/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 mt-12 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Cierre de Caja y Fiscal: Corte Z</h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Al ejecutar esta acción, el sistema consolidará todas las ventas cobradas, desglosará el IVA y emitirá el ticket de auditoría físico. **Advertencia:** Esto limpiará el flujo del salón e historizará las mesas actuales para el siguiente turno.
            </p>
          </div>
        </div>

        <button 
          onClick={onIniciarCorteZ}
          className="w-full md:w-auto px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_15px_rgba(225,29,72,0.3)] shrink-0 cursor-pointer active:scale-95"
        >
          Iniciar Cierre de Turno
        </button>
      </div>

    </div>
  );
}