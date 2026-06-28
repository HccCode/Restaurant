import React, { useState, useEffect } from 'react';
import HistorialCortes from './HistorialCortes'; // IMPORTAMOS LA PESTAÑA DE CORTES

export default function Dashboard({ reservaciones, onIniciarCorteZ }) {
  const [pestañaActiva, setPestañaActiva] = useState('en-vivo'); // 'en-vivo' | 'historial'
  const [ventasTabla, setVentasTabla] = useState([]);
  
  // Estados para el Buscador de Tickets
  const [filtroFolio, setFiltroFolio] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  // 🔥 NUEVO ESTADO: Control del modal de reimpresión interno 🔥
  const [modalReimpresion, setModalReimpresion] = useState({ isOpen: false, venta: null, config: null, platillos: [] });

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

  // =========================================================================
  // 🔥 PREPARADOR DEL MODAL INTERNO DE REIMPRESIÓN 🔥
  // =========================================================================
  const handlePrepararReimpresion = async (venta) => {
    // 1. Obtenemos la configuración fresca del negocio
    let config = { nombre_negocio: 'Sabor.io Restaurante', rfc: 'XAXX010101000', direccion: 'Av. De los Héroes 123', telefono: '686 555 1234', iva: 16, mensaje_ticket: '¡Gracias por su preferencia!' };
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/configuracion`);
      if (res.ok) config = await res.json();
    } catch (e) {}

    // 2. Extraemos los platillos de la venta
    let platillos = [];
    try {
      platillos = Array.isArray(venta.items_consumidos) ? venta.items_consumidos : JSON.parse(venta.items_consumidos || '[]');
    } catch (e) {
      console.error("Error parseando platillos", e);
    }

    // 3. Activamos el modal interno en lugar de abrir un popup en blanco
    setModalReimpresion({
      isOpen: true,
      venta,
      config,
      platillos
    });
  };

  // 🔥 DISPARADOR DE IMPRESIÓN FÍSICA DIRECTA 🔥
  const ejecutarImpresionFisica = () => {
    const { venta, config, platillos } = modalReimpresion;
    if (!venta) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Reimpresión Ticket #${venta.folio}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 260px; margin: 0; padding: 10px; color: #000; font-size: 11px; }
            .center { text-align: center; }
            .dash { border-top: 1px dashed #000; margin: 8px 0; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
            .watermark { font-size: 12px; font-weight: bold; text-align: center; margin-bottom: 12px; border: 2px solid #000; padding: 4px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="watermark">*** COPIA DE REIMPRESIÓN ***</div>
          <div class="center">
            <div class="title">${config.nombre_negocio}</div>
            <div>RFC: ${config.rfc}</div>
            <div>${config.direccion}</div>
            <div>Tel: ${config.telefono}</div>
          </div>
          <div class="dash"></div>
          <div><b>FOLIO:</b> ${venta.folio}</div>
          <div><b>MESA:</b> ${venta.num_mesa}</div>
          <div><b>MESERO:</b> ${venta.mesero}</div>
          <div><b>FECHA:</b> ${venta.hora_cobro || 'Registro Histórico'}</div>
          <div class="dash"></div>
          <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px dashed #000;">
                <th style="text-align: left; padding-bottom: 4px;">CANT</th>
                <th style="text-align: left; padding-bottom: 4px;">ITEM</th>
                <th style="text-align: right; padding-bottom: 4px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${platillos.map(p => `
                <tr>
                  <td style="padding: 2px 0;">${p.cantidad}x</td>
                  <td style="padding: 2px 0;">${p.nombre}</td>
                  <td style="text-align: right; padding: 2px 0;">$${(parseFloat(p.precio) * parseInt(p.cantidad)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="dash"></div>
          <div class="flex"><span>Subtotal:</span><span>$${parseFloat(venta.subtotal).toFixed(2)}</span></div>
          <div class="flex"><span>I.V.A. (${config.iva}%):</span><span>$${parseFloat(venta.iva).toFixed(2)}</span></div>
          <div class="flex bold" style="font-size: 12px; margin-top: 2px;"><span>TOTAL:</span><span>$${parseFloat(venta.total).toFixed(2)}</span></div>
          <div class="dash"></div>
          <div class="center" style="margin-top: 12px; font-style: italic;">
            ${config.mensaje_ticket}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#070b16] text-slate-200 select-none font-sans relative">
      
      {/* =========================================================================
          🔥 MODAL INTERNO INTEGRADO CON EL DISEÑO DEL RESTAURANTE 🔥
          ========================================================================= */}
      {modalReimpresion.isOpen && (
        <div className="fixed inset-0 z-[350] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col">
            <header className="mb-4 text-center">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
                <span>🖨️</span> Vista Previa de Auditoría
              </h3>
              <p className="text-xs text-slate-400 mt-1">Copia fiel del archivo digital en base de datos.</p>
            </header>

            {/* Simulación del papel térmico */}
            <div className="bg-white text-slate-950 p-4 rounded-xl font-mono text-[11px] space-y-1.5 border border-slate-200 shadow-inner max-h-[45vh] overflow-y-auto select-text">
              <div className="text-center font-sans space-y-0.5 mb-3">
                <p className="text-[10px] font-black border border-slate-950 px-2 py-0.5 rounded tracking-wide mb-2 inline-block">*** REIMPRESIÓN ***</p>
                <p className="font-black text-xs uppercase text-slate-900 leading-none mb-1">{modalReimpresion.config?.nombre_negocio}</p>
                <p className="text-[10px] text-slate-500">RFC: {modalReimpresion.config?.rfc}</p>
                <p className="text-[10px] text-slate-500 truncate">{modalReimpresion.config?.direccion}</p>
                <p className="text-[10px] text-slate-500">Tel: {modalReimpresion.config?.telefono}</p>
              </div>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <p><strong>FOLIO:</strong> {modalReimpresion.venta?.folio}</p>
              <p><strong>MESA:</strong> {modalReimpresion.venta?.num_mesa}</p>
              <p><strong>ATENDIÓ:</strong> {modalReimpresion.venta?.mesero}</p>
              <p><strong>FECHA:</strong> {modalReimpresion.venta?.hora_cobro || 'Histórica'}</p>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-dashed border-slate-300 font-bold">
                    <th className="pb-1">Cant</th><th className="pb-1">Item</th><th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {modalReimpresion.platillos.map((p, i) => (
                    <tr key={i}>
                      <td className="py-0.5 font-bold text-slate-700">{p.cantidad}x</td>
                      <td className="py-0.5 truncate max-w-[120px]">{p.nombre}</td>
                      <td className="py-0.5 text-right font-bold">${(parseFloat(p.precio) * parseInt(p.cantidad)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <div className="flex justify-between"><span>Subtotal:</span><span>${parseFloat(modalReimpresion.venta?.subtotal || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>I.V.A. ({modalReimpresion.config?.iva}%):</span><span>${parseFloat(modalReimpresion.venta?.iva || 0).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-xs border-t border-slate-900 pt-1 mt-1"><span>TOTAL RECIBIDO:</span><span>${parseFloat(modalReimpresion.venta?.total || 0).toFixed(2)}</span></div>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <p className="text-center font-sans italic text-[10px] text-slate-400 pt-1 leading-tight">{modalReimpresion.config?.mensaje_ticket}</p>
            </div>

            {/* Acciones del Modal */}
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setModalReimpresion({ isOpen: false, venta: null, config: null, platillos: [] })} 
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Volver
              </button>
              <button 
                onClick={ejecutarImpresionFisica} 
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
              >
                🖨️ Mandar a Ticketera
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}

      {/* CABECERA MAESTRA CON PESTAÑAS */}
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Finanzas y Auditoría</h1>
          <p className="text-xs text-slate-400 mt-1">Indicadores de rendimiento, tickets liquidados y cortes fiscales.</p>
        </div>
        
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

          {/* BUSCADOR UNIVERSAL Y TABLA DE VENTAS */}
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
                    <th className="pb-3 text-right">Total Pagado</th>
                    <th className="pb-3 text-center pr-2">Reimpresión</th>
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
                      <td className="py-3 text-right font-mono font-black text-emerald-400">${parseFloat(v.total || 0).toFixed(2)}</td>
                      <td className="py-3 text-center pr-2">
                        <button 
                          onClick={() => handlePrepararReimpresion(v)} 
                          className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 p-1.5 rounded-lg transition-colors cursor-pointer shadow-sm active:scale-90"
                          title="Visualizar y Reimprimir"
                        >
                          🖨️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <HistorialCortes />
      )}

    </div>
  );
}