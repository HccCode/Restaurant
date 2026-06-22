import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [credenciales, setCredenciales] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Reemplaza esto con la misma IP local que pusiste en App.jsx
const LOGIN_URL = `http://${window.location.hostname}:3000/api/login`;

  // Lógica maestra de autenticación hacia PostgreSQL
  const realizarAutenticacion = async (usuario, password) => {
    setCargando(true);
    setError('');

    try {
      const respuesta = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });

      if (respuesta.ok) {
        const datosUsuario = await respuesta.json(); // Trae: { id, nombre, rol }
        onLogin(datosUsuario);
      } else {
        const errorData = await respuesta.json();
        setError(errorData.error || 'Acceso denegado');
      }
    } catch (err) {
      setError('Error conectando al servidor. Revisa tu conexión de red local.');
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!credenciales.usuario || !credenciales.password) return;
    realizarAutenticacion(credenciales.usuario.trim(), credenciales.password);
  };

  // Los botones rápidos ahora hacen fetch a la base de datos real
  const accesoRapido = (usuario, password) => {
    realizarAutenticacion(usuario, password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] text-slate-200 font-sans p-4 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative backdrop-blur-xl z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-2xl shadow-[0_0_25px_rgba(99,102,241,0.4)] mx-auto mb-3">S</div>
          <h2 className="text-2xl font-black text-white tracking-tight">Sabor<span className="text-indigo-400">.io</span></h2>
          <p className="text-xs text-slate-400 mt-1">Conexión Segura al Servidor Central</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl text-center animate-fade-in">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Usuario</label>
            <input 
              type="text" required placeholder="Ej. hector" disabled={cargando}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-700 disabled:opacity-50" 
              value={credenciales.usuario} 
              onChange={(e) => setCredenciales({...credenciales, usuario: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
            <input 
              type="password" required placeholder="••••••••" disabled={cargando}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-700 disabled:opacity-50" 
              value={credenciales.password} 
              onChange={(e) => setCredenciales({...credenciales, password: e.target.value})} 
            />
          </div>
          
          <button 
            type="submit" disabled={cargando}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all mt-2 cursor-pointer disabled:bg-indigo-800 disabled:cursor-wait flex items-center justify-center gap-2"
          >
            {cargando ? (
              <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> Autenticando...</>
            ) : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800/80 pt-6">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-3">Autenticación Rápida (Test BD)</span>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button type="button" disabled={cargando} onClick={() => accesoRapido('hector', '1234')} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-bold text-slate-300 hover:border-indigo-500 transition-colors cursor-pointer disabled:opacity-50"><span className="block font-black text-indigo-400">Hector</span> Gerente</button>
            <button type="button" disabled={cargando} onClick={() => accesoRapido('ana', '1234')} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-bold text-slate-300 hover:border-emerald-500 transition-colors cursor-pointer disabled:opacity-50"><span className="block font-black text-emerald-400">Ana</span> Hostess</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={cargando} onClick={() => accesoRapido('carlos', '1234')} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-bold text-slate-300 hover:border-amber-500 transition-colors cursor-pointer disabled:opacity-50"><span className="block font-black text-amber-400">Carlos</span> Mesero</button>
            <button type="button" disabled={cargando} onClick={() => accesoRapido('roberto', '1234')} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-bold text-slate-300 hover:border-rose-500 transition-colors cursor-pointer disabled:opacity-50"><span className="block font-black text-rose-400">Roberto</span> Chef Ejecutivo</button>
          </div>
        </div>
      </div>
    </div>
  );
}