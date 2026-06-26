import React, { useState, useEffect } from 'react';
import HistorialCortes from './HistorialCortes'; // IMPORTAMOS LA PESTAÑA DE CORTES

export default function Dashboard({ reservaciones, onIniciarCorteZ }) {
  const [pestañaActiva, setPestañaActiva] = useState('en-vivo'); // 'en-vivo' | 'historial'
  const [ventasTabla, setVentasTabla] = useState([]);
  
  // Estados para el Buscador de Tickets
  const [filtroFolio, setFiltroFolio] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  const cargarVentas = () => {
    const url = new URL(`http://${window.location.hostname}:3000/api/finanzas/historial-ventas`);
    if (filtroFolio) url.searchParams.append('folio', filtroFolio);
    if (filtroFecha) url.searchParams.append('fecha', filtroFecha);

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (!filtroFolio && !filtroFecha) {
          setVentasTabla(data.filter(v => v.corte_aplicado === false));
        } else {
          setVentasTabla(data);
        }
      })
      .catch(e => console.error('Error al leer de SQL:', e));
  };

  useEffect(() => { cargarVentas(); }, [reservaciones]); 

  // KPIs calculados sin filtros
  const traficoTotal = reservaciones.length;
  const sentados = reservaciones.filter(r => r.estado === 'en-curso').length;
  const enLobby = reservaciones.filter(r => r.estado === 'pendientes').length;
  
  const [liquidadasTurno, setLiquidadasTurno] = useState(0);
  const [ingresoParcial, setIngresoParcial] = useState(0);

  useEffect(() => {
    fetch(`http://${window.location.hostname}:3000/api/finanzas/historial-ventas`)
      .then(r => r.json())
      .then(data => {
        const delTurno = data.filter(v => v.corte_aplicado === false);
        setLiquidadasTurno(delTurno.length);
        setIngresoParcial(delTurno.reduce((acc, curr) => acc + parseFloat(curr.total || 0), 0));
      });
  }, [reservaciones]);

  const modoBusqueda = filtroFolio !== '' || filtroFecha !== '';

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#070b16] text-slate-200 select-none font-sans">
      
      {/* CABECERA MAESTRA CON PESTAÑAS */}
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Finanzas y Auditoría</h1>
          <p className="text-xs text-slate-400 mt-1">Indicadores de rendimiento, tickets liquidados y cortes fiscales.</p>
        </div>
        
        {/* LAS PESTAÑAS ELEGANTES */}
        <div className="flex bg-[#0b1120] p-1.5 rounded-2xl border border-slate-800 shrink-0 shadow-lg">
          <button 
            onClick={() => setPestañaActiva('en-vivo')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
              pestañaActiva === 'en-vivo' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            📊 Turno en Vivo
          </button>
          <button 
            onClick={() => setPestañaActiva('historial')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
              pestañaActiva === 'historial' ? 'bg-[#5a4bfa] text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            📑 Cortes Z
          </button>
        </div>
      </header>

      {/* RENDERIZADO CONDICIONAL DE PESTAÑAS */}
      {pestañaActiva === 'en-vivo' ? (
        <div className="animate-fade-in">
          {/* 4 TARJETAS OPERATIVAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Tráfico Total</span>
              <p className="text-3xl font-black text-white flex items-baseline gap-2"><span>{traficoTotal}</span> <span className="text-xs font-semibold text-slate-400 lowercase">mesas registradas</span></p>
            </div>
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-2">Comensales Sentados</span>
              <p className="text-3xl font-black text-emerald-400 flex items-baseline gap-2"><span>{sentados}</span> <span className="text-xs font-semibold text-slate-400 lowercase">mesas activas</span></p>
            </div>
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-2">Cuentas Liquidadas</span>
              <p className="text-3xl font-black text-indigo-400 flex items-baseline gap-2"><span>{liquidadasTurno}</span> <span className="text-xs font-semibold text-slate-400 lowercase">listas para archivar</span></p>
            </div>
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-2">Espera en Lobby</span>
              <p className="text-3xl font-black text-amber-400 flex items-baseline gap-2"><span>{enLobby}</span> <span className="text-xs font-semibold text-slate-400 lowercase">sin sentar</span></p>
            </div>
          </div>

          {/* BLOQUE MAGENTA DE CIERRE DE CAJA */}
          <div className="bg-[#0b1120] border border-rose-950 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden mb-8">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-600"></div>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-2xl shrink-0 font-bold">🔒</div>
              <div>
                <h2 className="text-lg font-black text-white tracking-wide mb-1">Cierre de Caja y Fiscal: Corte Z</h2>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Al ejecutar esta acción, el sistema consolidará todas las ventas cobradas, desglosará el IVA y emitirá el ticket de auditoría físico. <strong className="text-rose-400 font-bold">Advertencia:</strong> Esto limpiará el flujo del salón e historizará las mesas actuales.
                </p>
              </div>
            </div>
            <button onClick={onIniciarCorteZ} className="px-8 py-4 bg-[#f43f5e] hover:bg-[#e11d48] text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap">
              Iniciar Cierre de Turno
            </button>
          </div>

          {/* BUSCADOR UNIVERSAL Y TABLA DE VENTAS (Diseño exacto a image_f6e186.png) */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-xl">
            
            <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end mb-6 pb-6 border-b border-slate-800/80 gap-6">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-3">
                  <span className="text-xl">🧾</span>
                  <span>{modoBusqueda ? 'Resultados Históricos' : 'Cuentas Cobradas en este Turno'}</span>
                  <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[8px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-500/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    GUARDADO EN BD
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {modoBusqueda ? 'Mostrando recibos de días anteriores.' : 'Estas ventas ya están seguras en la base de datos, pendientes de empaquetar en el Corte Z.'}
                </p>
              </div>

              {/* BARRA DE BÚSQUEDA */}
              <div className="flex flex-wrap items-end gap-3 bg-[#050812] p-2.5 rounded-xl border border-slate-800 shadow-inner">
                <div>
                  <input type="text" value={filtroFolio} onChange={e => setFiltroFolio(e.target.value)} placeholder="Folio V-..." className="bg-[#0b1120] border border-slate-700 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 font-mono w-28 uppercase" title="Buscar por Folio" />
                </div>
                <div>
                  <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="bg-[#0b1120] border border-slate-700 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer [color-scheme:dark]" title="Buscar por Fecha" />
                </div>
                <button onClick={cargarVentas} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors h-[30px] cursor-pointer">
                  Buscar
                </button>
                {modoBusqueda && (
                  <button onClick={() => { setFiltroFolio(''); setFiltroFecha(''); setTimeout(cargarVentas, 50); }} className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors h-[30px] cursor-pointer border border-rose-500/20">
                    Limpiar
                  </button>
                )}
              </div>

              {!modoBusqueda && (
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans tracking-widest font-bold">Ingreso Parcial</span>
                  <span className="text-xl font-black text-emerald-400">${ingresoParcial.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* TABLA DE RESULTADOS */}
            {ventasTabla.length === 0 ? (
              <div className="p-12 text-center text-slate-600 italic text-xs">
                {modoBusqueda ? 'No se encontraron tickets con esos filtros.' : 'No se han cobrado mesas en este turno todavía.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="pb-3 pl-2">Folio de Venta</th>
                      <th className="pb-3">Mesa / Ubicación</th>
                      <th className="pb-3">Atendió</th>
                      {modoBusqueda && <th className="pb-3">Fecha y Hora</th>}
                      <th className="pb-3 text-right">Subtotal</th>
                      <th className="pb-3 text-right">IVA (16%)</th>
                      <th className="pb-3 text-right pr-2">Total Pagado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-medium text-slate-300">
                    {ventasTabla.map(v => (
                      <tr key={v.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 pl-2 font-mono font-bold text-indigo-400">{v.folio}</td>
                        <td className="py-3">
                          <span className="bg-slate-800 text-white font-bold px-2 py-0.5 rounded text-[11px]">{v.num_mesa}</span>
                          {v.corte_aplicado && <span className="ml-2 text-[8px] font-bold text-amber-500/80 border border-amber-500/30 px-1 rounded uppercase tracking-wider bg-amber-500/5">Z-Aplicado</span>}
                        </td>
                        <td className="py-3 text-slate-400">{v.mesero}</td>
                        {modoBusqueda && <td className="py-3 text-slate-500 font-mono text-[10px]">{v.hora_cobro}</td>}
                        <td className="py-3 text-right font-mono">${parseFloat(v.subtotal || 0).toFixed(2)}</td>
                        <td className="py-3 text-right font-mono text-slate-400">${parseFloat(v.iva || 0).toFixed(2)}</td>
                        <td className="py-3 text-right font-mono font-black text-emerald-400 pr-2">${parseFloat(v.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <HistorialCortes />
      )}

    </div>
  );
}