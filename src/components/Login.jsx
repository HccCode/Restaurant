import React, { useState, useEffect } from 'react';

export default function Login({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  // REGLA FÍSICA: Bloquea el ingreso al llegar al 4to dígito
  const handleNumClick = (num) => {
    if (pin.length < 4) {
      setError(null);
      setPin(prev => prev + num);
    }
  };

  const handleBorrar = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const pinLimpio = pin ? pin.trim() : '';

    // REGLA LÓGICA: Prohibido enviar si no hay 4 dígitos exactos
    if (pinLimpio.length !== 4) {
      setError('El PIN consta de 4 dígitos numéricos');
      return;
    }

    setCargando(true);
    setError(null);

    const hostAnfitrion = window.location.hostname || 'localhost';
    const urlExacta = `http://${hostAnfitrion}:3000/api/login`;

    try {
      const res = await fetch(urlExacta, {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ pin: pinLimpio })
      });

      const data = await res.json();

      if (res.ok && data) {
        onLogin(data);
      } else {
        setError(data?.error || 'Acceso Denegado');
        setPin('');
      }
    } catch (err) {
      setError(`Sin respuesta del servidor (${hostAnfitrion}:3000)`);
    } finally {
      setCargando(false);
    }
  };

  // SOPORTE DE TECLADO FÍSICO (Para que no tengas que usar el mouse en la PC)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (/^[0-9]$/.test(event.key)) {
        handleNumClick(event.key);
      } else if (event.key === 'Backspace') {
        handleBorrar();
      } else if (event.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="flex h-screen w-full bg-[#070b16] items-center justify-center select-none p-4 font-sans">
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center shadow-2xl backdrop-blur-md">
        
        {/* LOGO */}
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-3 shadow-lg shadow-indigo-600/30">
          S
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Sabor.io POS</h2>
        <p className="text-xs text-slate-400 font-mono mb-6">Terminal de Salón</p>

        {/* VISOR DEL PIN (Estilo cajero automático) */}
        <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl h-14 mb-2 flex items-center justify-center text-2xl tracking-[0.4em] font-mono font-black text-indigo-400 shadow-inner overflow-hidden px-4">
          {pin ? '•'.repeat(pin.length) : <span className="text-sm tracking-widest text-slate-600 font-mono font-bold select-none opacity-50">••••</span>}
        </div>

        {error && (
          <p className="text-rose-400 text-xs font-bold font-mono bg-rose-500/10 border border-rose-500/20 py-1.5 px-3 rounded-xl mb-4 text-center w-full animate-shake">
            {error}
          </p>
        )}

        {/* TECLADO NUMÉRICO POS */}
        <div className="grid grid-cols-3 gap-3 w-full my-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumClick(String(num))}
              className="h-14 bg-slate-800/90 hover:bg-slate-700 active:scale-95 rounded-2xl font-black text-white text-xl transition-all shadow flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}
          
          <button
            type="button"
            onClick={handleBorrar}
            className="h-14 bg-slate-950 hover:bg-rose-500/20 hover:text-rose-400 rounded-2xl font-bold text-slate-500 text-xs transition-all flex items-center justify-center cursor-pointer uppercase"
          >
            Borrar
          </button>

          <button
            type="button"
            onClick={() => handleNumClick('0')}
            className="h-14 bg-slate-800/90 hover:bg-slate-700 active:scale-95 rounded-2xl font-black text-white text-xl transition-all shadow flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={cargando}
            className="h-14 bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-2xl font-black text-white text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center cursor-pointer tracking-wider font-mono"
          >
            {cargando ? '...' : 'ENTRAR'}
          </button>
        </div>

        {/* FOOTER DE SEGURIDAD LIMPIO */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 w-full text-center">
          <span className="text-[10px] text-slate-600 font-mono tracking-widest uppercase block">Terminal Protegida</span>
        </div>

      </div>
    </div>
  );
}