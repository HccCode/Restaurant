import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';

export default function HistorialCortes() {
  const [cortes, setCortes] = useState([]);
  const [filtroFolio, setFiltroFolio] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [corteSeleccionado, setCorteSeleccionado] = useState(null);

  const buscarCortes = () => {
    const url = `http://${window.location.hostname}:3000/api/cortes?folio=${filtroFolio}&fecha=${filtroFecha}`;
    fetch(url).then(res => res.json()).then(data => setCortes(data)).catch(err => console.error(err));
  };

  useEffect(() => { buscarCortes(); }, [filtroFecha]); 

  // 🔥 MOTOR EXCEL PARA AUDITORÍAS HISTÓRICAS (.xls) 🔥
  const exportarExcelAuditoria = () => {
    if (!corteSeleccionado) return;

    let html = `
      <table border="1" style="font-family: Arial, sans-serif; border-collapse: collapse;">
        <thead>
          <tr>
            <th colspan="5" style="background:#1e1b4b; color:#ffffff; font-size:16px; padding:15px;">
              AUDITORÍA DESGLOSADA DE TURNO — ${corteSeleccionado.folio}
            </th>
          </tr>
          <tr style="background:#f8fafc;">
            <td colspan="2" style="padding:8px;"><b>Auditado por:</b> @${corteSeleccionado.usuario_cierre}</td>
            <td colspan="3" style="padding:8px;"><b>Fecha:</b> ${new Date(corteSeleccionado.fecha).toLocaleString('es-MX')}</td>
          </tr>
          <tr><td colspan="5"></td></tr>
          <tr style="background:#cbd5e1; color:#0f172a; font-weight:bold;">
            <th style="padding:10px; width:80px;">Mesa</th>
            <th style="padding:10px; width:180px;">Cliente / Titular</th>
            <th style="padding:10px; width:80px;">Pax</th>
            <th style="padding:10px; width:350px;">Consumo (Alimentos y Bebidas)</th>
            <th style="padding:10px; width:120px;">Cobrado</th>
          </tr>
        </thead>
        <tbody>
    `;

    const ventas = corteSeleccionado.ventas_detalle || [];

    if (ventas.length === 0) {
      html += `<tr><td colspan="5" style="padding:20px; text-align:center; font-style:italic;">Este corte histórico se realizó antes de activar el registro de alimentos desglosado</td></tr>`;
    } else {
      ventas.forEach(v => {
        let platillosStr = "";
        let listaItems = v.items_consumidos;
        
        if (typeof listaItems === 'string') {
          try { listaItems = JSON.parse(listaItems); } catch(e) { listaItems = []; }
        }

        if (Array.isArray(listaItems)) {
          platillosStr = listaItems.map(p => `• ${p.cantidad}x ${p.nombre} ($${(p.precio * p.cantidad).toFixed(2)})`).join('<br/>');
        }

        html += `
          <tr>
            <td style="text-align:center; padding:10px; font-weight:bold;">${v.numMesa || 'Barra'}</td>
            <td style="padding:10px;">${v.cliente || 'General'}</td>
            <td style="text-align:center; padding:10px;">${v.personas || 1}</td>
            <td style="padding:10px; font-size:11px; color:#334155;">${platillosStr || 'Venta directa en mostrador'}</td>
            <td style="text-align:right; padding:10px; font-weight:bold; color:#16a34a;">$${parseFloat(v.total || 0).toFixed(2)}</td>
          </tr>
        `;
      });
    }

    html += `
        </tbody>
        <tfoot>
          <tr><td colspan="5"></td></tr>
          <tr style="background:#f1f5f9; font-size:13px;">
            <td colspan="3"></td>
            <td style="text-align:right; font-weight:bold; padding:10px;">TOTAL AUDITADO EN TURNO:</td>
            <td style="text-align:right; font-weight:bold; color:#15803d; padding:10px; font-size:15px;">
              $${parseFloat(corteSeleccionado.total_ventas || 0).toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    `;

    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Auditoria_${corteSeleccionado.folio}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDescargarPDF = () => {
    if (!corteSeleccionado) return;
    const opciones = {
      margin:       10,
      filename:     `Corte_Z_${corteSeleccionado.folio}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    const elemento = document.getElementById('reporte-pdf-container');
    html2pdf().set(opciones).from(elemento).save();
  };

  return (
    <div className="animate-fade-in font-sans select-none">
      
      {/* BLOQUE DE BÚSQUEDA */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 mb-8 flex flex-wrap gap-4 items-end shadow-lg">
        <div className="w-48">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Buscar por Folio</label>
          <input type="text" placeholder="Ej. CZ-0001..." value={filtroFolio} onChange={e => setFiltroFolio(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs mt-1 text-white focus:outline-none uppercase font-mono" />
        </div>
        <div className="w-48">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filtrar por Fecha</label>
          <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs mt-1 text-slate-300 focus:outline-none [color-scheme:dark] cursor-pointer" />
        </div>
        <button onClick={buscarCortes} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-lg shadow-indigo-600/20">
          🔍 Filtrar Auditorías
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* TABLA HISTÓRICA */}
        <div className="xl:col-span-2 bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl h-fit">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Folio de Turno</th>
                <th className="p-4">Fecha / Hora</th>
                <th className="p-4 text-center">Mesas (Pax)</th>
                <th className="p-4 text-right">Monto Total</th>
                <th className="p-4 pr-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {cortes.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500 italic">Ningún cierre coincide con la búsqueda.</td></tr>
              ) : (
                cortes.map(c => (
                  <tr key={c.id} className={`hover:bg-slate-900/50 transition-colors ${corteSeleccionado?.id === c.id ? 'bg-indigo-500/10' : ''}`}>
                    <td className="p-4 pl-6 font-mono font-bold text-indigo-400">{c.folio}</td>
                    <td className="p-4 text-slate-400">{new Date(c.fecha).toLocaleString()}</td>
                    <td className="p-4 text-center">{c.mesas_cobradas} mesas <span className="text-[10px] text-slate-500">({c.total_personas || 0} pax)</span></td>
                    <td className="p-4 text-right font-mono font-black text-emerald-400">${parseFloat(c.total_ventas).toFixed(2)}</td>
                    <td className="p-4 pr-6 text-right">
                      <button onClick={() => setCorteSeleccionado(c)} className="px-3 py-1.5 bg-slate-950 border border-slate-700 hover:border-indigo-500 hover:text-indigo-300 rounded-lg text-[11px] font-bold cursor-pointer transition-all">Ver Detalles</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* DETALLE FINANCIERO PREMIUM */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-2xl shadow-xl h-fit overflow-hidden">
          {corteSeleccionado && (
            <div className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Auditoría Seleccionada</span>
              
              {/* 🔥 BOTONERA DOBLE EN PANTALLA 🔥 */}
              <div className="flex gap-2">
                <button 
                  onClick={exportarExcelAuditoria} 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>📊</span> Excel
                </button>
              </div>

            </div>
          )}

          <div className="p-6">
            {corteSeleccionado ? (
              <div id="reporte-pdf-container" className="space-y-6 p-4 bg-[#0f172a]">
                <div className="border-b border-slate-800 pb-3 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded font-bold font-mono">{corteSeleccionado.folio}</span>
                    <h3 className="font-black text-white text-sm mt-2">Cierre Auditado por @{corteSeleccionado.usuario_cierre}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">{new Date(corteSeleccionado.fecha).toLocaleString()}</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-[10px] font-bold text-slate-500 uppercase font-sans">VENTA BRUTA</p>
                    <p className="text-xl font-black text-emerald-400">${parseFloat(corteSeleccionado.total_ventas).toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="border-r border-b border-slate-800/60 pb-2"><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Mesas Totales</p><p className="text-lg font-black text-white mt-0.5">{corteSeleccionado.mesas_cobradas}</p></div>
                  <div className="border-b border-slate-800/60 pb-2"><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Comensales</p><p className="text-lg font-black text-white mt-0.5">{corteSeleccionado.total_personas || 0} <span className="text-[10px] font-normal text-slate-500">pax</span></p></div>
                  <div className="border-r border-slate-800/60 pt-2"><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Ticket x Mesa</p><p className="text-sm font-black text-emerald-400 mt-0.5 font-mono">${parseFloat(corteSeleccionado.ticket_promedio).toFixed(1)}</p></div>
                  <div className="pt-2"><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Gasto x Pax</p><p className="text-sm font-black text-indigo-400 mt-0.5 font-mono">${parseFloat(corteSeleccionado.promedio_por_persona || 0).toFixed(1)}</p></div>
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-4 font-mono">
                  <span>Base Imponible: ${parseFloat(corteSeleccionado.subtotal).toFixed(2)}</span>
                  <span>IVA Trasladado: ${parseFloat(corteSeleccionado.iva).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-600 italic">
                <span className="text-4xl mb-3 opacity-50">📑</span>
                <p className="text-xs font-bold px-4">Selecciona un folio de la tabla izquierda para abrir la auditoría de exportación.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}