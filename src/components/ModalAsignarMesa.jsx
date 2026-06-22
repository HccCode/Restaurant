import React, { useState, useEffect } from 'react';

export default function ModalAsignarMesa({ isOpen, onClose, onConfirm, reserva, mesasOcupadas = [] }) {
  const [numMesa, setNumMesa] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNumMesa(reserva?.numMesa || ''); 
      setError(''); 
    }
  }, [isOpen, reserva]);

  if (!isOpen || !reserva) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const textoIngresado = numMesa.trim();
    if (!textoIngresado) return;

    // ================= SANITIZADOR INTELIGENTE =================
    // Si escribe "01" lo pasa a "1". Si escribe "09" a "9". Si escribe "12" lo deja en "12".
    let numeroNormalizado = textoIngresado;
    if (/^\d+$/.test(textoIngresado)) {
      numeroNormalizado = String(parseInt(textoIngresado, 10));
    }

    const mesaEnUso = mesasOcupadas.find(
      m => m.num.toLowerCase() === numeroNormalizado.toLowerCase()
    );

    if (mesaEnUso) {
      setError(`¡La mesa #${numeroNormalizado} ya está ocupada por "${mesaEnUso.nombre}"! Cóbrale primero para desocuparla.`);
      return; 
    }

    setError('');
    onConfirm(numeroNormalizado); // Mandamos el número limpio sin ceros
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/40">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Asignar Mesa al Cliente
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold text-center leading-snug">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-400 mb-4 text-center">
            ¿En qué mesa vas a sentar a <strong className="text-white">{reserva.nombre}</strong>?
          </p>

          <div className="mb-6">
            <input 
              type="text" 
              autoFocus 
              required
              placeholder="Ej. 4 o 12" // Placeholder actualizado
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-center text-white text-3xl font-black focus:outline-none focus:border-amber-500 transition-all placeholder-slate-800"
              value={numMesa}
              onChange={(e) => {
                setNumMesa(e.target.value);
                if(error) setError('');
              }}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_0_rgba(217,119,6,0.39)] transition-all cursor-pointer">
              Pasar a Sala
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}