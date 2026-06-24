import React, { useState, useEffect } from 'react';

export default function GestionUsuarios({ usuarioLogueado }) {
  const [usuarios, setUsuarios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [pinesRevelados, setPinesRevelados] = useState({});
  const [mensaje, setMensaje] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    pin: '',
    rol: 'Mesero'
  });

  const BASE_URL = `http://${window.location.hostname}:3000/api`;
  const rolesDisponibles = ['Gerente', 'Subgerente', 'Hostess', 'Mesero', 'Cocinero'];

  const cargarUsuarios = async () => {
    try {
      const res = await fetch(`${BASE_URL}/usuarios`);
      if (res.ok) setUsuarios(await res.json());
    } catch (e) {
      mostrarAlerta('Error de red al cargar plantilla', 'error');
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const mostrarAlerta = (texto, tipo = 'exito') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3500);
  };

  // Generador de PIN de 4 dígitos exactos
  const generarPinRandom = () => {
    const aleatorio = Math.floor(1000 + Math.random() * 9000);
    setForm(prev => ({ ...prev, pin: String(aleatorio) }));
  };

  const toggleMostrarPin = (id) => {
    setPinesRevelados(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSeleccionarParaEditar = (user) => {
    setForm({
      nombre: user.nombre || '',
      pin: user.pin || '',
      rol: user.rol || 'Mesero'
    });
    setEditandoId(user.id);
  };

  const cancelarEdicion = () => {
    setForm({ nombre: '', pin: '', rol: 'Mesero' });
    setEditandoId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pinLimpio = form.pin.trim();

    // REGLA DE NEGOCIO ESTRICTA: EXACTAMENTE 4 NÚMEROS
    if (!/^\d{4}$/.test(pinLimpio)) {
      mostrarAlerta('El PIN debe ser estrictamente de 4 dígitos numéricos.', 'error');
      return;
    }

    const url = editandoId ? `${BASE_URL}/usuarios/${editandoId}` : `${BASE_URL}/usuarios`;
    const metodo = editandoId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pin: pinLimpio })
      });

      const data = await res.json();

      if (res.ok) {
        mostrarAlerta(editandoId ? 'PIN y datos actualizados' : 'Colaborador registrado exitosamente');
        cargarUsuarios();
        cancelarEdicion();
      } else {
        mostrarAlerta(data.error || 'Error al guardar (¿Ese PIN ya lo usa alguien más?)', 'error');
      }
    } catch (err) {
      mostrarAlerta('Sin conexión con el servidor', 'error');
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (id === usuarioLogueado?.id) {
      mostrarAlerta('No puedes auto-eliminarte durante tu propia sesión.', 'error');
      return;
    }

    if (!window.confirm(`¿Retirar a ${nombre} de la plantilla activa?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/usuarios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mostrarAlerta('Colaborador dado de baja');
        setUsuarios(usuarios.filter(u => u.id !== id));
        if (editandoId === id) cancelarEdicion();
      }
    } catch (e) {
      mostrarAlerta('Error al intentar eliminar', 'error');
    }
  };

  return (
    <div className="flex-1 p-8 bg-[#070b16] text-slate-100 min-h-screen flex flex-col select-none font-sans overflow-y-auto">
      
      {/* HEADER TÍTULO */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">Gestión de Credenciales e Identidad (PIN)</h1>
        <p className="text-xs text-slate-400 mt-1">Administración corporativa con control RBAC y acceso numérico de 4 dígitos para POS.</p>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-2xl mb-6 text-xs font-bold font-mono text-center transition-all ${
          mensaje.tipo === 'error' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* PANEL IZQUIERDO: FORMULARIO ALTA / EDICIÓN */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80">
            <h3 className="text-sm font-black tracking-wider text-indigo-400 uppercase flex items-center gap-2">
              <span>{editandoId ? '✏️' : '⚡'}</span>
              <span>{editandoId ? 'Modificar Credenciales' : 'Alta de Nuevo Colaborador'}</span>
            </h3>
            {editandoId && (
              <button onClick={cancelarEdicion} className="text-xs font-bold text-slate-500 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-bold text-slate-300">
            
            {/* NOMBRE */}
            <div>
              <label className="block mb-1.5 text-[10px] uppercase tracking-wider text-slate-400">Nombre Completo</label>
              <input
                type="text"
                required
                placeholder="Ej. Carlos Mendoza"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            {/* ROL */}
            <div>
              <label className="block mb-1.5 text-[10px] uppercase tracking-wider text-slate-400">Rol Asignado (Permisos)</label>
              <select
                value={form.rol}
                onChange={e => setForm({ ...form, rol: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-indigo-500 outline-none transition-colors cursor-pointer"
              >
                {rolesDisponibles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* PIN NUMÉRICO DE 4 DÍGITOS */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-400">PIN Numérico (4 Dígitos)</label>
                <button
                  type="button"
                  onClick={generarPinRandom}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-black bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/20 transition-all cursor-pointer"
                >
                  🎲 Auto-Generar
                </button>
              </div>

              <input
                type="text"
                required
                maxLength="4"
                placeholder="Ej. 4821"
                value={form.pin}
                onChange={e => {
                  // FILTRO INSTANTÁNEO: Destruye cualquier letra o símbolo al vuelo
                  const soloNumeros = e.target.value.replace(/\D/g, '');
                  setForm({ ...form, pin: soloNumeros });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-emerald-400 font-mono font-black tracking-widest text-sm focus:border-indigo-500 outline-none transition-colors text-center"
              />
              <span className="text-[10px] text-slate-500 font-normal mt-1 block">Acceso exclusivo mediante pad numérico en Punto de Venta.</span>
            </div>

            {/* BOTÓN SUBMIT */}
            <button
              type="submit"
              className={`w-full py-4 rounded-xl font-black text-xs tracking-widest uppercase transition-all shadow-lg cursor-pointer ${
                editandoId 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {editandoId ? 'Guardar Cambios de PIN' : 'Registrar Colaborador'}
            </button>

          </form>
        </div>

        {/* PANEL DERECHO: LISTA DE EMPLEADOS ACTUALES */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur-md">
          
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
            <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase">Plantilla Activa ({usuarios.length})</h3>
            <span className="text-[10px] font-mono text-slate-500">🔒 Almacenamiento cifrado en PostgreSQL</span>
          </div>

          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {usuarios.map((u) => {
              const esElMismo = u.id === usuarioLogueado?.id;
              const pinRevelado = pinesRevelados[u.id];

              return (
                <div
                  key={u.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    editandoId === u.id 
                      ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md' 
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* AVATAR */}
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-slate-200 text-sm">
                      {u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-white">{u.nombre}</p>
                        {esElMismo && (
                          <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                            TÚ
                          </span>
                        )}
                      </div>

                      {/* PREVISUALIZADOR DE PIN OCULTO */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono text-slate-400 font-bold flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500">PIN:</span>
                          <span className={pinRevelado ? 'text-emerald-400 tracking-widest font-black' : 'text-slate-400 tracking-[0.2em]'}>
                            {pinRevelado ? u.pin : '••••'}
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleMostrarPin(u.id)}
                          className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer p-1"
                          title={pinRevelado ? 'Ocultar PIN' : 'Revelar PIN'}
                        >
                          {pinRevelado ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ZONA DE ACCIONES DERECHA */}
                  <div className="flex items-center gap-3">
                    
                    {/* BADGE DE ROL */}
                    <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                      {u.rol}
                    </span>

                    {/* BOTÓN EDITAR */}
                    <button
                      onClick={() => handleSeleccionarParaEditar(u)}
                      className="text-slate-500 hover:text-indigo-400 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Editar PIN o Rol"
                    >
                      ✏️
                    </button>

                    {/* BOTÓN BORRAR */}
                    <button
                      onClick={() => handleEliminar(u.id, u.nombre)}
                      disabled={esElMismo}
                      className={`p-2 rounded-xl transition-colors ${
                        esElMismo ? 'opacity-20 cursor-not-allowed text-slate-600' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer'
                      }`}
                      title="Dar de baja"
                    >
                      🗑️
                    </button>

                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}