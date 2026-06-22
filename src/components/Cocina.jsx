import React, { useState, useEffect } from 'react';

// Sub-componente para calcular el tiempo en vivo de cada tarjeta
const TimerPedido = ({ horaPedido }) => {
  const [minutos, setMinutos] = useState(0);

  useEffect(() => {
    const calcular = () => setMinutos(Math.floor((Date.now() - horaPedido) / 60000));
    calcular(); // Cálculo inicial
    const intervalo = setInterval(calcular, 10000); // Se actualiza cada 10 segundos
    return () => clearInterval(intervalo);
  }, [horaPedido]);

  // Lógica de semáforo de cocina
  let colorClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  let dotClass = "bg-emerald-400";
  let pulse = false;

  if (minutos >= 15) {
    colorClass = "bg-rose-500/20 text-rose-400 border-rose-500/30";
    dotClass = "bg-rose-400";
    pulse = true;
  } else if (minutos >= 10) {
    colorClass = "bg-amber-500/20 text-amber-400 border-amber-500/30";
    dotClass = "bg-amber-400";
  }

  return (
    <div className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-2 ${colorClass}`}>
      <span className={`w-2 h-2 rounded-full ${dotClass} ${pulse ? 'animate-ping' : ''}`}></span>
      {minutos} min
    </div>
  );
};


export default function Cocina({ pedidos, onCompletar }) {
  if (pedidos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 opacity-50">
        <svg className="w-24 h-24 text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
        <h2 className="text-2xl font-black text-slate-400">Cocina Despejada</h2>
        <p className="text-slate-500 font-medium">No hay comandas pendientes.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#020617] custom-scrollbar">
      {/* Grid masivo para la pantalla de la cocina */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        
        {pedidos.sort((a, b) => a.horaPedido - b.horaPedido).map((pedido) => (
          <div key={pedido.id} className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Cabecera del Ticket */}
            <div className="p-5 border-b border-slate-800 bg-slate-800/40 flex justify-between items-start">
              <div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Mesa</span>
                <span className="text-3xl font-black text-white leading-none">#{pedido.numMesa}</span>
              </div>
              <TimerPedido horaPedido={pedido.horaPedido} />
            </div>

            {/* Lista de Platillos (Letra gigante para lectura a distancia) */}
            <div className="flex-1 p-5 space-y-4 bg-slate-900/50">
              {pedido.platillos.map((p, index) => (
                <div key={index} className="flex gap-4 items-center border-b border-slate-800/80 pb-3 last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 font-black text-lg border border-slate-700 shrink-0">
                    {p.cantidad}
                  </div>
                  <span className="font-bold text-slate-200 text-lg leading-tight">
                    {p.nombre}
                  </span>
                </div>
              ))}
            </div>

            {/* Botón de Acción Táctil Gigante */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <button 
                onClick={() => onCompletar(pedido.id)}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-lg font-black tracking-wide uppercase transition-all shadow-[0_4px_20px_rgba(99,102,241,0.4)] cursor-pointer active:scale-95"
              >
                ¡Plato Listo!
              </button>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}