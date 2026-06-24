import React, { useState, useEffect } from 'react';

export default function ConfigRestaurante() {
  const [datos, setDatos] = useState({
    nombre_negocio: '', rfc: '', direccion: '', telefono: '', mensaje_ticket: ''
  });
  const [guardando, setGuardando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  const BASE_URL = `http://${window.location.hostname}:3000/api`;

  useEffect(() => {
    fetch(`${BASE_URL}/configuracion`)
      .then(res => res.json())
      .then(data => data ? setDatos(data) : null)
      .catch(err => console.error('Error cargando configuración:', err));
  }, []);

  const handleChange = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch(`${BASE_URL}/configuracion`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos)
      });
      if (res.ok) {
        setAlerta({ tipo: 'ok', texto: '¡Memoria de la impresora POS actualizada exitosamente!' });
        setTimeout(() => setAlerta(null), 4000);
      }
    } catch (err) { alert('Error de red al guardar los datos'); } finally { setGuardando(false); }
  };

  return (
    <div className="flex-1 p-8 bg-[#070b16] text-slate-100 min-h-[calc(100vh-80px)] flex gap-8 items-start overflow-y-auto">
      
      {/* COLUMNA IZQUIERDA: FORMULARIO */}
      <div className="flex-1 max-w-xl bg-slate-900/70 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        
        {alerta && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in font-mono">
            <span>✅</span> {alerta.texto}
          </div>
        )}

        <div className="border-b border-slate-800 pb-4 mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight">Memoria de Recibos</h2>
          <p className="text-xs text-slate-400 mt-1">Estos datos encabezarán los tickets impresos para los clientes.</p>
        </div>

        <form onSubmit={handleGuardar} className="space-y-4 text-xs font-bold text-slate-300">
          
          <div>
            <label className="block mb-1.5 uppercase tracking-wider text-[10px] text-slate-400">Nombre Público del Restaurante</label>
            <input type="text" name="nombre_negocio" value={datos.nombre_negocio} onChange={handleChange}required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all font-sans text-sm font-extrabold" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-[10px] text-slate-400">R.F.C. / ID Fiscal</label>
              <input type="text" name="rfc" value={datos.rfc} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none font-mono tracking-wider uppercase text-xs" />
            </div>
            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-[10px] text-slate-400">Teléfono de Reservas</label>
              <input type="text" name="telefono" value={datos.telefono} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none font-mono text-xs" />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 uppercase tracking-wider text-[10px] text-slate-400">Dirección del Establecimiento</label>
            <input type="text" name="direccion" value={datos.direccion} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none font-sans font-medium text-xs" />
          </div>

          <div>
            <label className="block mb-1.5 uppercase tracking-wider text-[10px] text-slate-400">Frase de Despedida (Pie de Ticket)</label>
            <input type="text" name="mensaje_ticket" value={datos.mensaje_ticket} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-indigo-200 focus:border-indigo-500 outline-none font-mono text-xs italic" placeholder="Ej: ¡Gracias por su visita!" />
          </div>

          <button type="submit" disabled={guardando} className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2">
            <span>💾</span> <span>{guardando ? 'Inyectando a la memoria...' : 'Guardar Datos en Impresora POS'}</span>
          </button>
        </form>

      </div>

      {/* COLUMNA DERECHA: SIMULADOR DE PAPEL TÉRMICO */}
      <div className="w-80 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col items-center select-none shrink-0 shadow-inner">
        <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest mb-4 block">Simulador Papel Térmico (80mm)</span>
        
        <div className="w-72 bg-amber-50/95 text-slate-900 p-6 rounded-2xl font-mono text-xs shadow-2xl border border-slate-300 flex flex-col items-center text-center leading-tight">
          <h4 className="font-black text-base uppercase tracking-tighter mb-1">{datos.nombre_negocio || 'NOMBRE DEL LOCAL'}</h4>
          <p className="text-[10px] text-slate-700 uppercase px-1 leading-snug">{datos.direccion || 'DIRECCIÓN NO CONFIGURADA'}</p>
          <p className="text-[10px] text-slate-700 mt-1">RFC: {datos.rfc || 'XAXX010101000'}</p>
          <p className="text-[10px] text-slate-700">TEL: {datos.telefono || '---'}</p>
          
          <div className="w-full border-t border-dashed border-slate-400 my-3"></div>

          <div className="w-full text-left space-y-1 text-[11px]">
            <div className="flex justify-between"><span>1x Tomahawk Añejado</span><span>$1,200.00</span></div>
            <div className="flex justify-between"><span>2x Limonada Mineral</span><span>$90.00</span></div>
          </div>

          <div className="w-full border-t border-dashed border-slate-400 my-3"></div>
          
          <div className="w-full text-right font-black text-xs">SUBTOTAL: $1,112.06</div>
          <div className="w-full text-right font-black text-xs">IVA (16%): $177.94</div>
          <div className="w-full text-right font-black text-sm text-indigo-950 mt-1">TOTAL: $1,290.00</div>

          <div className="w-full border-t border-slate-400 my-3"></div>

          <p className="text-[10px] font-bold text-slate-800 px-2 italic">{datos.mensaje_ticket || '¡Gracias por su compra!'}</p>
        </div>
      </div>

    </div>
  );
}