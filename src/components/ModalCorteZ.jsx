import React from 'react';

export default function ModalCorteZ({ isOpen, onClose, onConfirm, datos }) {
  if (!isOpen || !datos) return null;

  const ventasLista = datos.ventas || [];
  const movimientosLista = datos.movimientosDetalle || [];
  const totalVentas = Number(datos.granTotal || datos.totalVentas) || 0;
  const mesasAtendidas = Number(datos.mesasAtendidas || ventasLista.length) || 0;
  
  // 🔥 MOTOR MATEMÁTICO REAL (SIN TRAMPAS) 🔥
  let realEfectivoVenta = 0;
  let realTarjetaVenta = 0;
  let realEfectivoPropina = 0;
  let realTarjetaPropina = 0;

  // Extraemos los datos exactos que vienen de PostgreSQL (Ventas)
  ventasLista.forEach(v => {
    realEfectivoVenta += parseFloat(v.pago_efectivo || 0);
    realTarjetaVenta += parseFloat(v.pago_tarjeta || 0);
    realEfectivoPropina += parseFloat(v.propina_efectivo || 0);
    realTarjetaPropina += parseFloat(v.propina_tarjeta || 0);
  });

  const totalPropinasRecibidas = realEfectivoPropina + realTarjetaPropina;

  // Extraemos los datos de Movimientos de Caja
  const fondoYEntradas = parseFloat(datos.entradasCaja || 0);
  const pagosYSalidas = parseFloat(datos.salidasCaja || 0);

  // 🔥 CÁLCULO ESTRICTO DE EFECTIVO FÍSICO ESPERADO EN GAVETA 🔥
  // = Fondo Inicial + Todo lo vendido en efectivo + Propinas recibidas en efectivo - Pagos de Caja
  const efectivoFisicoEsperado = fondoYEntradas + realEfectivoVenta + realEfectivoPropina - pagosYSalidas;

  const fechaCorte = datos.fecha ? `${datos.fecha} • ${datos.hora}` : new Date().toLocaleString('es-MX', { 
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' 
  });
  
  const folioTurno = datos.folioTurno || `TURNO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;

  // =========================================================================
  // 🔥 EXPORTADOR EXCEL ACTUALIZADO CON MOVIMIENTOS DE CAJA Y ARQUEO 🔥
  // =========================================================================
  const exportarExcel = () => {
    let tablaHTML = `
      <table border="1" style="font-family: Arial, sans-serif; border-collapse: collapse;">
        <thead>
          <tr>
            <th colspan="7" style="background:#1e1b4b; color:#ffffff; font-size:16px; padding:15px;">
              REPORTE DE VENTAS, MOVIMIENTOS Y ARQUEO CORTE Z — ${folioTurno}
            </th>
          </tr>
          <tr style="background:#f1f5f9;">
            <td colspan="7" style="padding:8px;"><b>Corte Generado:</b> ${fechaCorte}</td>
          </tr>
          <tr><td colspan="7"></td></tr>
          <tr><th colspan="7" style="background:#4338ca; color:white; padding:8px; text-align:left;">DETALLE DE VENTAS (COMANDAS LIQUIDADAS)</th></tr>
          <tr style="background:#cbd5e1; font-weight:bold;">
            <th style="padding:10px; width:80px;">Mesa</th>
            <th style="padding:10px; width:120px;">Atendió</th>
            <th style="padding:10px; width:160px;">Cliente / Titular</th>
            <th style="padding:10px; width:60px;">Pax</th>
            <th style="padding:10px; width:350px;">Consumo (Alimentos y Bebidas)</th>
            <th style="padding:10px; width:100px; color:#b45309;">Propina</th>
            <th style="padding:10px; width:120px;">Cobrado</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (ventasLista.length === 0) {
      tablaHTML += `<tr><td colspan="7" style="padding:20px; text-align:center; font-style:italic;">No hay ventas registradas en este turno.</td></tr>`;
    } else {
      ventasLista.forEach(v => {
        let platillosStr = "";
        let listaItems = v.items_consumidos;
        
        if (typeof listaItems === 'string') {
          try { listaItems = JSON.parse(listaItems); } catch(e) { listaItems = []; }
        }

        if (Array.isArray(listaItems)) {
          platillosStr = listaItems.map(p => `• ${p.cantidad}x ${p.nombre} ($${(p.precio * p.cantidad).toFixed(2)})`).join('<br/>');
        }

        const propinaMesa = (parseFloat(v.propina_efectivo || 0) + parseFloat(v.propina_tarjeta || 0)) || 0;

        tablaHTML += `
          <tr>
            <td style="text-align:center; padding:10px; font-weight:bold;">${v.numMesa || v.num_mesa || 'Barra'}</td>
            <td style="text-align:center; padding:10px;">${v.mesero || 'Mesero'}</td>
            <td style="padding:10px;">${v.cliente || 'General'}</td>
            <td style="text-align:center; padding:10px;">${v.personas || 1}</td>
            <td style="padding:10px; font-size:11px; color:#334155;">${platillosStr || 'Venta directa en mostrador'}</td>
            <td style="text-align:right; padding:10px; color:#b45309;">$${propinaMesa.toFixed(2)}</td>
            <td style="text-align:right; padding:10px; font-weight:bold; color:#16a34a;">$${Number(v.total).toFixed(2)}</td>
          </tr>
        `;
      });
    }

    // TABLA DE MOVIMIENTOS EN EXCEL
    tablaHTML += `
        </tbody>
        <tfoot>
          <tr><td colspan="7"></td></tr>
          <tr><th colspan="7" style="background:#be123c; color:white; padding:8px; text-align:left;">DETALLE DE MOVIMIENTOS MANUALES DE CAJA</th></tr>
          <tr style="background:#f1f5f9; font-weight:bold;">
            <th colspan="2" style="padding:8px;">Tipo</th>
            <th colspan="3" style="padding:8px;">Concepto / Autorizó</th>
            <th colspan="2" style="padding:8px; text-align:right;">Monto</th>
          </tr>
    `;

    if (movimientosLista.length === 0) {
      tablaHTML += `<tr><td colspan="7" style="padding:10px; text-align:center; font-style:italic;">Sin movimientos manuales.</td></tr>`;
    } else {
      movimientosLista.forEach(m => {
        const esEntrada = m.tipo === 'entrada';
        tablaHTML += `
          <tr>
            <td colspan="2" style="padding:8px; font-weight:bold; color:${esEntrada ? '#16a34a' : '#dc2626'}">${esEntrada ? 'ENTRADA / FONDO' : 'SALIDA / PAGO'}</td>
            <td colspan="3" style="padding:8px;">${m.concepto}</td>
            <td colspan="2" style="padding:8px; text-align:right; font-weight:bold; color:${esEntrada ? '#16a34a' : '#dc2626'}">${esEntrada ? '+' : '-'}$${parseFloat(m.monto).toFixed(2)}</td>
          </tr>
        `;
      });
    }

    // RESUMEN MATEMÁTICO EN EXCEL
    tablaHTML += `
          <tr><td colspan="7"></td></tr>
          
          <tr>
            <td colspan="5" rowspan="3" style="vertical-align: middle; text-align: center; padding: 8px; background:#f1f5f9;"><b>RESUMEN DEL NEGOCIO (VENTAS VÍA POS)</b></td>
            <td style="font-weight:bold; text-align:right; background:#f8fafc;">Ventas Efectivo:</td>
            <td style="text-align:right; background:#f8fafc;">$${realEfectivoVenta.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-weight:bold; text-align:right; background:#f8fafc;">Ventas Tarjeta:</td>
            <td style="text-align:right; background:#f8fafc;">$${realTarjetaVenta.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-weight:black; text-align:right; background:#e2e8f0; color:#1e2b3c;">VENTA BRUTA:</td>
            <td style="font-weight:black; text-align:right; background:#e2e8f0; color:#15803d; font-size:14px;">$${totalVentas.toFixed(2)}</td>
          </tr>

          <tr><td colspan="7"></td></tr>

          <tr>
            <td colspan="5" rowspan="3" style="vertical-align: middle; text-align: center; padding: 8px; background:#fffbeb;"><b>FONDOS DE MESEROS</b></td>
            <td style="font-weight:bold; text-align:right; background:#fffbeb; color:#92400e;">Propinas Efectivo:</td>
            <td style="text-align:right; background:#fffbeb; color:#92400e;">$${realEfectivoPropina.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-weight:bold; text-align:right; background:#fffbeb; color:#92400e;">Propinas Tarjeta:</td>
            <td style="text-align:right; background:#fffbeb; color:#92400e;">$${realTarjetaPropina.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-weight:black; text-align:right; background:#fef3c7; color:#78350f;">TOTAL PROPINAS:</td>
            <td style="font-weight:black; text-align:right; background:#fef3c7; color:#b45309; font-size:14px;">$${totalPropinasRecibidas.toFixed(2)}</td>
          </tr>

          <tr><td colspan="7"></td></tr>

          <tr>
            <td colspan="5" rowspan="4" style="vertical-align: middle; text-align: center; padding: 8px; background:#f0fdf4;"><b>ARQUEO Y AUDITORÍA DE CAJA GAVETA</b></td>
            <td style="font-weight:bold; text-align:right; background:#f0fdf4; color:#166534;">Ingresos Efectivo POS (+):</td>
            <td style="text-align:right; background:#f0fdf4; color:#166534;">$${(realEfectivoVenta + realEfectivoPropina).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-weight:bold; text-align:right; background:#f0fdf4; color:#166534;">Fondos Manuales Entrantes (+):</td>
            <td style="text-align:right; background:#f0fdf4; color:#166534;">$${fondoYEntradas.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-weight:bold; text-align:right; background:#fef2f2; color:#991b1b;">Salidas y Pagos de Caja (-):</td>
            <td style="text-align:right; background:#fef2f2; color:#991b1b;">$${pagosYSalidas.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-weight:black; text-align:right; background:#dcfce7; color:#14532d;">EFECTIVO ESPERADO EN CAJA:</td>
            <td style="font-weight:black; text-align:right; background:#dcfce7; color:#15803d; font-size:16px;">$${efectivoFisicoEsperado.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    `;

    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body>${tablaHTML}</body></html>`;
    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CorteZ_Arqueo_${folioTurno}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans select-none">
      <div className="bg-[#0b1120] border border-slate-700 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_0_40px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[92vh]">
        
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors cursor-pointer">✕</button>

        {/* CABECERA DEL TICKET */}
        <div className="text-center mb-5 pt-1">
          <div className="w-14 h-14 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2 shadow-inner">🖨️</div>
          <span className="text-[10px] font-mono text-indigo-400 font-bold block tracking-widest">{folioTurno}</span>
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Corte de Caja (Z)</h2>
          <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{fechaCorte}</p>
        </div>

        {/* CUERPO DEL TICKET CON DESGLOSE MATEMÁTICO REAL */}
        <div className="bg-[#050812] border border-slate-800/80 rounded-2xl p-5 mb-4 font-mono text-xs shadow-inner relative flex-1 overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjQiPjxwb2x5Z29uIHBvaW50cz0iMCwwIDQsNCA4LDAiIGZpbGw9IiMwYjExMjAiLz48L3N2Zz4=')] opacity-50"></div>

          <div className="space-y-2 text-slate-300 shrink-0 pb-3 border-b border-slate-800/80">
            <div className="flex justify-between items-end"><span className="text-slate-500 uppercase">Mesas Atendidas</span><span className="font-bold text-white">{mesasAtendidas} mesas</span></div>
            
            {/* INGRESO PARA EL RESTAURANTE */}
            <div className="pt-2"><span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">INGRESOS DEL NEGOCIO:</span></div>
            <div className="flex justify-between items-end pl-2"><span className="text-slate-500 uppercase text-[10px]">Ventas 💵 Efectivo</span><span>${realEfectivoVenta.toFixed(2)}</span></div>
            <div className="flex justify-between items-end pl-2"><span className="text-slate-500 uppercase text-[10px]">Ventas 💳 Tarjeta</span><span>${realTarjetaVenta.toFixed(2)}</span></div>
            <div className="flex justify-between items-end pt-1 text-sm font-black"><span className="text-slate-400 uppercase">Venta Bruta</span><span className="text-emerald-400">${totalVentas.toFixed(2)}</span></div>
            
            {/* FONDOS PARA LOS MESEROS */}
            <div className="pt-2"><span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">PROPINAS RECAUDADAS:</span></div>
            <div className="flex justify-between items-end pl-2"><span className="text-slate-500 uppercase text-[10px]">Propinas 💵 Efectivo</span><span>${realEfectivoPropina.toFixed(2)}</span></div>
            <div className="flex justify-between items-end pl-2"><span className="text-slate-500 uppercase text-[10px]">Propinas 💳 Tarjeta</span><span>${realTarjetaPropina.toFixed(2)}</span></div>
            <div className="flex justify-between items-end text-xs font-bold mt-1 text-amber-400 border-t border-dashed border-slate-700 pt-1"><span className="uppercase">Total a repartir a Meseros</span><span>${totalPropinasRecibidas.toFixed(2)}</span></div>
          </div>

          {/* ARQUEO DE CAJA FÍSICO */}
          <div className="mt-3 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 shrink-0">
            <div className="text-[9px] font-black text-white uppercase tracking-widest text-center mb-2">AUDITORÍA Y ARQUEO FÍSICO DE GAVETA</div>
            
            <div className="flex justify-between items-end text-[10px] text-emerald-400/80 mb-1">
              <span>Ingresos en Efectivo (Ventas+Fondo):</span>
              <span>+ ${(realEfectivoVenta + realEfectivoPropina + fondoYEntradas).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-end text-[10px] text-rose-400/80 mb-2 pb-2 border-b border-slate-700/50">
              <span>Salidas y Pagos de Caja:</span>
              <span>- ${pagosYSalidas.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 rounded-lg">
              <span className="text-[10px] font-black text-emerald-500 uppercase">EFECTIVO ESPERADO:</span>
              <span className="text-lg font-black text-emerald-400">${efectivoFisicoEsperado.toFixed(2)}</span>
            </div>
          </div>

        </div>

        {/* ADVERTENCIA */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 mb-4 text-center shrink-0">
          <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest leading-normal">
            ⚠️ Al sellar caja se cerrará el turno y se vaciarán las cuentas vivas.
          </p>
        </div>

        {/* PIE: BOTONES */}
        <div className="flex flex-col gap-2 shrink-0">
          <button onClick={exportarExcel} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-transform active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
            <span>📥 Exportar Reporte a Excel (.xls)</span>
          </button>
          
          <div className="flex gap-2.5">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer">Cancelar</button>
            <button onClick={onConfirm} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-rose-600/20 transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1">
              <span>🔒 Sellar Caja</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}