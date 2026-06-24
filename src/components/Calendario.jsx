import React, { useState } from 'react';

export default function Calendario({ reservaciones, reservas, onAbrirModal, onEditar, onEliminar }) {
  const lista = reservaciones || reservas || [];
  const [fechaBase, setFechaBase] = useState(new Date());

  const año = fechaBase.getFullYear();
  const mes = fechaBase.getMonth(); 

  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const primerDiaDelMes = new Date(año, mes, 1);
  const totalDiasDelMes = new Date(año, mes + 1, 0).getDate();
  const huecosIniciales = primerDiaDelMes.getDay(); 

  const diasGrid = [];
  for (let i = 0; i < huecosIniciales; i++) diasGrid.push(null);
  for (let d = 1; d <= totalDiasDelMes; d++) {
    const mesFormateado = String(mes + 1).padStart(2, '0');
    const diaFormateado = String(d).padStart(2, '0');
    diasGrid.push(`${año}-${mesFormateado}-${diaFormateado}`);
  }

  const hoyISO = new Date().toISOString().split('T')[0];

  const limpiarFecha = (fstr) => fstr ? String(fstr).split('T')[0] : '';

  return (
    <div className="flex-1 p-8 bg-[#070b16] text-slate-100 flex flex-col h-[calc(100vh-80px)] select-none">
      
      {/* NAVEGACIÓN */}
      <div className="flex justify-between items-center mb-6 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => setFechaBase(new Date(año, mes - 1, 1))} className="w-10 h-10 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center font-bold transition-all cursor-pointer">←</button>
          <h2 className="text-xl font-black tracking-wider uppercase text-white">{nombresMeses[mes]} <span className="text-indigo-400 font-mono">{año}</span></h2>
          <button onClick={() => setFechaBase(new Date(año, mes + 1, 1))} className="w-10 h-10 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center font-bold transition-all cursor-pointer">→</button>
        </div>
        <button onClick={() => setFechaBase(new Date())} className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer">Ir a Hoy</button>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-3 text-center">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
          <span key={d} className="text-[11px] font-black uppercase tracking-widest text-slate-500">{d}</span>
        ))}
      </div>

      {/* GRILLA */}
      <div className="grid grid-cols-7 gap-3 flex-1 overflow-y-auto pr-1">
        {diasGrid.map((fechaStr, index) => {
          if (!fechaStr) return <div key={index} className="bg-slate-950/10 rounded-2xl border border-slate-900/20 min-h-[110px]"></div>;

          const numDia = parseInt(fechaStr.split('-')[2]);
          const esHoy = fechaStr === hoyISO;
          const reservasDelDia = lista.filter(r => limpiarFecha(r.fecha) === fechaStr);

          return (
            <div 
              key={index}
              onClick={() => onAbrirModal(fechaStr)}
              className={`bg-slate-900/40 border rounded-2xl p-3 flex flex-col justify-between transition-all cursor-pointer hover:border-indigo-500/60 hover:bg-slate-800/30 min-h-[120px] group ${
                esHoy ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/5' : 'border-slate-800/80'
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-xs font-black font-mono w-6 h-6 rounded-full flex items-center justify-center ${esHoy ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 group-hover:text-white'}`}>
                  {numDia}
                </span>
                {reservasDelDia.length > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-md">
                    {reservasDelDia.length}
                  </span>
                )}
              </div>

              {/* LISTA DE RESERVAS DEL DÍA */}
              <div className="space-y-1 overflow-y-auto max-h-24 pr-1">
                {reservasDelDia.map(res => (
                  <div 
                    key={res.id}
                    onClick={(e) => { e.stopPropagation(); onEditar(res); }}
                    className="text-[10px] bg-slate-950 hover:bg-indigo-950 text-slate-300 font-medium p-1.5 rounded-lg border border-slate-800/80 transition-all flex items-center justify-between group/item shadow-sm"
                  >
                    <span className="truncate pr-1">
                      <b className="text-indigo-400 font-mono">{res.hora}</b> {res.nombre}
                    </span>

                    {/* BOTÓN ELIMINAR EXCLUSIVO */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        if (window.confirm(`¿Cancelar definitivamente la reserva de "${res.nombre}" (${res.hora})?`)) {
                          onEliminar(res.id);
                        }
                      }}
                      className="opacity-0 group-hover/item:opacity-100 hover:scale-125 text-slate-500 hover:text-rose-400 px-1 transition-all cursor-pointer shrink-0"
                      title="Eliminar reserva"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}