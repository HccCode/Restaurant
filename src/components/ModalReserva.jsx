import React, { useState, useEffect } from 'react';

export default function ModalReserva({ isOpen, onClose, onSave, reserva, fechaInicial }) {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('14:00');
  const [personas, setPersonas] = useState(2);
  const [telefono, setTeléfono] = useState('');
  const [tipo, setTipo] = useState('General');
  const [etiqueta, setEtiqueta] = useState('');

  // Sincronizador inteligente de estados de carga
  useEffect(() => {
    if (isOpen) {
      if (reserva) {
        // Modo Edición: Mapea los valores existentes desde PostgreSQL
        setNombre(reserva.nombre || '');
        setFecha(reserva.fecha ? reserva.fecha.split('T')[0] : '');
        setHora(reserva.hora || '14:00');
        setPersonas(reserva.personas || 2);
        setTeléfono(reserva.telefono || '');
        setTipo(reserva.tipo || 'General');
        setEtiqueta(reserva.etiqueta || '');
      } else {
        // Modo Nuevo: Limpia campos pero RESPETA la fecha del calendario
        setNombre('');
        setFecha(fechaInicial || ''); // 🔥 SOLUCIÓN AL BUG: Bloquea la fecha elegida
        setHora('14:00');
        setPersonas(2);
        setTeléfono('');
        setTipo('General');
        setEtiqueta('');
      }
    }
  }, [isOpen, reserva, fechaInicial]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !fecha) return alert('Por favor rellena el nombre y la fecha.');
    
    onSave({
      nombre: nombre.trim(),
      fecha,
      hora,
      personas: parseInt(personas),
      telefono: telefono.trim(),
      tipo,
      etiqueta: etiqueta.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans select-none">
      <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
        
        <header className="mb-6">
          <h2 className="text-xl font-black text-white tracking-wide">
            {reserva ? '📝 Editar Reservación' : '📅 Nueva Reservación'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">Ingresa los datos del cliente para reservar espacio en el salón.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre del Cliente</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. José Manuel" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:outline-none focus:border-indigo-500 font-bold" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha del Evento</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:outline-none focus:border-indigo-500 font-bold [color-scheme:dark] cursor-pointer" required />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hora de Llegada</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:outline-none focus:border-indigo-500 font-bold [color-scheme:dark] cursor-pointer" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Número de Personas</label>
              <input type="number" min="1" max="50" value={personas} onChange={e => setPersonas(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:outline-none focus:border-indigo-500 font-mono font-bold" required />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Zona de Preferencia</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:outline-none focus:border-indigo-500 font-bold cursor-pointer">
                <option value="General">Zona General</option>
                <option value="Terraza">La Terraza</option>
                <option value="VIP">Salón VIP</option>
                <option value="Barra">Barra / Barra Alta</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Teléfono (Opcional)</label>
              <input type="tel" value={telefono} onChange={e => setTeléfono(e.target.value)} placeholder="686..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:outline-none focus:border-indigo-500 font-mono font-bold" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Etiqueta Especial</label>
              <input type="text" value={etiqueta} onChange={e => setEtiqueta(e.target.value)} placeholder="Ej. Cumpleaños" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:outline-none focus:border-indigo-500 font-bold" />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800/60 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-indigo-600/20 cursor-pointer">
              {reserva ? 'Guardar Cambios' : 'Confirmar'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}