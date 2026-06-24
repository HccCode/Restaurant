import React, { useState, useEffect } from 'react';

export default function Cocina({ pedidos, onCompletar }) {
  // Estado para refrescar los minutos transcurridos en tiempo real
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    // El reloj de cocina late cada 10 segundos para actualizar los temporizadores
    const intervalo = setInterval(() => setAhora(Date.now()), 10000); 
    return () => clearInterval(intervalo);
  }, []);

  // Calculador de minutos en vivo con indicador de demora
  const calcularTiempo = (horaMilisegundos) => {
    if (!horaMilisegundos) return { texto: '0 min', alerta: false };
    const diffMinutos = Math.floor((ahora - new Date(horaMilisegundos).getTime()) / 60000);
    const minLimpio = Math.max(0, diffMinutos);
    return {
      texto: `${minLimpio} min`,
      alerta: minLimpio >= 15 // Si una orden pasa de 15 minutos, el temporizador se vuelve rojo
    };
  };

  return (
    <div className="flex-1 bg-[#070b16] p-8 overflow-x-auto select-none min-h-[calc(100vh-80px)] flex gap-6 items-start">
      {(!pedidos || pedidos.length === 0) ? (
        <div className="w-full h-96 border-2 border-dashed border-slate-800/80 rounded-3xl flex flex-col items-center justify-center text-slate-500 gap-3 shadow-inner">
          <span className="text-6xl animate-bounce">🍳</span>
          <h2 className="text-xl font-black tracking-wide text-slate-400 uppercase font-sans">Cocina al día e impecable</h2>
          <p className="text-xs font-mono text-emerald-400/80 bg-emerald-950/30 px-4 py-1.5 rounded-full border border-emerald-800/30 font-bold">
            No hay comandas pendientes de preparación
          </p>
        </div>
      ) : (
        pedidos.map((pedido) => {
          const { texto: minStr, alerta: esDemora } = calcularTiempo(pedido.horaPedido);

          return (
            <div 
              key={pedido.id || Math.random()} 
              className={`min-w-[320px] max-w-sm bg-slate-900/80 border rounded-3xl p-6 flex flex-col justify-between shadow-2xl transition-all shrink-0 relative overflow-hidden ${
                esDemora ? 'border-rose-500/80 shadow-rose-500/10' : 'border-slate-800'
              }`}
            >
              {/* CABECERA DEL TICKET DE COCINA */}
              <div>
                <div className="flex justify-between items-start border-b border-slate-800/80 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-black font-mono tracking-widest text-slate-400 block uppercase">Comanda en Curso</span>
                    <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
                      MESA #{pedido.numMesa}
                    </h3>
                  </div>

                  <span className={`text-xs font-black font-mono px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${
                    esDemora 
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse font-extrabold' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${esDemora ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                    {minStr}
                  </span>
                </div>

                {/* LISTA DE PLATILLOS Y SUS NOTAS DE CLIENTE */}
                <div className="space-y-3.5 my-2 overflow-y-auto max-h-[55vh] pr-1">
                  {pedido.platillos?.map((item, idx) => {
                    // Atrapa la nota sin importar si en base de datos se llamó comentario, nota o notas
                    const notaLimpia = item.comentario || item.nota || item.notas || '';

                    return (
                      <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 transition-all hover:border-slate-700 shadow-sm">
                        
                        {/* CANTIDAD Y NOMBRE DEL PLATILLO */}
                        <div className="flex items-start gap-3">
                          <span className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-black font-mono px-2.5 py-1 rounded-xl shrink-0 mt-0.5">
                            {item.cantidad}x
                          </span>
                          <span className="text-white font-extrabold text-sm leading-snug pt-0.5">
                            {item.nombre || item.platillo}
                          </span>
                        </div>

                        {/* 👇 CAJÓN AMARILLO DE NOTAS (LA SOLUCIÓN A TU PROBLEMA) 👇 */}
                        {notaLimpia.trim() !== '' && (
                          <div className="mt-2.5 ml-9 px-3 py-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-200 text-xs font-medium flex items-start gap-2 shadow-inner">
                            <span className="text-amber-400 select-none text-sm leading-none mt-0.5">⚠️</span>
                            <div className="leading-relaxed">
                              <span className="text-[10px] font-black uppercase font-mono tracking-wider text-amber-400/90 block mb-0.5">Nota de Preparación:</span>
                              {notaLimpia}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BOTÓN DE DESPACHO */}
              <button
                onClick={() => onCompletar(pedido.id)}
                className="w-full mt-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 border border-indigo-400/20"
              >
                <span>🚀</span>
                <span>¡Plato Listo / Despachar!</span>
              </button>

            </div>
          );
        })
      )}
    </div>
  );
}