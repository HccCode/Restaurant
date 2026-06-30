import React, { useState, useEffect } from 'react';

export default function Cocina({ pedidos, onCompletar }) {
  // Estado para refrescar los minutos transcurridos en tiempo real
  const [ahora, setAhora] = useState(Date.now());
  
  // 🔥 NUEVO ESTADO: Mapa de zonas y mesas del restaurante 🔥
  const [mesasLayout, setMesasLayout] = useState([]);
  const BASE_URL = `http://${window.location.hostname}:3000/api`;

  useEffect(() => {
    // 1. Cargamos el mapa del restaurante en silencio para poder analizar los tickets
    fetch(`${BASE_URL}/mesas`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setMesasLayout(data))
      .catch(() => {});

    // 2. El reloj de cocina late cada 10 segundos
    const intervalo = setInterval(() => setAhora(Date.now()), 10000); 
    return () => clearInterval(intervalo);
  }, []);

  // Calculador de minutos en vivo con indicador de demora
  const calcularTiempo = (horaMilisegundos) => {
    if (!horaMilisegundos) return { texto: '0 min', alerta: false, diffMins: 0 };
    const diffMinutos = Math.floor((ahora - new Date(horaMilisegundos).getTime()) / 60000);
    const minLimpio = Math.max(0, diffMinutos);
    return {
      texto: `${minLimpio} min`,
      alerta: minLimpio >= 15,
      diffMins: minLimpio
    };
  };

  // =========================================================================
  // 🔥 MOTOR DE PRIORIDAD DE ZONAS PARA EL CHEF 🔥
  // =========================================================================
  const prioridadesGlobales = {
    'VIP': { nivel: 1, icono: '💎', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30' },
    'Terraza': { nivel: 2, icono: '🌅', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    'General': { nivel: 3, icono: '🍽️', color: 'text-slate-300', bg: 'bg-slate-800', border: 'border-slate-700' },
    'Salón Segundo Piso': { nivel: 4, icono: '🏙️', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    'Segundo Piso': { nivel: 4, icono: '🏙️', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    'Barra': { nivel: 5, icono: '🍸', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
  };

  // Pre-procesamos los pedidos para inyectarles su zona y nivel de prioridad
  const pedidosConPrioridad = (pedidos || []).map(pedido => {
    // Buscamos la mesa en el mapa
    const mesaEncontrada = mesasLayout.find(m => String(m.numero).toUpperCase().trim() === String(pedido.numMesa).toUpperCase().trim());
    const zonaStr = mesaEncontrada ? mesaEncontrada.zona : 'General';
    const configZona = prioridadesGlobales[zonaStr] || prioridadesGlobales['General'];

    return {
      ...pedido,
      zona: zonaStr,
      nivelPrioridad: configZona.nivel,
      configZona: configZona,
      ...calcularTiempo(pedido.horaPedido) // Inyectamos el cálculo de tiempo para usarlo en el ordenamiento
    };
  });

  // Ordenamos mágicamente la pantalla: 
  // 1ro: Los más demorados (por si una barra se atoró mucho tiempo)
  // 2do: Si tienen el mismo tiempo, gana la Zona con mayor jerarquía (VIP primero)
  const pedidosOrdenados = [...pedidosConPrioridad].sort((a, b) => {
    if (b.diffMins !== a.diffMins) {
      return b.diffMins - a.diffMins; // El más viejo (mayor número) va primero
    }
    return a.nivelPrioridad - b.nivelPrioridad; // Si el tiempo es igual, el nivel de zona más bajo (ej. 1 VIP) va primero
  });
  // =========================================================================

  return (
    <div className="flex-1 bg-[#070b16] p-8 overflow-x-auto select-none min-h-[calc(100vh-80px)] flex gap-6 items-start">
      {pedidosOrdenados.length === 0 ? (
        <div className="w-full h-96 border-2 border-dashed border-slate-800/80 rounded-3xl flex flex-col items-center justify-center text-slate-500 gap-3 shadow-inner">
          <span className="text-6xl animate-bounce">🍳</span>
          <h2 className="text-xl font-black tracking-wide text-slate-400 uppercase font-sans">Cocina al día e impecable</h2>
          <p className="text-xs font-mono text-emerald-400/80 bg-emerald-950/30 px-4 py-1.5 rounded-full border border-emerald-800/30 font-bold">
            No hay comandas pendientes de preparación
          </p>
        </div>
      ) : (
        pedidosOrdenados.map((pedido) => {
          return (
            <div 
              key={pedido.id || Math.random()} 
              className={`min-w-[320px] max-w-sm bg-slate-900/80 border rounded-3xl p-6 flex flex-col justify-between shadow-2xl transition-all shrink-0 relative overflow-hidden ${
                pedido.alerta ? 'border-rose-500/80 shadow-[0_0_30px_rgba(225,29,72,0.15)]' : 'border-slate-800'
              }`}
            >
              {/* CABECERA DEL TICKET DE COCINA */}
              <div>
                <div className="flex justify-between items-start border-b border-slate-800/80 pb-4 mb-4 relative">
                  <div>
                    <span className="text-[10px] font-black font-mono tracking-widest text-slate-400 block uppercase">Comanda en Curso</span>
                    <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
                      MESA #{pedido.numMesa}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {/* 🔥 ETIQUETA VISUAL DE PRIORIDAD PARA EL CHEF 🔥 */}
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border flex items-center gap-1.5 shadow-sm ${pedido.configZona.bg} ${pedido.configZona.border} ${pedido.configZona.color}`}>
                      <span>{pedido.configZona.icono}</span> {pedido.zona}
                    </span>
                    
                    {/* TEMPORIZADOR */}
                    <span className={`text-xs font-black font-mono px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${
                      pedido.alerta 
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse font-extrabold' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pedido.alerta ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                      {pedido.texto}
                    </span>
                  </div>
                </div>

                {/* LISTA DE PLATILLOS Y SUS NOTAS DE CLIENTE */}
                <div className="space-y-3.5 my-2 overflow-y-auto max-h-[55vh] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {pedido.platillos?.map((item, idx) => {
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

                        {/* CAJÓN AMARILLO DE NOTAS */}
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