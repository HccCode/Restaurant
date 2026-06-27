import React, { useState, useEffect, useRef } from 'react';

export default function GestionMenu() {
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [arrastrandoIdx, setArrastrandoIdx] = useState(null);

  // Ref que mantiene la foto exacta de la base de datos visual en tiempo real
  const listaMaestraRef = useRef(productos);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState({ id: null, nombre: '', categoria: 'Platos Fuertes', precio: '', imagen: '', descripcion: '' });
  const [mensaje, setMensaje] = useState(null);

  const BASE_URL = `http://${window.location.hostname}:3000/api`;
  const categorias = ['Todas', 'Bebidas', 'Entradas', 'Platos Fuertes', 'Postres', 'Extras'];

  // Sincronizar siempre el Ref con el estado de React
  useEffect(() => {
    listaMaestraRef.current = productos;
  }, [productos]);

  const cargarCarta = async () => {
    try {
      const res = await fetch(`${BASE_URL}/menu`);
      if (res.ok) setProductos(await res.json());
    } catch (e) {
      console.log("Servidor SQL desconectado.");
    }
  };

  useEffect(() => { cargarCarta(); }, []);

  const mostrarNotificacion = (texto) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(null), 2500);
  };

  const productosFiltrados = productos.filter(p => categoriaActiva === 'Todas' || p.categoria === categoriaActiva);

  // =========================================================================
  // 🔥 MOTOR EDITORIAL: GENERADOR DE MENÚ DE CARTA CLÁSICO PARA EL SALÓN 🔥
  // =========================================================================
  const handleImprimirMenuCarta = async () => {
    if (!productos || productos.length === 0) return alert("El menú no tiene platillos registrados.");

    // 1. Jalamos los datos frescos de la configuración del restaurante
    let conf = { nombre_negocio: 'Sabor.io Restaurant', direccion: '', telefono: '', iva: 16 };
    try {
      const res = await fetch(`${BASE_URL}/configuracion`);
      if (res.ok) conf = await res.json();
    } catch (e) {}

    // 2. Definimos el orden gastronómico tradicional para las hojas impresas
    const ordenPrioridad = ['Entradas', 'Platos Fuertes', 'Bebidas', 'Postres', 'Extras'];
    const categoriasExistentes = [...new Set(productos.map(p => p.categoria))];
    
    const categoriasOrdenadas = [
      ...ordenPrioridad.filter(c => categoriasExistentes.includes(c)),
      ...categoriasExistentes.filter(c => !ordenPrioridad.includes(c))
    ];

    // 3. Maquetamos los platillos bloque por bloque en HTML puro
    let htmlPlatillos = '';

    categoriasOrdenadas.forEach(cat => {
      const platosCat = productos.filter(p => p.categoria === cat);
      if (platosCat.length === 0) return;

      htmlPlatillos += `
        <div class="category-block">
          <h2 class="cat-title">${cat}</h2>
          <div class="cat-items">
      `;

      platosCat.forEach(plato => {
        htmlPlatillos += `
          <div class="dish">
            <div class="dish-head">
              <span class="dish-name">${plato.nombre}</span>
              <span class="dish-price">$${parseFloat(plato.precio).toFixed(0)}</span>
            </div>
            ${plato.descripcion ? `<p class="dish-desc">${plato.descripcion}</p>` : ''}
          </div>
        `;
      });

      htmlPlatillos += `</div></div>`;
    });

    // 4. Abrimos e inyectamos estilos de imprenta tradicionales (Cinzel + Lato de Google Fonts)
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Menú de Carta - ${conf.nombre_negocio}</title>
          <meta charset="UTF-8">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Lato:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
          <style>
            @page {
              size: letter portrait;
              margin: 2.2cm 1.8cm;
            }
            body {
              background: #ffffff;
              color: #1c1917;
              font-family: 'Lato', sans-serif;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
            }
            header {
              text-align: center;
              margin-bottom: 45px;
            }
            .rest-name {
              font-family: 'Cinzel', serif;
              font-size: 32px;
              font-weight: 800;
              letter-spacing: 8px;
              text-transform: uppercase;
              margin: 0;
              color: #881337; /* Color Vino Editorial */
            }
            .rest-sub {
              font-size: 10px;
              letter-spacing: 4px;
              text-transform: uppercase;
              color: #78716c;
              margin-top: 8px;
            }
            .ornament {
              color: #881337;
              font-size: 12px;
              margin: 12px 0;
              letter-spacing: 10px;
            }
            .menu-columns {
              column-count: 2;
              column-gap: 55px;
            }
            .category-block {
              break-inside: avoid;
              page-break-inside: avoid;
              margin-bottom: 40px;
            }
            .cat-title {
              font-family: 'Cinzel', serif;
              font-size: 15px;
              font-weight: 800;
              color: #881337;
              text-align: center;
              text-transform: uppercase;
              letter-spacing: 3px;
              margin: 0 0 20px 0;
              padding-bottom: 6px;
              border-bottom: 1px solid #e7e5e4;
            }
            .dish {
              break-inside: avoid;
              page-break-inside: avoid;
              margin-bottom: 18px;
            }
            .dish-head {
              display: grid;
              grid-template-columns: 1fr auto;
              align-items: end;
              position: relative;
              overflow: hidden;
              margin-bottom: 3px;
            }
            .dish-head::after {
              content: " ........................................................................................................................................";
              position: absolute;
              left: 0;
              bottom: 3px;
              z-index: 1;
              color: #d6d3d1;
              letter-spacing: 2px;
              white-space: nowrap;
            }
            .dish-name {
              font-family: 'Cinzel', serif;
              font-weight: 600;
              font-size: 12.5px;
              background: #ffffff;
              padding-right: 6px;
              z-index: 2;
              width: fit-content;
              color: #1c1917;
            }
            .dish-price {
              font-weight: 700;
              font-size: 13px;
              background: #ffffff;
              padding-left: 6px;
              z-index: 2;
              color: #1c1917;
            }
            .dish-desc {
              margin: 0;
              font-size: 10.5px;
              color: #57534e;
              font-style: italic;
              line-height: 1.4;
              padding-right: 25px;
            }
            footer {
              text-align: center;
              margin-top: 60px;
              padding-top: 15px;
              border-top: 1px solid #e7e5e4;
              font-size: 9px;
              color: #a8a29e;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="menu-wrapper">
            <header>
              <h1 class="rest-name">${conf.nombre_negocio || 'Sabor.io'}</h1>
              <div class="ornament">◈ • ◈</div>
              <div class="rest-sub">${conf.direccion || 'Menú de Especialidades'}</div>
            </header>

            <div class="menu-columns">
              ${htmlPlatillos}
            </div>

            <footer>
              Precios en M.N. incluyen I.V.A. (${conf.iva || 16}%) • ${conf.telefono ? `Reservaciones: ${conf.telefono}` : 'Gracias por su preferencia'}
            </footer>
          </div>
        </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    
    // Retardo de medio segundo para que bajen las fuentes romanas antes del diálogo
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 500);
  };

  // =========================================================================
  // FÍSICAS DRAG & DROP (APARTADO DE TARJETAS EN TIEMPO REAL)
  // =========================================================================
  const iniciarArrastre = (e, index) => {
    setArrastrandoIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (e.target) e.target.classList.add('opacity-0'); }, 0);
  };

  const entrarEnZona = (e, indexDestino) => {
    e.preventDefault();
    if (arrastrandoIdx === null || arrastrandoIdx === indexDestino) return;

    const listaVista = [...productosFiltrados];
    const itemMovido = listaVista[arrastrandoIdx];
    
    listaVista.splice(arrastrandoIdx, 1);
    listaVista.splice(indexDestino, 0, itemMovido);

    let puntero = 0;
    const nuevaListaMaestra = productos.map(prod => {
      if (categoriaActiva === 'Todas' || prod.categoria === categoriaActiva) {
        const reemplazo = listaVista[puntero];
        puntero++;
        return reemplazo;
      }
      return prod;
    });

    setProductos(nuevaListaMaestra);
    setArrastrandoIdx(indexDestino);
  };

  // =========================================================================
  // PERSISTENCIA EN POSTGRES AL SOLTAR EL RATÓN
  // =========================================================================
  const finalizarSoltado = async (e) => {
    e.preventDefault();
    e.target.classList.remove('opacity-0');
    setArrastrandoIdx(null);

    // Mapeamos las nuevas coordenadas de toda la carta
    const paqueteDeOrden = listaMaestraRef.current.map((prod, index) => ({
      id: prod.id,
      orden: index
    }));

    try {
      const res = await fetch(`${BASE_URL}/menu/reordenar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: paqueteDeOrden })
      });

      if (res.ok) mostrarNotificacion('¡Orden guardado en base de datos! 💾');
    } catch (err) {
      console.error(err);
      alert("No se pudo contactar al servidor para fijar las posiciones.");
    }
  };

  // =========================================================================
  // ACCIONES CRUD
  // =========================================================================
  const guardarPlatillo = async (e) => {
    e.preventDefault();
    const esNuevo = !form.id;
    const url = esNuevo ? `${BASE_URL}/menu` : `${BASE_URL}/menu/${form.id}`;
    
    // Si es nuevo, lo mandamos directo al final de la cola
    const payload = esNuevo ? { ...form, orden: productos.length } : form;

    try {
      const res = await fetch(url, {
        method: esNuevo ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        cargarCarta();
        mostrarNotificacion(esNuevo ? '¡Plato añadido a la carta! 🍲' : '¡Receta modificada! ✍️');
        setModalAbierto(false);
      }
    } catch (err) { alert("Error de red al guardar"); }
  };

  const eliminarPlatillo = async (id, nombre) => {
    if (!window.confirm(`¿Retirar "${nombre}" de la carta impresa?`)) return;
    try {
      const res = await fetch(`${BASE_URL}/menu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProductos(productos.filter(p => p.id !== id));
        mostrarNotificacion('Platillo eliminado 🔥');
      }
    } catch (e) { alert("Error al eliminar"); }
  };

  const abrirModal = (prod = null) => {
    if (prod) setForm(prod);
    else setForm({ id: null, nombre: '', categoria: categoriaActiva === 'Todas' ? 'Platos Fuertes' : categoriaActiva, precio: '', imagen: '', descripcion: '' });
    setModalAbierto(true);
  };

  return (
    <div className="flex-1 w-full h-full bg-[#14110F] text-[#2D231E] p-4 md:p-6 font-sans select-none flex flex-col items-center justify-center overflow-hidden relative">
      
      {/* Estilos inyectados para la barra de desplazamiento color vino */}
      <style>{`
        .pergamino-scroll::-webkit-scrollbar { width: 8px; }
        .pergamino-scroll::-webkit-scrollbar-track { background: rgba(232, 223, 201, 0.5); border-radius: 8px; }
        .pergamino-scroll::-webkit-scrollbar-thumb { background: #881337; border-radius: 8px; }
        .pergamino-scroll::-webkit-scrollbar-thumb:hover { background: #5b0d25; }
      `}</style>

      {/* Toast Notificador Flotante */}
      {mensaje && (
        <div className="absolute top-4 z-50 bg-[#881337] text-[#FAF6EE] px-6 py-2.5 rounded-full shadow-2xl font-serif text-xs uppercase tracking-widest font-bold border border-[#FAF6EE]/20 flex items-center gap-2">
          <span>🔔</span> {mensaje}
        </div>
      )}

      {/* El Folleto Físico (Encuadernado) */}
      <div className="w-full max-w-5xl h-full max-h-[calc(100vh-50px)] bg-[#FAF6EE] rounded-2xl shadow-2xl border-[8px] border-[#E8DFC9] p-6 md:p-8 flex flex-col relative overflow-hidden">
        
        {/* Sombra de doblez de encuadernación central */}
        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-[3px] bg-gradient-to-b from-transparent via-[#D2C5AB] to-transparent pointer-events-none -translate-x-1/2 opacity-70" />

        {/* Cabecera Estática */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#D2C5AB]/60 pb-4 mb-6 gap-4 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#881337]/10 text-[#881337] text-[11px] font-serif font-bold uppercase tracking-widest mb-1">
              <span>🍷</span> Menú Editorial (SQL Sincronizado)
            </div>
            <h1 className="text-3xl font-serif font-black tracking-tight text-[#881337] uppercase leading-none">
              Sabor.io Restaurant
            </h1>
          </div>

          {/* 🔥 BOTONERA ACCIONES DUALES: IMPRESIÓN Y CREACIÓN 🔥 */}
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleImprimirMenuCarta}
              className="bg-transparent hover:bg-[#881337]/5 border border-[#881337] text-[#881337] font-serif font-bold text-xs uppercase tracking-widest px-4.5 py-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>📜</span> Imprimir Menú
            </button>

            <button
              onClick={() => abrirModal(null)}
              className="bg-[#881337] hover:bg-[#700f2b] active:scale-95 text-[#FAF6EE] font-serif font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>+</span> Crear Platillo
            </button>
          </div>
        </div>

        {/* Marcapáginas / Categorías */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-6 shrink-0 z-10">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-4 py-1.5 rounded-full font-serif text-xs uppercase tracking-wider transition-all cursor-pointer ${
                categoriaActiva === cat 
                  ? 'bg-[#881337] text-white font-bold shadow scale-105' 
                  : 'bg-[#E8DFC9]/50 hover:bg-[#D6C7AE] text-[#5C483F]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Zona con Scroll Interno para los Platillos */}
        <div className="flex-1 overflow-y-auto pergamino-scroll pr-2 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productosFiltrados.map((prod, index) => {
              const esArrastrado = arrastrandoIdx === index;

              return (
                <div
                  key={prod.id}
                  draggable
                  onDragStart={(e) => iniciarArrastre(e, index)}
                  onDragEnter={(e) => entrarEnZona(e, index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={finalizarSoltado}
                  className={`bg-white rounded-xl border-2 flex flex-col justify-between overflow-hidden relative group cursor-grab active:cursor-grabbing shadow-sm hover:shadow-xl transition-transform duration-200 ease-in-out ${
                    esArrastrado ? 'border-dashed border-[#881337] bg-[#fdfaf5]' : 'border-[#E4D9C5]'
                  }`}
                >
                  <div className="absolute top-2.5 right-2.5 z-20 bg-[#881337] text-[#FAF6EE] font-serif font-bold text-xs tracking-wider px-3 py-0.5 rounded-full shadow">
                    ${Number(prod.precio || 0).toFixed(2)}
                  </div>

                  <div className="h-36 w-full bg-[#E8DFC9] overflow-hidden relative">
                    {prod.imagen ? (
                      <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#A39178] font-serif italic text-xs pointer-events-none">
                        <span>🍲</span> Sin foto
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-start pointer-events-none">
                    <span className="text-[9px] font-serif uppercase tracking-widest text-[#881337] font-black block mb-0.5">
                      {prod.categoria}
                    </span>
                    <h3 className="font-serif font-bold text-base text-[#2D231E] leading-snug">
                      {prod.nombre}
                    </h3>
                    <p className="text-[11px] text-[#6E5D52] italic line-clamp-2 mt-1.5 leading-normal bg-[#FAF6EE]/60 p-1.5 rounded border border-[#E8DFC9]/30">
                      {prod.descripcion || 'Sin descripción...'}
                    </p>
                  </div>

                  <div className="bg-[#F6EFE5] px-4 py-2 border-t border-[#E4D9C5] flex justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={() => abrirModal(prod)}
                      className="flex-1 bg-white hover:bg-[#2D231E] hover:text-white text-[#2D231E] font-serif text-[11px] font-bold py-1.5 rounded border border-[#D2C5AB] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>✍️</span> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarPlatillo(prod.id, prod.nombre)}
                      className="w-7 h-7 bg-white hover:bg-rose-700 hover:text-white text-rose-700 rounded border border-rose-200 transition-colors flex items-center justify-center text-xs cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Pie de página estático del Menú */}
        <div className="pt-3 border-t border-[#D2C5AB]/40 flex justify-between items-center text-[#A39178] font-serif text-[11px] italic shrink-0">
          <span>Sabor.io POS • Cocina</span>
          <span>Sincronización automática a PostgreSQL activa</span>
        </div>

      </div>

      {/* --- MODAL DE CREACIÓN / EDICIÓN --- */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF6EE] border-4 border-[#E8DFC9] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-serif font-bold text-[#881337] uppercase border-b border-[#D2C5AB] pb-2 mb-4">
              {form.id ? '✏️ Modificar Receta' : '📜 Nuevo Platillo'}
            </h2>

            <form onSubmit={guardarPlatillo} className="space-y-3 text-xs font-serif text-[#5C483F] font-bold">
              <div>
                <label className="block uppercase mb-1">Nombre</label>
                <input type="text" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full bg-white border border-[#D2C5AB] rounded p-2 font-sans text-[#2D231E] outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase mb-1">Categoría</label>
                  <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="w-full bg-white border border-[#D2C5AB] rounded p-2 font-sans text-[#2D231E] outline-none">
                    {categorias.filter(c=>c!=='Todas').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block uppercase mb-1">Precio ($)</label>
                  <input type="number" step="0.01" required value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} className="w-full bg-white border border-[#D2C5AB] rounded p-2 font-mono text-[#881337] font-bold outline-none" />
                </div>
              </div>

              <div>
                <label className="block uppercase mb-1">URL de Imagen</label>
                <input type="url" value={form.imagen} onChange={e => setForm({...form, imagen: e.target.value})} className="w-full bg-white border border-[#D2C5AB] rounded p-2 font-sans font-normal text-[11px]" placeholder="https://..." />
              </div>

              <div>
                <label className="block uppercase mb-1">Descripción</label>
                <textarea rows="2" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full bg-white border border-[#D2C5AB] rounded p-2 font-sans font-normal outline-none" />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 bg-[#E8DFC9] text-[#2D231E] rounded font-sans font-bold cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#881337] text-white rounded font-sans font-bold uppercase cursor-pointer">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}