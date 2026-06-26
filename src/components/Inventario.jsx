import React, { useState, useEffect } from 'react';

// VECTOR LOCAL BLINDADO (0 bytes de internet requeridos)
const IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%230f172a'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-weight='bold' font-size='13' fill='%23475569' dominant-baseline='middle' text-anchor='middle'%3ESIN FOTO%3C/text%3E%3C/svg%3E";

export default function Inventario({ usuario }) {
  const [inventario, setInventario] = useState([]);
  const [mermas, setMermas] = useState([]);
  const [menu, setMenu] = useState([]);
  const [pestaña, setPestaña] = useState('almacen'); 
  
  const tienePermisosEspeciales = ['Gerente', 'Subgerente', 'Cocinero'].includes(usuario?.rol);

  const [modalStock, setModalStock] = useState({ open: false, id: null, nombre: '', unidad: '', stockActual: 0 });
  const [modalMerma, setModalMerma] = useState({ open: false, id: null, nombre: '', unidad: '' });
  const [modalNuevoInsumo, setModalNuevoInsumo] = useState(false);
  const [modalNuevoPlato, setModalNuevoPlato] = useState(false);
  
  const [cantidadInput, setCantidadInput] = useState('');
  const [motivoMerma, setMotivoMerma] = useState('Producto caducado / descompuesto');
  const [formInsumo, setFormInsumo] = useState({ nombre: '', unidad: 'kg', stock_minimo: '', costo_unitario: '' });
  const [formPlato, setFormPlato] = useState({ nombre: '', precio: '', categoria: 'Platos Fuertes', imagen: '' });

  const BASE_URL = `http://${window.location.hostname}:3000/api`;

  const cargarDatos = async () => {
    try {
      const resInv = await fetch(`${BASE_URL}/inventario`);
      if (resInv.ok) setInventario(await resInv.json());

      const resMer = await fetch(`${BASE_URL}/mermas`);
      if (resMer.ok) setMermas(await resMer.json());

      const resMenu = await fetch(`${BASE_URL}/menu`);
      if (resMenu.ok) setMenu(await resMenu.json());
    } catch (error) { console.error("Error:", error); }
  };

  useEffect(() => { cargarDatos(); }, []);

  // =========================================================================
  // 🔥 MOTORES DE EXPORTACIÓN NATIVA A EXCEL (.xls) 🔥
  // =========================================================================

  const descargarArchivoExcel = (tablaHTML, nombreArchivo) => {
    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body>${tablaHTML}</body></html>`;
    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // REPORTE 1: TODO EL ALMACÉN VALUADO EN DINERO
  const exportarExcelAlmacen = () => {
    if (inventario.length === 0) return alert("No hay insumos en el almacén para exportar.");

    let html = `
      <table border="1" style="font-family: Arial; border-collapse: collapse;">
        <thead>
          <tr><th colspan="6" style="background:#0f172a; color:#ffffff; font-size:16px; padding:14px;">REPORTE GENERAL DE EXISTENCIAS Y VALUACIÓN DE ALMACÉN</th></tr>
          <tr style="background:#f1f5f9;"><td colspan="3"><b>Emisión:</b> ${new Date().toLocaleString('es-MX')}</td><td colspan="3"><b>Total de Insumos:</b> ${inventario.length}</td></tr>
          <tr><td colspan="6"></td></tr>
          <tr style="background:#cbd5e1; color:#0f172a; font-weight:bold;">
            <th style="padding:8px">ID</th>
            <th style="padding:8px">Insumo Físico</th>
            <th style="padding:8px">Existencia Actual</th>
            <th style="padding:8px">Alerta Mínima</th>
            <th style="padding:8px">Costo Unit. Promedio</th>
            <th style="padding:8px">Valor en Almacén</th>
          </tr>
        </thead>
        <tbody>
    `;

    let capitalTotalBodega = 0;

    inventario.forEach(i => {
      const costo = parseFloat(i.costo_unitario || 0);
      const cant = parseFloat(i.cantidad || 0);
      const min = parseFloat(i.stock_minimo || 0);
      const valorTotalItem = costo * cant;
      capitalTotalBodega += valorTotalItem;

      const alertaBajoStock = cant <= min;

      html += `
        <tr>
          <td style="text-align:center">${i.id}</td>
          <td><b>${i.nombre}</b></td>
          <td style="text-align:center; color:${alertaBajoStock ? '#dc2626' : '#000'}; font-weight:${alertaBajoStock ? 'bold' : 'normal'}">${cant} ${i.unidad} ${alertaBajoStock ? ' (RESERVAR)' : ''}</td>
          <td style="text-align:center">${min} ${i.unidad}</td>
          <td style="text-align:right">$${costo.toFixed(2)}</td>
          <td style="text-align:right; font-weight:bold;">$${valorTotalItem.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
        <tfoot>
          <tr><td colspan="6"></td></tr>
          <tr style="background:#e2e8f0; font-size:13px;">
            <td colspan="4"></td>
            <td style="font-weight:bold; text-align:right; padding:10px;">CAPITAL CONGELADO EN BODEGA:</td>
            <td style="font-weight:bold; color:#15803d; text-align:right; padding:10px; font-size:15px;">$${capitalTotalBodega.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    `;

    descargarArchivoExcel(html, `Inventario_Almacen_${new Date().toISOString().slice(0,10)}.xls`);
  };

  // REPORTE 2: HISTÓRICO DE DESPERDICIOS
  const exportarExcelMermas = () => {
    if (mermas.length === 0) return alert("El registro de mermas está limpio.");

    let html = `
      <table border="1" style="font-family: Arial; border-collapse: collapse;">
        <thead>
          <tr><th colspan="4" style="background:#881337; color:#ffffff; font-size:16px; padding:14px;">REPORTE DE AUDITORÍA DE MERMAS Y DESPERDICIOS</th></tr>
          <tr style="background:#fff1f2;"><td colspan="2"><b>Fecha de Corte:</b> ${new Date().toLocaleString('es-MX')}</td><td colspan="2"><b>Sucesos Registrados:</b> ${mermas.length}</td></tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background:#fecdd3; color:#4c0519; font-weight:bold;">
            <th style="padding:8px">Fecha del Suceso</th>
            <th style="padding:8px">Producto Extraviado</th>
            <th style="padding:8px">Cantidad Merma</th>
            <th style="padding:8px">Justificación / Motivo Declarado</th>
          </tr>
        </thead>
        <tbody>
    `;

    mermas.forEach(m => {
      html += `
        <tr>
          <td style="text-align:center">${m.fecha_formateada || 'Reciente'}</td>
          <td><b>${m.item}</b></td>
          <td style="text-align:center; color:#e11d48; font-weight:bold;">-${m.cantidad}</td>
          <td style="font-style:italic; color:#334155;">${m.motivo}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    descargarArchivoExcel(html, `Reporte_Mermas_${new Date().toISOString().slice(0,10)}.xls`);
  };

  // =========================================================================

  const handleSumarStock = async (e) => {
    e.preventDefault();
    const nuevoTotal = (modalStock.stockActual || 0) + parseFloat(cantidadInput || 0);
    await fetch(`${BASE_URL}/inventario/ajuste`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: modalStock.id, stock: nuevoTotal }) });
    cargarDatos(); setModalStock({ open: false }); setCantidadInput('');
  };

  const handleRegistrarMerma = async (e) => {
    e.preventDefault();
    await fetch(`${BASE_URL}/mermas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item: modalMerma.nombre, cantidad: parseFloat(cantidadInput), motivo: motivoMerma }) });
    cargarDatos(); setModalMerma({ open: false }); setCantidadInput('');
  };

  const handleCrearInsumo = async (e) => {
    e.preventDefault();
    await fetch(`${BASE_URL}/inventario`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formInsumo) });
    cargarDatos(); setModalNuevoInsumo(false); setFormInsumo({ nombre: '', unidad: 'kg', stock_minimo: '', costo_unitario: '' });
  };

  const handleCrearPlato = async (e) => {
    e.preventDefault();
    await fetch(`${BASE_URL}/menu`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formPlato) });
    cargarDatos(); setModalNuevoPlato(false); setFormPlato({ nombre: '', precio: '', categoria: 'Platos Fuertes', imagen: '' });
  };

  const handleEliminarPlato = async (id) => {
    if(window.confirm('¿Eliminar este platillo del menú permanentemente?')) {
      await fetch(`${BASE_URL}/menu/${id}`, { method: 'DELETE' });
      cargarDatos();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#020617] text-slate-200 p-8 overflow-y-auto relative font-sans select-none">
      
      {/* BARRA SUPERIOR CON LA NUEVA PESTAÑA VERDE */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Administración</h1>
          <p className="text-sm text-slate-400 mt-1">Gestión de Almacén y Menú Operativo</p>
        </div>
        <div className="flex flex-wrap bg-slate-900 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button onClick={() => setPestaña('almacen')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${pestaña === 'almacen' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}> 📦 Almacén  </button>          
          <button onClick={() => setPestaña('mermas')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${pestaña === 'mermas' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>  🗑️ Mermas  </button>
          <button onClick={() => setPestaña('menu')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${pestaña === 'menu' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}> 🍔 Menú POS  </button>
          <button onClick={() => setPestaña('reportes')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${pestaña === 'reportes' ? 'bg-emerald-500 text-slate-950 shadow-lg font-black' : 'text-slate-400 hover:text-white'}`}>📊 Reportes</button>
        </div>
      </div>

      {/* PESTAÑA 1: ALMACÉN */}
      {pestaña === 'almacen' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex-1 flex flex-col relative animate-fade-in">
          {tienePermisosEspeciales && (
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-end">
              <button onClick={() => setModalNuevoInsumo(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg cursor-pointer">+ Dar de Alta Insumo</button>
            </div>
          )}
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-black text-slate-400 uppercase tracking-wider sticky top-0">
                  <th className="p-4 pl-6">Insumo</th><th className="p-4">Stock</th><th className="p-4">Mínimo Req.</th><th className="p-4 text-right pr-6">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {inventario.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="p-4 pl-6 font-bold text-white">{item.nombre}</td>
                    <td className="p-4 font-extrabold text-indigo-400 font-mono">{item.cantidad} {item.unidad}</td>
                    <td className="p-4 text-slate-400 font-mono">{item.stock_minimo} {item.unidad}</td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button onClick={() => { setModalStock({ open: true, id: item.id, nombre: item.nombre, unidad: item.unidad, stockActual: parseFloat(item.cantidad) || 0 }); setCantidadInput(''); }} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold text-xs cursor-pointer">+ Ingresar</button>
                      <button onClick={() => { setModalMerma({ open: true, id: item.id, nombre: item.nombre, unidad: item.unidad }); setCantidadInput(''); }} className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg font-bold text-xs cursor-pointer">- Merma</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: MENÚ */}
      {pestaña === 'menu' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex-1 flex flex-col relative animate-fade-in">
          {tienePermisosEspeciales && (
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-end">
              <button onClick={() => setModalNuevoPlato(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-lg cursor-pointer">+ Nuevo Platillo al Menú</button>
            </div>
          )}
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-black text-slate-400 uppercase tracking-wider sticky top-0">
                  <th className="p-4 pl-6">Foto</th><th className="p-4">Platillo</th><th className="p-4">Categoría</th><th className="p-4 font-black text-emerald-400">Precio Venta</th><th className="p-4 text-right pr-6">Ajustes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {menu.map(plato => (
                  <tr key={plato.id} className="hover:bg-slate-800/40">
                    <td className="p-4 pl-6"><img src={plato.imagen || IMG_PLACEHOLDER} className="w-10 h-10 object-cover rounded-lg border border-slate-700 bg-slate-950" alt="plato"/></td>
                    <td className="p-4 font-bold text-white">{plato.nombre}</td>
                    <td className="p-4 font-medium text-slate-400">{plato.categoria}</td>
                    <td className="p-4 font-extrabold text-emerald-400 font-mono">${parseFloat(plato.precio).toFixed(2)}</td>
                    <td className="p-4 pr-6 text-right">
                      {tienePermisosEspeciales ? <button onClick={() => handleEliminarPlato(plato.id)} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold text-xs cursor-pointer">Eliminar</button> : <span className="text-xs text-slate-600">Sin Permisos</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: MERMAS */}
      {pestaña === 'mermas' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex-1 flex flex-col relative animate-fade-in">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-black text-slate-400 uppercase tracking-wider sticky top-0">
                  <th className="p-4 pl-6">Registro</th><th className="p-4">Producto Perdido</th><th className="p-4 font-black text-rose-400">Descuento</th><th className="p-4 pr-6">Motivo Declarado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {mermas.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-600 italic">Historial limpio</td></tr> : mermas.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/40"><td className="p-4 pl-6 text-slate-400 font-mono text-xs">{m.fecha_formateada || 'Reciente'}</td><td className="p-4 font-bold text-white">{m.item}</td><td className="p-4 font-black text-rose-400 font-mono">-{m.cantidad}</td><td className="p-4 pr-6 text-slate-300 italic">{m.motivo}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🔥 NUEVA PESTAÑA 4: REPORTES EXCEL EJECUTIVOS 🔥 */}
      {/* ===================================================================== */}
      {pestaña === 'reportes' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in items-start pt-2">
          
          {/* TARJETA 1: REPORTE GENERAL DE ALMACÉN */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col justify-between h-[310px] relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-6 text-9xl opacity-5 select-none pointer-events-none group-hover:scale-110 transition-transform">📦</div>
            
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">Auditoría de Insumos</span>
              <h3 className="text-2xl font-black text-white mt-3 tracking-tight">Valuación de Bodega</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-sm">
                Descarga una hoja con el inventario físico total, detectando celdas en rojo para productos bajo límite mínimo y sumando el dinero total congelado en stock.
              </p>
            </div>
            
            <button 
              onClick={exportarExcelAlmacen}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs tracking-widest uppercase transition-transform active:scale-95 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer z-10"
            >
              <span>📥 Exportar Almacén (.xls)</span>
            </button>
          </div>

          {/* TARJETA 2: REPORTE DE MERMAS */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col justify-between h-[310px] relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-6 text-9xl opacity-5 select-none pointer-events-none group-hover:scale-110 transition-transform">🗑️</div>
            
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">Control de Pérdidas</span>
              <h3 className="text-2xl font-black text-white mt-3 tracking-tight">Reporte de Desperdicios</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-sm">
                Genera el reporte de mermas justificadas para auditorías de cocina, listando fecha, producto perdido, unidades descontadas y la causa declarada.
              </p>
            </div>

            <button 
              onClick={exportarExcelMermas}
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl text-xs tracking-widest uppercase transition-transform active:scale-95 shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer z-10"
            >
              <span>📥 Exportar Mermas (.xls)</span>
            </button>
          </div>

        </div>
      )}
      {/* ===================================================================== */}

      {/* MODALES FORMULARIOS */}
      {modalNuevoInsumo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCrearInsumo} className="bg-slate-900 border border-amber-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-black text-amber-400 mb-4">Alta de Insumo Físico</h3>
            <input required placeholder="Nombre (Ej. Salmón)" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mb-3 text-xs font-bold outline-none focus:border-amber-500" onChange={e => setFormInsumo({...formInsumo, nombre: e.target.value})} />
            <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mb-3 text-xs font-bold outline-none focus:border-amber-500" onChange={e => setFormInsumo({...formInsumo, unidad: e.target.value})}>
              <option value="kg">Kilogramos (kg)</option><option value="pz">Piezas (pz)</option><option value="litros">Litros (l)</option>
            </select>
            <input required type="number" placeholder="Stock Mínimo de Alerta" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mb-3 text-xs font-bold outline-none focus:border-amber-500 font-mono" onChange={e => setFormInsumo({...formInsumo, stock_minimo: e.target.value})} />
            <input required type="number" placeholder="Costo Promedio ($)" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mb-5 text-xs font-bold outline-none focus:border-amber-500 font-mono" onChange={e => setFormInsumo({...formInsumo, costo_unitario: e.target.value})} />
            <div className="flex gap-2"><button type="button" onClick={() => setModalNuevoInsumo(false)} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer">Cancelar</button><button type="submit" className="flex-1 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-black cursor-pointer">Guardar</button></div>
          </form>
        </div>
      )}

      {modalNuevoPlato && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCrearPlato} className="bg-slate-900 border border-indigo-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-black text-indigo-400 mb-4">Añadir al Menú Comercial</h3>
            <input required placeholder="Nombre del Platillo" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mb-3 text-xs font-bold outline-none focus:border-indigo-500" onChange={e => setFormPlato({...formPlato, nombre: e.target.value})} />
            <input required type="number" step="0.01" placeholder="Precio de Venta ($)" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mb-3 text-xs font-bold outline-none focus:border-indigo-500 font-mono" onChange={e => setFormPlato({...formPlato, precio: e.target.value})} />
            <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mb-3 text-xs font-bold outline-none focus:border-indigo-500" onChange={e => setFormPlato({...formPlato, categoria: e.target.value})}>
              <option>Entradas</option><option>Platos Fuertes</option><option>Bebidas</option><option>Postres</option>
            </select>
            <input placeholder="URL de Imagen (Opcional)" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mb-5 text-xs font-bold outline-none focus:border-indigo-500" onChange={e => setFormPlato({...formPlato, imagen: e.target.value})} />
            <div className="flex gap-2"><button type="button" onClick={() => setModalNuevoPlato(false)} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer">Cancelar</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black cursor-pointer">Publicar</button></div>
          </form>
        </div>
      )}

      {modalStock.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSumarStock} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-black text-white">Ingresar Mercancía: <span className="text-emerald-400">{modalStock.nombre}</span></h3>
            <input type="number" step="0.01" autoFocus required value={cantidadInput} onChange={e => setCantidadInput(e.target.value)} placeholder={`Cantidad en ${modalStock.unidad}`} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white mt-4 text-sm font-bold outline-none focus:border-emerald-500 font-mono" />
            <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setModalStock({ open: false })} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer">Cancelar</button><button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black cursor-pointer">Sumar Stock</button></div>
          </form>
        </div>
      )}

      {modalMerma.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleRegistrarMerma} className="bg-slate-900 border border-rose-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-black text-rose-400">Declarar Merma: {modalMerma.nombre}</h3>
            <input type="number" step="0.01" autoFocus required value={cantidadInput} onChange={e => setCantidadInput(e.target.value)} placeholder={`Perdido en ${modalMerma.unidad}`} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mt-4 text-xs font-bold outline-none focus:border-rose-500 font-mono" />
            <select value={motivoMerma} onChange={e => setMotivoMerma(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 mt-3 text-xs outline-none focus:border-rose-500 font-medium">
              <option>Producto caducado / descompuesto</option><option>Accidente en cocina / Caída</option><option>Error de preparación</option><option>Cortesía / Degustación</option>
            </select>
            <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setModalMerma({ open: false })} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer">Cancelar</button><button type="submit" className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black cursor-pointer">Restar Almacén</button></div>
          </form>
        </div>
      )}
    </div>
  );
}