import React, { useState, useEffect } from 'react';

export default function ModalAsignarMesa({ isOpen, onClose, onConfirm, reserva, mesasOcupadas }) {
  const [mesasLayout, setMesasLayout] = useState([]);
  const BASE_URL = `http://${window.location.hostname}:3000/api`;

  // Cargar el mapa real de mesas desde SQL al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetch(`${BASE_URL}/mesas`)
        .then(res => res.json())
        .then(data => setMesasLayout(data))
        .catch(err => console.error("Error cargando mesas para asignación:", err));
    }
  }, [isOpen]);

  if (!isOpen || !reserva) return null;

  // Agrupar las mesas por zonas
  const zonas = ['General', 'Terraza', 'VIP', 'Barra', 'Salón Segundo Piso'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* BOTÓN CERRAR */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* CABECERA */}
        <div className="mb-6 pr-10 shrink-0">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">Asignación de Mesa</h2>
          <p className="text-slate-400 text-sm mt-1">
            Sentando a <span className="font-bold text-indigo-400">{reserva.nombre}</span> ({reserva.personas} pax)
          </p>
        </div>

        {/* CONTENEDOR CON SCROLL DE ZONAS */}
        <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
          
          {zonas.map(zona => {
            const mesasDeEstaZona = mesasLayout.filter(m => m.zona === zona);
            if (mesasDeEstaZona.length === 0) return null;

            return (
              <div key={zona}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xs font-black tracking-widest uppercase text-slate-500">{zona}</h3>
                  <div className="flex-1 border-t border-slate-800"></div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {mesasDeEstaZona.map(mesa => {
                    // Verificamos si alguien ya tiene este código exacto en "en-curso"
                    const ocupante = mesasOcupadas.find(occ => occ.num === String(mesa.numero).toUpperCase().trim());
                    const estaOcupada = !!ocupante;
                    
                    // Alerta visual si la mesa seleccionada es muy pequeña para el grupo
                    const capacidadJusta = parseInt(mesa.capacidad) < parseInt(reserva.personas);

                    return (
                      <button
                        key={mesa.id}
                        disabled={estaOcupada}
                        onClick={() => onConfirm(mesa.numero)}
                        title={estaOcupada ? `Mesa ocupada por ${ocupante.nombre}` : `Asignar mesa ${mesa.numero}`}
                        className={`relative p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          estaOcupada
                            ? 'bg-slate-950/80 border-rose-500/30 text-slate-600 cursor-not-allowed opacity-50' // Bloqueada
                            : 'bg-slate-900 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 hover:-translate-y-1 hover:shadow-[0_4px_15px_rgba(16,185,129,0.2)]' // Disponible
                        }`}
                      >
                        <span className="text-lg font-mono font-black block tracking-wider">{mesa.numero}</span>
                        <span className={`text-[10px] font-sans font-medium mt-1 ${capacidadJusta && !estaOcupada ? 'text-amber-400 font-bold' : 'opacity-60'}`}>
                          👥 {mesa.capacidad} pax
                        </span>

                        {estaOcupada && (
                          <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                            Ocupada
                          </span>
                        )}
                        
                        {capacidadJusta && !estaOcupada && (
                          <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm" title="¡Atención! Mesa pequeña para el grupo">
                            !
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {mesasLayout.length === 0 && (
            <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
              <span className="text-4xl block mb-2 opacity-50">🪑</span>
              <p className="text-slate-400 text-sm font-bold">No hay mesas configuradas en el sistema.</p>
              <p className="text-slate-500 text-xs mt-1">Acude a "Control de Mesas" en Administración para diseñar tu salón.</p>
            </div>
          )}

        </div>

        {/* PIE DEL MODAL */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end shrink-0">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
          >
            Cancelar Asignación
          </button>
        </div>

      </div>
    </div>
  );
}