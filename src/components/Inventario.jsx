import React, { useState, useEffect } from 'react';

// Recibimos el "usuario" como prop para validar sus permisos
export default function Inventario({ usuario }) {
  const [inventario, setInventario] = useState([]);
  const [mermas, setMermas] = useState([]);
  const [menu, setMenu] = useState([]);
  const [pestaña, setPestaña] = useState('almacen'); 
  
  // Seguridad Front-End:
  const tienePermisosEspeciales = ['Gerente', 'Subgerente', 'Cocinero'].includes(usuario?.rol);

  // Modales
  const [modalStock, setModalStock] = useState({ open: false, id: null, nombre: '', unidad: '' });
  const [modalMerma, setModalMerma] = useState({ open: false, id: null, nombre: '', unidad: '' });
  const [modalNuevoInsumo, setModalNuevoInsumo] = useState(false);
  const [modalNuevoPlato, setModalNuevoPlato] = useState(false);
  
  // Formularios
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

  // --- Lógicas de Post/Delete ---
  const handleSumarStock = async (e) => {
    e.preventDefault();
    await fetch(`${BASE_URL}/inventario/ajuste`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: modalStock.id, cantidadAgregar: parseFloat(cantidadInput) }) });
    cargarDatos(); setModalStock({ open: false }); setCantidadInput('');
  };

  const handleRegistrarMerma = async (e) => {
    e.preventDefault();
    await fetch(`${BASE_URL}/mermas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inventario_id: modalMerma.id, cantidad: parseFloat(cantidadInput), motivo: motivoMerma }) });
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
    <div className="h-full flex flex-col bg-[#020617] text-slate-200 p-8 overflow-y-auto relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Administración</h1>
          <p className="text-sm text-slate-400 mt-1">Gestión de Almacén y Menú Operativo</p>
        </div>
        <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button onClick={() => setPestaña('almacen')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${pestaña === 'almacen' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}>📦 Almacén</button>
          <button onClick={() => setPestaña('menu')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${pestaña === 'menu' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>🍔 Menú POS</button>
          <button onClick={() => setPestaña('mermas')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${pestaña === 'mermas' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>🗑️ Mermas</button>
        </div>
      </div>

      {/* PESTAÑA: ALMACÉN */}
      {pestaña === 'almacen' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex-1 flex flex-col relative">
          {tienePermisosEspeciales && (
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-end">
              <button onClick={() => setModalNuevoInsumo(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg cursor-pointer">+ Dar de Alta Insumo</button>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Insumo</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Mínimo Req.</th>
                <th className="p-4 text-right pr-6">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {inventario.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/40">
                  <td className="p-4 pl-6 font-bold text-white">{item.nombre}</td>
                  <td className="p-4 font-extrabold text-indigo-400">{item.cantidad} {item.unidad}</td>
                  <td className="p-4 text-slate-400">{item.stock_minimo} {item.unidad}</td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button onClick={() => { setModalStock({ open: true, id: item.id, nombre: item.nombre, unidad: item.unidad }); setCantidadInput(''); }} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold text-xs cursor-pointer">+ Ingresar</button>
                    <button onClick={() => { setModalMerma({ open: true, id: item.id, nombre: item.nombre, unidad: item.unidad }); setCantidadInput(''); }} className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg font-bold text-xs cursor-pointer">- Merma</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PESTAÑA: MENÚ */}
      {pestaña === 'menu' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex-1 flex flex-col relative">
          {tienePermisosEspeciales && (
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-end">
              <button onClick={() => setModalNuevoPlato(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-lg cursor-pointer">+ Nuevo Platillo al Menú</button>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Foto</th>
                <th className="p-4">Platillo</th>
                <th className="p-4">Categoría</th>
                <th className="p-4 font-black text-emerald-400">Precio Venta</th>
                <th className="p-4 text-right pr-6">Ajustes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {menu.map(plato => (
                <tr key={plato.id} className="hover:bg-slate-800/40">
                  <td className="p-4 pl-6"><img src={plato.imagen || 'https://via.placeholder.com/150'} className="w-10 h-10 object-cover rounded-lg border border-slate-700" alt="plato"/></td>
                  <td className="p-4 font-bold text-white">{plato.nombre}</td>
                  <td className="p-4 font-medium text-slate-400">{plato.categoria}</td>
                  <td className="p-4 font-extrabold text-emerald-400">${parseFloat(plato.precio).toFixed(2)}</td>
                  <td className="p-4 pr-6 text-right">
                    {tienePermisosEspeciales ? (
                      <button onClick={() => handleEliminarPlato(plato.id)} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold text-xs cursor-pointer">Eliminar</button>
                    ) : (
                      <span className="text-xs text-slate-600">Sin Permisos</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales Existentes omitidos por brevedad visual, aquí los agregamos: */}
      {modalNuevoInsumo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <form onSubmit={handleCrearInsumo} className="bg-slate-900 border border-amber-500/30 p-6 rounded-2xl w-96">
            <h3 className="text-lg font-black text-amber-400 mb-4">Alta de Insumo Físico</h3>
            <input required placeholder="Nombre (Ej. Salmón)" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white mb-3 text-sm" onChange={e => setFormInsumo({...formInsumo, nombre: e.target.value})} />
            <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white mb-3 text-sm" onChange={e => setFormInsumo({...formInsumo, unidad: e.target.value})}>
              <option value="kg">Kilogramos (kg)</option><option value="pz">Piezas (pz)</option><option value="litros">Litros (l)</option>
            </select>
            <input required type="number" placeholder="Stock Mínimo de Alerta" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white mb-3 text-sm" onChange={e => setFormInsumo({...formInsumo, stock_minimo: e.target.value})} />
            <input required type="number" placeholder="Costo Promedio ($)" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white mb-4 text-sm" onChange={e => setFormInsumo({...formInsumo, costo_unitario: e.target.value})} />
            <div className="flex gap-2"><button type="button" onClick={() => setModalNuevoInsumo(false)} className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Cancelar</button><button type="submit" className="flex-1 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-black">Guardar Almacén</button></div>
          </form>
        </div>
      )}

      {modalNuevoPlato && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <form onSubmit={handleCrearPlato} className="bg-slate-900 border border-indigo-500/30 p-6 rounded-2xl w-96">
            <h3 className="text-lg font-black text-indigo-400 mb-4">Añadir al Menú Comercial</h3>
            <input required placeholder="Nombre del Platillo" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white mb-3 text-sm" onChange={e => setFormPlato({...formPlato, nombre: e.target.value})} />
            <input required type="number" step="0.01" placeholder="Precio de Venta ($)" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white mb-3 text-sm" onChange={e => setFormPlato({...formPlato, precio: e.target.value})} />
            <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white mb-3 text-sm" onChange={e => setFormPlato({...formPlato, categoria: e.target.value})}>
              <option>Entradas</option><option>Platos Fuertes</option><option>Bebidas</option><option>Postres</option>
            </select>
            <input placeholder="URL de Imagen (Opcional)" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white mb-4 text-sm" onChange={e => setFormPlato({...formPlato, imagen: e.target.value})} />
            <div className="flex gap-2"><button type="button" onClick={() => setModalNuevoPlato(false)} className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Cancelar</button><button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black">Publicar Menú</button></div>
          </form>
        </div>
      )}

      {modalStock.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <form onSubmit={handleSumarStock} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-96"><h3 className="text-lg font-black text-white">Ingresar Mercancía</h3><input type="number" step="0.01" autoFocus required value={cantidadInput} onChange={e => setCantidadInput(e.target.value)} placeholder={`Ej: 5.00 ${modalStock.unidad}`} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white mt-4 font-bold outline-none focus:border-emerald-500" /><div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setModalStock({ open: false })} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Cancelar</button><button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Sumar</button></div></form>
        </div>
      )}
      {modalMerma.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <form onSubmit={handleRegistrarMerma} className="bg-slate-900 border border-rose-500/30 p-6 rounded-2xl w-96"><h3 className="text-lg font-black text-rose-400">Declarar Merma</h3><input type="number" step="0.01" autoFocus required value={cantidadInput} onChange={e => setCantidadInput(e.target.value)} placeholder="Cantidad perdida" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white mt-4 font-bold outline-none focus:border-rose-500" /><div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setModalMerma({ open: false })} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Cancelar</button><button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">Restar</button></div></form>
        </div>
      )}
    </div>
  );
}