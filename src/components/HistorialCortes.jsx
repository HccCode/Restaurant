import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min.js';

export default function HistorialCortes() {
  const [cortes, setCortes] = useState([]);
  const [filtroFolio, setFiltroFolio] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [corteSeleccionado, setCorteSeleccionado] = useState(null);

  const buscarCortes = () => {
    const url = `http://${window.location.hostname}:3000/api/cortes?folio=${filtroFolio}&fecha=${filtroFecha}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setCortes(data))
      .catch(err => console.error(err));
  };

  // Se ejecuta cada vez que el usuario elige un día diferente en el calendario
  useEffect(() => { buscarCortes(); }, [filtroFecha]); 

  // --- FUNCIÓN MÁGICA PARA GENERAR EL PDF ---
  const handleDescargarPDF = () => {
    if (!corteSeleccionado) return;
    
    // Configuramos cómo se verá la "hoja de papel"
    const opciones = {
      margin:       10,
      filename:     `Corte_Z_${corteSeleccionado.folio}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f172a' }, // Fondo oscuro del sistema
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Apuntamos al contenedor que tiene todo el diseño del reporte
    const elemento = document.getElementById('reporte-pdf-container');
    
    html2pdf().set(opciones).from(elemento).save();
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#020617] text-slate-200">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Historial Financiero (Cortes Z)</h1>
        <p className="text-xs text-slate-400 mt-1">Auditoría detallada con inteligencia de negocio y exportación a PDF.</p>
      </header>

      {/* BLOQUE DE BÚSQUEDA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 flex flex-wrap gap-4 items-end shadow-lg">
        <div className="w-48">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Buscar por Folio</label>
          <input type="text" placeholder="Ej. CZ-2026..." value={filtroFolio} onChange={e => setFiltroFolio(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs mt-1 text-white focus:outline-none uppercase" />
        </div>
        
        {/* FILTRO DE FECHA (CALENDARIO) */}
        <div className="w-48">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filtrar por Fecha</label>
          <input 
            type="date" 
            value={filtroFecha} 
            onChange={e => setFiltroFecha(e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs mt-1 text-slate-300 focus:outline-none [color-scheme:dark] cursor-pointer" 
          />
        </div>
        
        <button onClick={buscarCortes} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all">
          🔍 Filtrar Registro
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* TABLA HISTÓRICA */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl h-fit">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Folio de Turno</th>
                <th className="p-4">Fecha / Hora</th>
                <th className="p-4 text-center">Mesas (Pax)</th>
                <th className="p-4 text-right">Monto Total</th>
                <th className="p-4 pr-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {cortes.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500 italic">Ningún cierre coincide con la fecha seleccionada.</td></tr>
              ) : (
                cortes.map(c => (
                  <tr key={c.id} className={`hover:bg-slate-800/30 transition-colors ${corteSeleccionado?.id === c.id ? 'bg-indigo-500/5' : ''}`}>
                    <td className="p-4 pl-6 font-mono font-bold text-indigo-400">{c.folio}</td>
                    <td className="p-4 text-slate-400">{new Date(c.fecha).toLocaleString()}</td>
                    <td className="p-4 text-center text-slate-300">{c.mesas_cobradas} mesas <span className="text-[10px] text-slate-500">({c.total_personas || 0} pax)</span></td>
                    <td className="p-4 text-right font-black text-white">${parseFloat(c.total_ventas).toFixed(2)}</td>
                    <td className="p-4 pr-6 text-right">
                      <button onClick={() => setCorteSeleccionado(c)} className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-all hover:text-white">Ver Detalles</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* DETALLE FINANCIERO PREMIUM (ESTO ES LO QUE SE IMPRIME EN EL PDF) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl h-fit overflow-hidden">
          
          {/* BARRA SUPERIOR CON EL BOTÓN PDF */}
          {corteSeleccionado && (
            <div className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Auditoría Seleccionada</span>
              <button onClick={handleDescargarPDF} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer">
                📄 Generar PDF
              </button>
            </div>
          )}

          <div className="p-6">
            {corteSeleccionado ? (
              
              // --- INICIO DEL CONTENEDOR PDF ---
              <div id="reporte-pdf-container" className="space-y-6 p-4">
                
                <div className="border-b border-slate-800 pb-3 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded font-bold font-mono">{corteSeleccionado.folio}</span>
                    <h3 className="font-black text-white text-sm mt-2">Cierre Auditado por @{corteSeleccionado.usuario_cierre}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">{new Date(corteSeleccionado.fecha).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">VENTA BRUTA TOTAL</p>
                    <p className="text-xl font-black text-emerald-400">${parseFloat(corteSeleccionado.total_ventas).toFixed(2)}</p>
                  </div>
                </div>

                {/* PANEL DE 4 KPI's */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="border-r border-b border-slate-800/60 pb-2"><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Mesas Totales</p><p className="text-lg font-black text-white mt-0.5">{corteSeleccionado.mesas_cobradas}</p></div>
                  <div className="border-b border-slate-800/60 pb-2"><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Comensales</p><p className="text-lg font-black text-white mt-0.5">{corteSeleccionado.total_personas || 0} <span className="text-[10px] font-normal text-slate-500">pax</span></p></div>
                  <div className="border-r border-slate-800/60 pt-2"><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Ticket x Mesa</p><p className="text-sm font-black text-emerald-400 mt-0.5">${parseFloat(corteSeleccionado.ticket_promedio).toFixed(1)}</p></div>
                  <div className="pt-2"><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Gasto x Pax</p><p className="text-sm font-black text-indigo-400 mt-0.5">${parseFloat(corteSeleccionado.promedio_por_persona || 0).toFixed(1)}</p></div>
                </div>

                {/* DESGLOSE POR CATEGORÍA */}
                {corteSeleccionado.ventas_por_categoria && corteSeleccionado.ventas_por_categoria.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">📊 Mezcla de Ventas (Mix)</h4>
                    <div className="space-y-2">
                      {corteSeleccionado.ventas_por_categoria.sort((a,b) => b.total - a.total).map((cat, idx) => {
                        const porcentaje = ((cat.total / parseFloat(corteSeleccionado.total_ventas)) * 100).toFixed(0);
                        return (
                          <div key={idx} className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              <span className="text-xs font-bold text-slate-300">{cat.categoria}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-white mr-2">${parseFloat(cat.total).toFixed(0)}</span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 rounded">{porcentaje}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* LISTA DE PLATILLOS */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">🍔 Productos Despachados</h4>
                  <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
                    {corteSeleccionado.productos_vendidos?.map((p, index) => (
                      <div key={index} className="p-2.5 px-4 flex justify-between text-xs items-center">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-black">{p.cantidad}x</span>
                          <span className="font-bold text-slate-300 truncate max-w-[130px]">{p.nombre}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-400">${parseFloat(p.total_producto || 0).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* IMPUESTOS */}
                <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-4 font-mono">
                  <span>Base Imponible: ${parseFloat(corteSeleccionado.subtotal).toFixed(2)}</span>
                  <span>IVA Trasladado: ${parseFloat(corteSeleccionado.iva).toFixed(2)}</span>
                </div>

              </div>
              // --- FIN DEL CONTENEDOR PDF ---

            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-600 italic">
                <span className="text-4xl mb-3 opacity-50">📑</span>
                <p className="text-xs font-bold px-4">Selecciona un folio del historial para abrir el desglose contable detallado.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}