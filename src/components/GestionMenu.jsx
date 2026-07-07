import React, { useState, useEffect, useRef } from 'react';

export default function GestionMenu() {
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [arrastrandoIdx, setArrastrandoIdx] = useState(null);

  const listaMaestraRef = useRef(productos);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const [inventario, setInventario] = useState([]);
  
  const [ingSeleccionado, setIngSeleccionado] = useState('');
  const [cantidadIng, setCantidadIng] = useState('');

  // 🔥 NUEVO ESTADO PARA PESTAÑAS EN EL MODAL 🔥
  const [pestañaActiva, setPestañaActiva] = useState('basico'); // 'basico' | 'promo'

  const diasSemana = [
    { id: 1, label: 'Lun' }, { id: 2, label: 'Mar' }, { id: 3, label: 'Mié' },
    { id: 4, label: 'Jue' }, { id: 5, label: 'Vie' }, { id: 6, label: 'Sáb' }, { id: 0, label: 'Dom' }
  ];

  const [form, setForm] = useState({ 
    id: null, 
    nombre: '', 
    categoria: 'Platos Fuertes', 
    precio: '', 
    imagen: '', 
    descripcion: '',
    receta: [],
    // 🔥 ESTADO DE HAPPY HOUR 🔥
    promocion: { activo: false, dias: [], inicio: '00:00', fin: '23:59', precio_promo: '' }
  });

  const BASE_URL = `http://${window.location.hostname}:3000/api`;
  const categorias = ['Todas', 'Bebidas', 'Entradas', 'Platos Fuertes', 'Postres', 'Extras', 'Coctelería', 'Cervezas', 'Licores'];

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

  const cargarInventario = async () => {
    try {
      const res = await fetch(`${BASE_URL}/inventario`);
      if (res.ok) setInventario(await res.json());
    } catch (e) { console.error('Error cargando inventario:', e); }
  };

  useEffect(() => { 
    cargarCarta(); 
    cargarInventario();
  }, []);

  const mostrarNotificacion = (texto) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(null), 2500);
  };

  const productosFiltrados = productos.filter(p => categoriaActiva === 'Todas' || p.categoria === categoriaActiva);

  const handleImprimirMenuCarta = async () => {
    if (!productos || productos.length === 0) return alert("El menú no tiene platillos registrados.");

    let conf = { nombre_negocio: 'Sabor.io Restaurant', direccion: '', telefono: '', iva: 16 };
    try {
      const res = await fetch(`${BASE_URL}/configuracion`);
      if (res.ok) conf = await res.json();
    } catch (e) {}

    const ordenPrioridad = ['Entradas', 'Platos Fuertes', 'Bebidas', 'Postres', 'Extras'];
    const categoriasExistentes = [...new Set(productos.map(p => p.categoria))];
    
    const categoriasOrdenadas = [
      ...ordenPrioridad.filter(c => categoriasExistentes.includes(c)),
      ...categoriasExistentes.filter(c => !ordenPrioridad.includes(c))
    ];

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
              color: #881337; 
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
    
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 500);
  };

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

  const finalizarSoltado = async (e) => {
    e.preventDefault();
    e.target.classList.remove('opacity-0');
    setArrastrandoIdx(null);

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

  const agregarIngrediente = () => {
    if (!ingSeleccionado || !cantidadIng || parseFloat(cantidadIng) <= 0) return;
    
    const ingDB = inventario.find(i => String(i.id) === String(ingSeleccionado));
    if (!ingDB) return;

    if (form.receta.some(r => String(r.id_ingrediente) === String(ingSeleccionado))) {
      alert('Ese ingrediente ya está en la receta.');
      return;
    }

    setForm({
      ...form,
      receta: [...form.receta, {
        id_ingrediente: ingDB.id,
        nombre: ingDB.item,
        cantidad: parseFloat(cantidadIng),
        unidad: ingDB.unidad
      }]
    });

    setIngSeleccionado('');
    setCantidadIng('');
  };

  const quitarIngrediente = (idQuitar) => {
    setForm({
      ...form,
      receta: form.receta.filter(r => r.id_ingrediente !== idQuitar)
    });
  };

  // 🔥 EVENTO QUE MANEJA LOS DÍAS SELECCIONADOS DE LA PROMOCIÓN 🔥
  const toggleDiaPromo = (diaId) => {
    setForm(prev => {
      const diasActuales = prev.promocion.dias || [];
      const nuevosDias = diasActuales.includes(diaId) 
        ? diasActuales.filter(d => d !== diaId) 
        : [...diasActuales, diaId];
      return { ...prev, promocion: { ...prev.promocion, dias: nuevosDias } };
    });
  };

  // 🔥 GUARDAR INYECTANDO LA PROMOCIÓN 🔥
  const guardarPlatillo = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.precio) return alert("Nombre y precio son obligatorios.");

    const esNuevo = !form.id;
    const url = esNuevo ? `${BASE_URL}/menu` : `${BASE_URL}/menu/${form.id}`;
    
    const payload = {
      ...form,
      precio: parseFloat(form.precio) || 0,
      orden: esNuevo ? productos.length : form.orden,
      promocion: {
        ...form.promocion,
        precio_promo: parseFloat(form.promocion.precio_promo) || 0
      }
    };

    try {
      const res = await fetch(url, {
        method: esNuevo ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        cargarCarta();
        mostrarNotificacion(esNuevo ? '¡Plato añadido a la carta! 🍲' : '¡Plato modificado! ✍️');
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

  // 🔥 APERTURA DE MODAL INYECTANDO PROMOCIONES Y RESETEANDO PESTAÑA 🔥
  const abrirModal = (prod = null) => {
    if (prod) {
      let promoMapeada = { activo: false, dias: [], inicio: '00:00', fin: '23:59', precio_promo: '' };
      if (prod.promocion) {
        try { promoMapeada = typeof prod.promocion === 'string' ? JSON.parse(prod.promocion) : prod.promocion; } 
        catch (e) {}
      }

      setForm({
        ...prod,
        receta: typeof prod.receta === 'string' ? JSON.parse(prod.receta || '[]') : (prod.receta || []),
        promocion: promoMapeada
      });
    } else {
      setForm({ 
        id: null, nombre: '', categoria: categoriaActiva === 'Todas' ? 'Platos Fuertes' : categoriaActiva, 
        precio: '', imagen: '', descripcion: '', receta: [],
        promocion: { activo: false, dias: [], inicio: '00:00', fin: '23:59', precio_promo: '' }
      });
    }
    setIngSeleccionado('');
    setCantidadIng('');
    setPestañaActiva('basico');
    setModalAbierto(true);
  };

  return (
    <div className="flex-1 w-full h-full bg-[#14110F] text-[#2D231E] p-4 md:p-6 font-sans select-none flex flex-col items-center justify-center overflow-hidden relative">
      
      <style>{`
        .pergamino-scroll::-webkit-scrollbar { width: 8px; }
        .pergamino-scroll::-webkit-scrollbar-track { background: rgba(232, 223, 201, 0.5); border-radius: 8px; }
        .pergamino-scroll::-webkit-scrollbar-thumb { background: #881337; border-radius: 8px; }
        .pergamino-scroll::-webkit-scrollbar-thumb:hover { background: #5b0d25; }
      `}</style>

      {mensaje && (
        <div className="absolute top-4 z-50 bg-[#881337] text-[#FAF6EE] px-6 py-2.5 rounded-full shadow-2xl font-serif text-xs uppercase tracking-widest font-bold border border-[#FAF6EE]/20 flex items-center gap-2">
          <span>🔔</span> {mensaje}
        </div>
      )}

      <div className="w-full max-w-5xl h-full max-h-[calc(100vh-50px)] bg-[#FAF6EE] rounded-2xl shadow-2xl border-[8px] border-[#E8DFC9] p-6 md:p-8 flex flex-col relative overflow-hidden">
        
        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-[3px] bg-gradient-to-b from-transparent via-[#D2C5AB] to-transparent pointer-events-none -translate-x-1/2 opacity-70" />

        <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#D2C5AB]/60 pb-4 mb-6 gap-4 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#881337]/10 text-[#881337] text-[11px] font-serif font-bold uppercase tracking-widest mb-1">
              <span>🍷</span> Menú Editorial (SQL Sincronizado)
            </div>
            <h1 className="text-3xl font-serif font-black tracking-tight text-[#881337] uppercase leading-none">
              Sabor.io Restaurant
            </h1>
          </div>

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

        <div className="flex-1 overflow-y-auto pergamino-scroll pr-2 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productosFiltrados.map((prod, index) => {
              const esArrastrado = arrastrandoIdx === index;

              // Determinar visualmente si este platillo tiene promo
              let promoActivaIcon = false;
              try {
                const promo = typeof prod.promocion === 'string' ? JSON.parse(prod.promocion) : prod.promocion;
                promoActivaIcon = promo?.activo;
              } catch(e){}

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
                  {/* 🔥 BADGE DE PROMO EN EL EDITOR 🔥 */}
                  {promoActivaIcon && (
                    <div className="absolute top-0 right-0 z-30 bg-[#881337] text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg shadow-lg">⭐ HAPPY HOUR PROG.</div>
                  )}

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
                    
                    {/* ETIQUETA VISUAL DEL ESCANDALLO */}
                    {prod.receta && typeof prod.receta !== 'string' && prod.receta.length > 0 && (
                      <span className="mt-2 text-[9px] font-black tracking-widest uppercase text-[#5b0d25] bg-[#881337]/10 px-2 py-0.5 rounded border border-[#881337]/20 w-fit">
                        📦 {prod.receta.length} insumos
                      </span>
                    )}
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

        <div className="pt-3 border-t border-[#D2C5AB]/40 flex justify-between items-center text-[#A39178] font-serif text-[11px] italic shrink-0">
          <span>Sabor.io POS • Cocina</span>
          <span>Sincronización automática a PostgreSQL activa</span>
        </div>

      </div>

      {/* --- MODAL DOBLE DE EDICIÓN, ESCANDALLOS Y PROMOCIONES --- */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF6EE] border-4 border-[#E8DFC9] rounded-2xl max-w-4xl w-full flex flex-col shadow-2xl animate-fade-in max-h-[90vh]">
            
            <div className="p-5 border-b border-[#D2C5AB] flex justify-between items-center bg-[#E8DFC9]/30 shrink-0">
              <h2 className="text-lg font-serif font-black text-[#881337] uppercase">
                {form.id ? '✏️ Editor de Platillo' : '📜 Nuevo Platillo'}
              </h2>
              
              {/* 🔥 TABS (PESTAÑAS) 🔥 */}
              <div className="flex bg-[#E8DFC9]/50 rounded-lg p-1">
                <button onClick={() => setPestañaActiva('basico')} className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${pestañaActiva === 'basico' ? 'bg-[#881337] text-white shadow' : 'text-[#5C483F] hover:text-[#881337]'}`}>Receta / Básico</button>
                <button onClick={() => setPestañaActiva('promo')} className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 ${pestañaActiva === 'promo' ? 'bg-[#881337] text-white shadow' : 'text-[#5C483F] hover:text-[#881337]'}`}><span>⭐</span> Promo / Horarios</button>
              </div>

              <button onClick={() => setModalAbierto(false)} className="text-[#5C483F] hover:text-[#881337] font-black cursor-pointer text-xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pergamino-scroll">
              
              {pestañaActiva === 'basico' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in h-full">
                  {/* COLUMNA 1: DATOS COMERCIALES */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-serif font-black tracking-widest text-[#5b0d25] uppercase border-b border-[#D2C5AB] pb-2 mb-4">Detalles Comerciales</h3>
                    
                    <div>
                      <label className="block text-[10px] font-serif uppercase font-bold text-[#5C483F] mb-1">Nombre</label>
                      <input type="text" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full bg-white border border-[#D2C5AB] rounded-xl p-3 text-sm text-[#2D231E] outline-none focus:border-[#881337]" placeholder="Ej. Hamburguesa Doble" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-serif uppercase font-bold text-[#5C483F] mb-1">Categoría</label>
                        <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="w-full bg-white border border-[#D2C5AB] rounded-xl p-3 text-sm text-[#2D231E] outline-none focus:border-[#881337]">
                          {categorias.filter(c=>c!=='Todas').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-serif uppercase font-bold text-[#5C483F] mb-1">Precio Normal ($)</label>
                        <input type="number" step="0.01" required value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} className="w-full bg-white border border-[#D2C5AB] rounded-xl p-3 text-sm text-[#881337] font-mono font-bold outline-none focus:border-[#881337]" placeholder="0.00" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-serif uppercase font-bold text-[#5C483F] mb-1">URL de Imagen</label>
                      <input type="url" value={form.imagen} onChange={e => setForm({...form, imagen: e.target.value})} className="w-full bg-white border border-[#D2C5AB] rounded-xl p-3 text-sm text-[#2D231E] outline-none focus:border-[#881337]" placeholder="https://..." />
                    </div>

                    <div>
                      <label className="block text-[10px] font-serif uppercase font-bold text-[#5C483F] mb-1">Descripción</label>
                      <textarea rows="3" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full bg-white border border-[#D2C5AB] rounded-xl p-3 text-sm text-[#2D231E] outline-none focus:border-[#881337] resize-none" />
                    </div>
                  </div>

                  {/* COLUMNA 2: CONSTRUCTOR DE RECETAS (ESCANDALLOS) */}
                  <div className="bg-[#E8DFC9]/30 p-5 rounded-2xl border border-[#D2C5AB] flex flex-col h-full">
                    <h3 className="text-xs font-serif font-black tracking-widest text-[#5b0d25] uppercase border-b border-[#D2C5AB] pb-2 mb-4">Constructor de Receta (Almacén)</h3>
                    
                    <div className="flex gap-2 mb-4">
                      <select value={ingSeleccionado} onChange={e => setIngSeleccionado(e.target.value)} className="flex-1 bg-white border border-[#D2C5AB] rounded-xl p-2.5 text-xs text-[#2D231E] outline-none font-sans font-bold">
                        <option value="">-- Buscar Insumo --</option>
                        {inventario.map(inv => (
                          <option key={inv.id} value={inv.id}>{inv.item} ({inv.unidad})</option>
                        ))}
                      </select>
                      
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="Cant." 
                        value={cantidadIng} 
                        onChange={e => setCantidadIng(e.target.value)} 
                        className="w-20 bg-white border border-[#D2C5AB] rounded-xl p-2.5 text-xs text-center text-[#881337] font-mono font-bold outline-none" 
                      />
                      
                      <button type="button" onClick={agregarIngrediente} className="bg-[#5C483F] hover:bg-[#2D231E] text-white font-black px-4 rounded-xl text-xs cursor-pointer">+</button>
                    </div>

                    <div className="flex-1 bg-white border border-[#D2C5AB] rounded-xl p-3 overflow-y-auto min-h-[150px] pergamino-scroll">
                      {form.receta.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-[#A39178] text-center font-serif">
                          <span className="text-3xl mb-2">🍽️</span>
                          <p className="text-[10px] uppercase font-bold tracking-widest">Sin ingredientes</p>
                          <p className="text-[9px] mt-1 italic">Vender esto no descontará nada del almacén.</p>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {form.receta.map((r, i) => (
                            <li key={i} className="flex justify-between items-center bg-[#FAF6EE] border border-[#E8DFC9] p-2.5 rounded-lg">
                              <span className="text-xs font-bold text-[#2D231E] font-sans">
                                {r.nombre}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono font-black text-[#881337] bg-[#881337]/10 px-2 py-0.5 rounded border border-[#881337]/20">
                                  {r.cantidad} {r.unidad}
                                </span>
                                <button type="button" onClick={() => quitarIngrediente(r.id_ingrediente)} className="text-rose-500 hover:text-rose-700 font-bold text-xs cursor-pointer">✖</button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 🔥 PESTAÑA: HAPPY HOUR / PROMOCIONES 🔥 */}
              {pestañaActiva === 'promo' && (
                <div className="space-y-6 animate-fade-in w-full max-w-xl mx-auto h-full flex flex-col">
                  
                  <div className="bg-[#881337]/10 border border-[#881337]/30 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <h3 className="text-[#881337] font-black font-serif text-lg flex items-center gap-2"><span>⭐</span> Activar Happy Hour</h3>
                      <p className="text-[10px] text-[#5C483F] mt-1 uppercase tracking-widest font-bold">El precio cambiará automáticamente los días y horas indicados.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={form.promocion.activo} onChange={e => setForm({...form, promocion: {...form.promocion, activo: e.target.checked}})} />
                      <div className="w-14 h-7 bg-[#D2C5AB] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#881337]"></div>
                    </label>
                  </div>

                  {form.promocion.activo ? (
                    <div className="bg-white border border-[#D2C5AB] p-6 rounded-2xl space-y-6 flex-1 shadow-sm">
                      
                      <div>
                        <label className="text-[10px] font-black font-serif uppercase tracking-widest text-[#5C483F] mb-3 block text-center">Días de la semana aplicables</label>
                        <div className="flex justify-center gap-2 flex-wrap">
                          {diasSemana.map(dia => {
                            const activo = form.promocion.dias.includes(dia.id);
                            return (
                              <button 
                                key={dia.id} type="button" onClick={() => toggleDiaPromo(dia.id)}
                                className={`w-12 h-12 rounded-xl font-black text-xs transition-all shadow-sm font-sans ${activo ? 'bg-[#881337] text-white ring-2 ring-[#881337]/30 scale-110' : 'bg-[#FAF6EE] text-[#5C483F] border border-[#D2C5AB] hover:bg-[#E8DFC9]'}`}
                              >
                                {dia.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 bg-[#FAF6EE] p-4 rounded-xl border border-[#D2C5AB]">
                        <div>
                          <label className="text-[10px] font-black font-serif uppercase tracking-widest text-[#5C483F] mb-2 block">Hora de Inicio (24h)</label>
                          <input type="time" value={form.promocion.inicio} onChange={e => setForm({...form, promocion: {...form.promocion, inicio: e.target.value}})} className="w-full bg-white border border-[#D2C5AB] text-[#881337] font-black text-lg rounded-xl px-4 py-3 outline-none focus:border-[#881337] font-mono text-center shadow-inner" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black font-serif uppercase tracking-widest text-[#5C483F] mb-2 block">Hora de Fin (24h)</label>
                          <input type="time" value={form.promocion.fin} onChange={e => setForm({...form, promocion: {...form.promocion, fin: e.target.value}})} className="w-full bg-white border border-[#D2C5AB] text-[#881337] font-black text-lg rounded-xl px-4 py-3 outline-none focus:border-[#881337] font-mono text-center shadow-inner" />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="text-[10px] font-black font-serif uppercase tracking-widest text-[#881337] mb-2 block text-center">Nuevo Precio de Promoción ($)</label>
                        <div className="flex flex-col items-center gap-2">
                          <input type="number" value={form.promocion.precio_promo} onChange={e => setForm({...form, promocion: {...form.promocion, precio_promo: e.target.value}})} placeholder="Ej. 60.00" className="w-48 bg-[#881337]/5 border-2 border-[#881337]/50 text-[#881337] font-black text-3xl rounded-2xl px-4 py-3 outline-none focus:border-[#881337] font-mono text-center shadow-inner" />
                          <div className="text-xs text-[#5C483F] font-mono font-bold bg-white px-3 py-1 rounded-full border border-[#D2C5AB]">
                            Precio Normal: <span className="line-through text-[#881337]">${parseFloat(form.precio || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#A39178] opacity-60">
                      <span className="text-6xl mb-4">💤</span>
                      <p className="font-serif font-bold text-sm uppercase tracking-widest">Promoción Desactivada</p>
                      <p className="text-xs italic mt-1 text-center max-w-xs">Enciende el interruptor superior para configurar los horarios y el nuevo precio de este producto.</p>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="p-5 border-t border-[#D2C5AB] bg-[#E8DFC9]/30 flex justify-end gap-3 shrink-0">
              <button onClick={() => setModalAbierto(false)} className="px-6 py-3.5 bg-white border border-[#D2C5AB] hover:bg-[#E8DFC9] text-[#5C483F] font-serif font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-colors">
                Cancelar
              </button>
              <button onClick={guardarPlatillo} className="px-8 py-3.5 bg-[#881337] hover:bg-[#700f2b] text-white font-serif font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-[#881337]/30 cursor-pointer transition-transform active:scale-95">
                💾 Guardar Platillo
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}