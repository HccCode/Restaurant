import React from 'react';
import ReservationCard from './ReservationCard'; // Importamos la tarjeta

export default function TableroReservaciones({ reservaciones }) {
  // Definimos la estructura de nuestras columnas
  const columnas = [
    { id: 'nuevas', titulo: 'Nuevas Reservas', border: 'border-blue-500', bg: 'bg-blue-500/10' },
    { id: 'confirmadas', titulo: 'Confirmadas', border: 'border-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'en-curso', titulo: 'En Sala (Comiendo)', border: 'border-amber-500', bg: 'bg-amber-500/10' },
    { id: 'finalizadas', titulo: 'Finalizadas / Pago', border: 'border-slate-500', bg: 'bg-slate-500/10' },
  ];

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 z-10">
      <div className="flex gap-6 h-full min-w-max">
        
        {columnas.map((columna) => (
          <div key={columna.id} className="w-80 flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
            
            {/* Título de Columna */}
            <div className={`p-4 border-t-4 ${columna.border} ${columna.bg} flex justify-between items-center shrink-0`}>
              <h3 className="font-bold uppercase tracking-wider text-xs text-white">
                {columna.titulo}
              </h3>
              <span className="bg-slate-950 text-slate-300 text-[10px] font-bold px-2 py-1 rounded border border-slate-800">
                {reservaciones.filter(r => r.estado === columna.id).length}
              </span>
            </div>

            {/* Lista de Tarjetas */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              
              {/* Aquí usamos el componente ReservationCard por cada reserva que coincida con la columna */}
              {reservaciones.filter(r => r.estado === columna.id).map((reserva) => (
                <ReservationCard key={reserva.id} reserva={reserva} />
              ))}

              {/* Si la columna está vacía, mostramos esto */}
              {reservaciones.filter(r => r.estado === columna.id).length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-500 text-xs font-medium">
                  Vacío - Arrastra aquí
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}