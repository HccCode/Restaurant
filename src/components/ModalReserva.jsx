import React, { useState, useEffect } from 'react';

export default function ModalReserva({ isOpen, onClose, onSave, fechaInicial, reservaAEditar }) {
  // Calculamos la fecha actual en formato YYYY-MM-DD para el límite del calendario
const fechaLocal = new Date();
  const hoy = `${fechaLocal.getFullYear()}-${String(fechaLocal.getMonth() + 1).padStart(2, '0')}-${String(fechaLocal.getDate()).padStart(2, '0')}`;

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '', 
    fecha: hoy,
    hora: '14:00',
    personas: 2,
    tipo: 'Estándar',
    etiqueta: 'Normal',
  });

  useEffect(() => {
    if (isOpen) {
      if (reservaAEditar) {
        // Aseguramos que la fecha que viene de la base de datos se formatee correctamente para el input
        setFormData({
          ...reservaAEditar,
          fecha: reservaAEditar.fecha ? reservaAEditar.fecha.split('T')[0] : hoy
        });
      } else {
        // Limpiamos el formulario y asignamos el día de hoy por defecto si no hay fecha inicial
        setFormData({
          nombre: '',
          telefono: '', 
          fecha: fechaInicial || hoy,
          hora: '14:00',
          personas: 2,
          tipo: 'Estándar',
          etiqueta: 'Normal'
        });
      }
    }
  }, [isOpen, fechaInicial, reservaAEditar, hoy]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handlePersonas = (delta) => {
    const newVal = formData.personas + delta;
    if (newVal >= 1 && newVal <= 30) {
      setFormData({ ...formData, personas: newVal });
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/40">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            {reservaAEditar ? 'Editar Reservación' : 'Agendar Reservación'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre del Cliente</label>
            <input type="text" required placeholder="Ej. Familia Martínez" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-700"
              value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            />
          </div>

          {/* Teléfono de Contacto */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Teléfono de Contacto</label>
            <input type="tel" placeholder="Ej. 6861234567" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-700"
              value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})}
            />
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fecha</label>
              {/* min={hoy} permite reservas del mismo día */}
              <input type="date" required min={hoy} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all [color-scheme:dark]"
                value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hora</label>
              <input type="time" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all [color-scheme:dark]"
                value={formData.hora} onChange={(e) => setFormData({...formData, hora: e.target.value})}
              />
            </div>
          </div>

          {/* Personas y Zona */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Asistentes (Pax)</label>
              <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 h-11">
                <button type="button" onClick={() => handlePersonas(-1)} className="w-14 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                </button>
                <div className="flex-1 flex items-center justify-center font-black text-white text-sm">
                  {formData.personas}
                </div>
                <button type="button" onClick={() => handlePersonas(1)} className="w-14 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Zona Asignada</label>
              <div className="grid grid-cols-3 gap-2">
                {['Estándar', 'Terraza', 'Mesa VIP'].map(z => (
                  <button key={z} type="button" onClick={() => setFormData({...formData, tipo: z})} 
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      formData.tipo === z ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Etiquetas */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Etiqueta Especial</label>
            <div className="flex flex-wrap gap-2">
              {['Normal', 'Reunión', 'Aniversario', 'Cumpleaños', 'Cita Romántica'].map(et => (
                <button key={et} type="button" onClick={() => setFormData({...formData, etiqueta: et})} 
                  className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    formData.etiqueta === et 
                      ? (et === 'Normal' ? 'bg-slate-700/50 border-slate-500 text-white' : 'bg-rose-500/20 border-rose-500/50 text-rose-400')
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {et}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t border-slate-800/80 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all cursor-pointer">
              {reservaAEditar ? 'Guardar Cambios' : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}