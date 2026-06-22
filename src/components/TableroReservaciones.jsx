import React from 'react';
import ReservationCard from './ReservationCard';

export default function TableroReservaciones({ reservaciones, onMover, onEliminar, onEditar }) {
  const columnas = [
    { id: 'nuevas', titulo: 'Nuevas Reservas', border: 'border-blue-500', bg: 'bg-blue-500/10' },
    { id: 'confirmadas', titulo: 'Confirmadas', border: 'border-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'en-curso', titulo: 'En Sala (Comiendo)', border: 'border-amber-500', bg: 'bg-amber-500/10' },
    { id: 'finalizadas', titulo: 'Finalizadas / Pago', border: 'border-slate-500', bg: 'bg-slate-500/10' },
  ];

  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  const handleDrop = (e, estadoDestino) => {
    e.preventDefault();
    const idReserva = Number(e.dataTransfer.getData('idReserva')); 
    if (idReserva) onMover(idReserva, estadoDestino); 
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 z-10">
      <div className="flex gap-6 h-full min-w-max">
        {columnas.map((columna) => (
          <div 
            key={columna.id} 
            // CANDADO: La columna de finalizadas rechaza las acciones de arrastrar y soltar
            onDragOver={columna.id !== 'finalizadas' ? handleDragOver : undefined} 
            onDrop={columna.id !== 'finalizadas' ? (e) => handleDrop(e, columna.id) : undefined} 
            className="w-80 flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm pb-2 transition-colors hover:bg-slate-900/60"
          >
            <div className={`p-4 border-t-4 ${columna.border} ${columna.bg} flex justify-between items-center shrink-0`}>
              <h3 className="font-bold uppercase tracking-wider text-xs text-white">{columna.titulo}</h3>
              <span className="bg-slate-950 text-slate-300 text-[10px] font-bold px-2 py-1 rounded border border-slate-800">
                {reservaciones.filter(r => r.estado === columna.id).length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {reservaciones.filter(r => r.estado === columna.id).map((reserva) => (
                <ReservationCard 
                  key={reserva.id} 
                  reserva={reserva} 
                  onMover={onMover} 
                  onEliminar={onEliminar} 
                  onEditar={onEditar}
                />
              ))}
              
              {/* Mensaje de área vacía adaptado según la columna */}
              {reservaciones.filter(r => r.estado === columna.id).length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-700/50 rounded-xl flex items-center justify-center text-slate-500 text-xs font-medium bg-slate-800/10 text-center px-4">
                  {columna.id === 'finalizadas' 
                    ? 'Pasan aquí automáticamente al cobrar en caja' 
                    : 'Arrastra una reserva aquí'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}