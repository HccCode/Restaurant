import React from 'react';

export default function ModalCorteZ({ isOpen, onClose, onConfirm, datos }) {
  if (!isOpen || !datos) return null;

  const ventasLista = datos.ventas || [];
  const totalVentas = Number(datos.granTotal || datos.totalVentas) || 0;
  const mesasAtendidas = Number(datos.mesasAtendidas || ventasLista.length) || 0;
  const propinasEstimadas = Number(datos.propinasEstimadas || (totalVentas * 0.10)) || 0;

  const estimadoEfectivo = totalVentas * 0.70;
  const estimadoTarjeta = totalVentas * 0.30;

  const fechaCorte = datos.fecha ? `${datos.fecha} • ${datos.hora}` : new Date().toLocaleString('es-MX', { 
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' 
  });
  
  const folioTurno = datos.folioTurno || `TURNO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;

  // 🔥 EXPORTADOR EXCEL (.xls) COMPATIBLE CON OFFICE Y GOOGLE SHEETS 🔥
  const exportarExcel = () => {
    let tablaHTML = `
      <table border="1" style="font-family: Arial; border-collapse: collapse;">
        <thead>
          <tr><th colspan="4" style="background:#1e1b4b; color:#ffffff; font-size:16px; padding:12px;">REPORTE DE VENTAS CORTE Z</th></tr>
          <tr style="background:#f1f5f9;"><td colspan="2"><b>Turno:</b> ${folioTurno}</td><td colspan="2"><b>Corte:</b> ${fechaCorte}</td></tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background:#cbd5e1; font-weight:bold;">
            <th style="padding:8px">Mesa Atendida</th><th style="padding:8px">Cliente / Titular</th><th style="padding:8px">Comensales (Pax)</th><th style="padding:8px">Total Pagado</th>
          </tr>
        </thead>
        <tbody>
    `;

    ventasLista.forEach(v => {
      tablaHTML += `<tr><td style="text-align:center">${v.numMesa || 'Barra'}</td><td>${v.cliente || 'General'}</td><td style="text-align:center">${v.personas || 1}</td><td style="text-align:right">$${Number(v.total).toFixed(2)}</td></tr>`;
    });

    tablaHTML += `
        </tbody>
        <tfoot>
          <tr><td colspan="4"></td></tr>
          <tr><td colspan="2"></td><td style="font-weight:bold; text-align:right">GRAN TOTAL:</td><td style="font-weight:bold; color:#15803d; text-align:right font-size:14px;">$${totalVentas.toFixed(2)}</td></tr>
        </tfoot>
      </table>
    `;

    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body>${tablaHTML}</body></html>`;
    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ventas_${folioTurno}.xls`;
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

        {/* CUERPO DEL TICKET */}
        <div className="bg-[#050812] border border-slate-800/80 rounded-2xl p-5 mb-4 font-mono text-xs shadow-inner relative flex-1 overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjQiPjxwb2x5Z29uIHBvaW50cz0iMCwwIDQsNCA4LDAiIGZpbGw9IiMwYjExMjAiLz48L3N2Zz4=')] opacity-50"></div>

          <div className="space-y-2 text-slate-300 shrink-0 pb-3 border-b border-slate-800/80">
            <div className="flex justify-between items-end"><span className="text-slate-500 uppercase">Mesas Atendidas</span><span className="font-bold text-white">{mesasAtendidas} mesas</span></div>
            <div className="flex justify-between items-end"><span className="text-slate-500 uppercase">Ventas (70% Efe)</span><span>${estimadoEfectivo.toFixed(2)}</span></div>
            <div className="flex justify-between items-end"><span className="text-slate-500 uppercase">Ventas (30% Tar)</span><span>${estimadoTarjeta.toFixed(2)}</span></div>
            <div className="flex justify-between items-end pt-1 text-sm font-black"><span className="text-slate-400 uppercase">Total Bruto</span><span className="text-emerald-400">${totalVentas.toFixed(2)}</span></div>
            <div className="flex justify-between items-end text-[10px]"><span className="text-slate-500 uppercase">Propinas Est. (10%)</span><span className="text-amber-400">${propinasEstimadas.toFixed(2)}</span></div>
          </div>

          {/* 🔥 DESGLOSE CON SCROLL DE LAS MESAS COBRADAS 🔥 */}
          <div className="flex-1 overflow-y-auto pt-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest block mb-1">Desglose de Mesas del Turno:</span>
            {ventasLista.length === 0 ? (
              <p className="text-[10px] text-slate-600 italic text-center py-2">No hay detalle de mesas disponible</p>
            ) : (
              ventasLista.map((v, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-900/40 p-1.5 rounded text-[11px] text-slate-400">
                  <span className="truncate max-w-[170px]">🪑 <b>{v.numMesa}</b>: {v.cliente} ({v.personas}p)</span>
                  <span className="text-slate-200 font-bold">${Number(v.total).toFixed(2)}</span>
                </div>
              ))
            )}
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