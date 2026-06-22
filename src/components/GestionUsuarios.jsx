import React, { useState, useEffect } from 'react';

// Recibimos al usuario que tiene la sesión activa
export default function GestionUsuarios({ usuarioLogueado }) {
  const [usuarios, setUsuarios] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ usuario: '', password: '', nombre: '', rol: 'Mesero' });

  const BASE_URL = `http://${window.location.hostname}:3000/api/usuarios`;

  const cargarUsuarios = async () => {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) setUsuarios(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.usuario || !form.password || !form.nombre) return;

    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setModalOpen(false);
        setForm({ usuario: '', password: '', nombre: '', rol: 'Mesero' });
        cargarUsuarios();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Error al crear el usuario');
      }
    } catch (err) { setError('Error de conexión con el servidor.'); }
  };

  // Función de baja enviando quién es el solicitante
  const handleEliminar = async (id, nombre, rolObjetivo) => {
    // Doble verificación en Frontend
    if (rolObjetivo === 'Gerente' && usuarioLogueado?.rol === 'Subgerente') {
      alert('🔒 ACCESO DENEGADO: Tu nivel de jerarquía no te permite dar de baja a un Gerente.');
      return;
    }

    if (window.confirm(`¿Dar de baja a ${nombre} (${rolObjetivo}) del sistema?`)) {
      try {
        const res = await fetch(`${BASE_URL}/${id}?rolSolicitante=${usuarioLogueado.rol}`, { 
          method: 'DELETE' 
        });
        
        if (res.ok) {
          cargarUsuarios();
        } else {
          const dataErr = await res.json();
          alert(dataErr.error);
        }
      } catch (err) { console.error(err); }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#020617] text-slate-200 p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Gestión de Personal</h1>
          <p className="text-sm text-slate-400 mt-1">
            Operando como: <span className="text-indigo-400 font-bold">{usuarioLogueado?.nombre} ({usuarioLogueado?.rol})</span>
          </p>
        </div>
        <button 
          onClick={() => { setModalOpen(true); setError(''); }}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all cursor-pointer"
        >
          + Dar de Alta Empleado
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-black text-slate-400 uppercase tracking-wider">
              <th className="p-4 pl-6">Empleado</th>
              <th className="p-4">Usuario (Login)</th>
              <th className="p-4">Rol del Sistema</th>
              <th className="p-4 pr-6 text-right">Estatus de Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {usuarios.map(u => {
              // Lógica de renderizado condicional del botón
              const esGerente = u.rol === 'Gerente';
              const soySubgerente = usuarioLogueado?.rol === 'Subgerente';
              const intocable = esGerente && soySubgerente;

              return (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 pl-6 font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                      {u.nombre.charAt(0)}
                    </div>
                    {u.nombre}
                  </td>
                  <td className="p-4 text-slate-400 font-mono">@{u.usuario}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      u.rol === 'Gerente' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      u.rol === 'Subgerente' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {intocable ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-950 border border-slate-800/80 px-2.5 py-1 rounded-md select-none">
                        🔒 Protegido
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleEliminar(u.id, u.nombre, u.rol)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                      >
                        Dar de Baja
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Alta de Usuario */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-96 shadow-2xl">
            <h3 className="text-lg font-black text-white">Registrar Nuevo Empleado</h3>
            {error && <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-lg text-center">{error}</div>}

            <input type="text" required placeholder="Nombre Completo" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mt-4 text-sm outline-none focus:border-indigo-500" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
            <input type="text" required placeholder="Usuario de login (Ej: juan.p)" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mt-3 text-sm font-mono outline-none focus:border-indigo-500" value={form.usuario} onChange={e => setForm({...form, usuario: e.target.value})} />
            <input type="password" required placeholder="Contraseña temporal" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mt-3 text-sm outline-none focus:border-indigo-500" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            
            <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mt-3 text-sm outline-none focus:border-indigo-500 font-bold" value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
              <option value="Gerente">Gerente</option>
              <option value="Subgerente">Subgerente</option>
              <option value="Hostess">Hostess</option>
              <option value="Mesero">Mesero</option>
              <option value="Cocinero">Cocinero</option>
            </select>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}