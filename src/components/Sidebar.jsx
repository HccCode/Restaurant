import React, { useState, useEffect } from 'react';

export default function Sidebar({ vistaActual, setVistaActual, usuario, socketConectado, onLogout }) {
  const [colapsadoManual, setColapsadoManual] = useState(false);
  const [anchoVentana, setAnchoVentana] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setAnchoVentana(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const colapsado = colapsadoManual || anchoVentana < 1280;

  // SECCIONES DEL RESTAURANTE CON EL CALENDARIO FIJO E INTOCABLE
  const estructuraMenu = [
    {
      seccion: 'Operación en Vivo',
      items: [
        { id: 'tablero', icono: '🍽️', nombre: 'Salón & Mesas', rol: ['Gerente', 'Hostess'] },
        { id: 'calendario', icono: '📅', nombre: 'Calendario Reservas', rol: ['Gerente', 'Hostess'] }, // <-- FIJO AQUÍ
        { id: 'pos', icono: '🖥️', nombre: 'Punto de Venta', rol: ['Gerente', 'Mesero'] },
        { id: 'cocina', icono: '🔥', nombre: 'KDS Cocina', rol: ['Gerente', 'Cocinero'] },
      ]
    },
    {
      seccion: 'Logística & Recetas',
      items: [
        { id: 'menu_edit', icono: '🍷', nombre: 'Editor Menú', rol: ['Gerente'] },
        { id: 'inventario', icono: '📦', nombre: 'Almacén', rol: ['Gerente'] },
      ]
    },
    {
      seccion: 'Administración',
      items: [
        { id: 'dashboard', icono: '📊', nombre: 'Finanzas', rol: ['Gerente'] },
        { id: 'control_mesas', icono: '🪑', nombre: 'Control de Mesas', rol: ['Gerente'] },
        { id: 'usuarios', icono: '🔑', nombre: 'Personal', rol: ['Gerente'] },
        { id: 'config_negocio', icono: '⚙️', nombre: 'Ajustes', rol: ['Gerente'] },
      ]
    }
  ];

  // FILTRO: Valida roles y destruye secciones vacías de forma dinámica
  const menuPermitido = estructuraMenu.map(grupo => ({
    ...grupo,
    items: grupo.items.filter(item => item.rol.includes(usuario?.rol || 'Mesero'))
  })).filter(grupo => grupo.items.length > 0);

  return (
    <aside className={`bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none transition-all duration-200 relative h-full ${
      colapsado ? 'w-20' : 'w-64'
    }`}>
      
      {/* BOTÓN COLAPSADOR */}
      <button 
        onClick={() => setColapsadoManual(!colapsadoManual)}
        className="hidden lg:flex absolute -right-3 top-7 z-30 w-6 h-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full items-center justify-center text-xs shadow-lg cursor-pointer border border-slate-800 active:scale-95"
      >
        {colapsado ? '▶' : '◀'}
      </button>

      {/* CABECERA */}
      <div className="p-4 md:p-6 border-b border-slate-900 flex items-center gap-3 shrink-0 overflow-hidden">
        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center font-black text-white shadow-md shrink-0 text-lg">
          S
        </div>
        {!colapsado && (
          <div className="flex flex-col shrink-0 animate-fade-in">
            <span className="font-black tracking-wider text-sm text-white leading-none">SABOR.IO</span>
            <span className="text-[10px] font-mono text-indigo-400 font-bold mt-0.5">POS V2.0</span>
          </div>
        )}
      </div>

      {/* NAVEGACIÓN */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-none">
        {menuPermitido.map((grupo, gIdx) => (
          <div key={grupo.seccion} className="space-y-1">
            
            {!colapsado && (
              <div className="px-3.5 pb-1 flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400/70">
                  {grupo.seccion}
                </span>
                <div className="flex-1 border-t border-slate-800/80"></div>
              </div>
            )}

            {colapsado && gIdx > 0 && (
              <div className="w-6 mx-auto border-t border-slate-800/80 my-2"></div>
            )}

            {grupo.items.map(item => {
              const activo = vistaActual === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setVistaActual(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-sans text-xs font-bold transition-all cursor-pointer group ${
                    activo 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                  title={item.nombre}
                >
                  <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">{item.icono}</span>
                  {!colapsado && (
                    <span className="truncate text-left leading-tight shrink-0">
                      {item.nombre}
                    </span>
                  )}
                </button>
              );
            })}

          </div>
        ))}
      </div>

      {/* PIE DE PÁGINA */}
      <div className={`p-3 border-t border-slate-900 bg-slate-950/90 flex gap-2 shrink-0 ${
        colapsado ? 'flex-col items-center' : 'flex-row items-center justify-between'
      }`}>
        
        <div 
          className={`flex items-center justify-center gap-2 rounded-xl border transition-all ${
            colapsado ? 'w-11 h-11 p-0' : 'flex-1 px-3 py-2.5'
          } ${
            socketConectado ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${socketConectado ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${socketConectado ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          {!colapsado && <span className="text-xs font-mono font-bold truncate">{socketConectado ? 'En línea' : 'Desconectado'}</span>}
        </div>

        <button
          onClick={onLogout}
          className={`flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95 shrink-0 ${
            colapsado ? 'w-11 h-11 p-0' : 'px-3.5 py-2.5'
          }`}
        >
          <span className="text-lg shrink-0 leading-none">🚪</span>
          {!colapsado && <span className="truncate">Salir</span>}
        </button>

      </div>

    </aside>
  );
}