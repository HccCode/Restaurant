import React, { useState, useMemo, useEffect } from 'react';

export default function PuntoDeVenta({ menu, reservaciones, comandas, setComandas, onCobrar, onEnviarCocina, notificacionesCocina, onDespacharPlato, usuario, config }) {
  const [mesaActivaId, setMesaActivaId] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Platos Fuertes');
  
  // Modales
  const [modalNota, setModalNota] = useState({ isOpen: false, index: -1, nombre: '', texto: '' });
  const [modalNotificacionesOpen, setModalNotificacionesOpen] = useState(false);
  const [ticketParaImprimir, setTicketParaImprimir] = useState(null);

  // Modal de Confirmación de Cobro Nativo
  const [modalCobro, setModalCobro] = useState({ isOpen: false, cargando: false, error: null });

  useEffect(() => {
    if (notificacionesCocina.length === 0) setModalNotificacionesOpen(false);
  }, [notificacionesCocina]);

  const gridCategorias = useMemo(() => {
    const cats = new Set(menu.map(p => p.categoria));
    const ordenadas = ['Platos Fuertes', 'Entradas', 'Bebidas', 'Postres'];
    const extras = Array.from(cats).filter(c => !ordenadas.includes(c));
    return [...ordenadas, ...extras];
  }, [menu]);

  const mesasEnCurso = useMemo(() => {
    return reservaciones.filter(r => r.estado === 'en-curso');
  }, [reservaciones]);

  const platillosFiltrados = categoriaActiva === 'Todas' 
    ? menu 
    : menu.filter(p => p.categoria === categoriaActiva);

  const cuentaActual = comandas[mesaActivaId] || [];
  const mesaActivaInfo = reservaciones.find(r => String(r.id) === String(mesaActivaId));

  const factorIVA = config?.iva ? (parseFloat(config.iva) / 100) : 0.16;
  const subtotal = cuentaActual.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);
  const iva = subtotal * factorIVA;
  const total = subtotal + iva;

  // =========================================================================
  // VALIDACIÓN DE CANDADOS OPERATIVOS PRIMARIOS
  // =========================================================================
  const tienePlatillosPendientesDeMarchar = useMemo(() => {
    return cuentaActual.some(item => item.cantidad > (item.enviado || 0));
  }, [cuentaActual]);

  const tienePlatillosListosSinEntregar = useMemo(() => {
    if (!mesaActivaInfo) return false;
    return notificacionesCocina.some(notif => String(notif.numMesa).trim() === String(mesaActivaInfo.numMesa).trim());
  }, [notificacionesCocina, mesaActivaInfo]);

  const puedeCobrarCuenta = mesaActivaId && cuentaActual.length > 0 && !tienePlatillosPendientesDeMarchar && !tienePlatillosListosSinEntregar;
  // =========================================================================

  const agregarPlatillo = (platillo) => {
    if (!mesaActivaId) return alert('Primero selecciona una de las mesas verdes en la barra superior.');
    
    setComandas(prev => {
      const cuenta = [...(prev[mesaActivaId] || [])];
      const index = cuenta.findIndex(p => p.id === platillo.id && !p.comentario);
      
      if (index >= 0) {
        cuenta[index] = { ...cuenta[index], cantidad: cuenta[index].cantidad + 1 };
      } else {
        cuenta.push({ ...platillo, cantidad: 1, enviado: 0, comentario: '' });
      }
      
      return { ...prev, [mesaActivaId]: cuenta };
    });
  };

  const modificarCantidad = (index, delta) => {
    setComandas(prev => {
      const cuenta = [...(prev[mesaActivaId] || [])];
      const itemAnterior = cuenta[index];
      
      let nuevaCantidad = itemAnterior.cantidad + delta;
      
      if (nuevaCantidad <= 0 && (itemAnterior.enviado || 0) === 0) {
        cuenta.splice(index, 1);
      } else {
        if (nuevaCantidad < (itemAnterior.enviado || 0)) nuevaCantidad = itemAnterior.enviado;
        cuenta[index] = { ...itemAnterior, cantidad: nuevaCantidad };
      }
      
      return { ...prev, [mesaActivaId]: cuenta };
    });
  };

  const abrirModalNota = (index, platillo) => setModalNota({ isOpen: true, index, nombre: platillo.nombre, texto: platillo.comentario || '' });

  const guardarNota = () => {
    setComandas(prev => {
      const cuenta = [...(prev[mesaActivaId] || [])];
      if (cuenta[modalNota.index]) {
        cuenta[modalNota.index] = { ...cuenta[modalNota.index], comentario: modalNota.texto };
      }
      return { ...prev, [mesaActivaId]: cuenta };
    });
    setModalNota({ isOpen: false, index: -1, nombre: '', texto: '' });
  };

  // =========================================================================
  // 🔥 MOTOR DE IMPRESIÓN FANTASMA EN LA MISMA PESTAÑA 🔥
  // =========================================================================
  const handleImprimirTicket = () => {
    if (!ticketParaImprimir) return;

    // 1. Creamos un Iframe invisible
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // 2. Le inyectamos el HTML del ticket
    const htmlContent = `
      <html>
        <head>
          <title>Ticket #${ticketParaImprimir.folio}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 260px; margin: 0; padding: 10px; color: #000; font-size: 11px; }
            .center { text-align: center; }
            .dash { border-top: 1px dashed #000; margin: 8px 0; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="title">${config?.nombre_negocio || 'Sabor.io Restaurante'}</div>
            <div>RFC: ${config?.rfc || 'XAXX010101000'}</div>
            <div>${config?.direccion || 'Av. De los Héroes 123'}</div>
            <div>Tel: ${config?.telefono || '686 555 1234'}</div>
          </div>
          <div class="dash"></div>
          <div><b>FOLIO:</b> ${ticketParaImprimir.folio}</div>
          <div><b>MESA:</b> ${ticketParaImprimir.mesaNum}</div>
          <div><b>MESERO:</b> ${ticketParaImprimir.mesero}</div>
          <div><b>CLIENTE:</b> ${ticketParaImprimir.cliente}</div>
          <div><b>FECHA:</b> ${ticketParaImprimir.fecha}</div>
          <div class="dash"></div>
          <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px dashed #000;">
                <th style="text-align: left; padding-bottom: 4px;">CANT</th>
                <th style="text-align: left; padding-bottom: 4px;">ITEM</th>
                <th style="text-align: right; padding-bottom: 4px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${ticketParaImprimir.platillos.map(p => `
                <tr>
                  <td style="padding: 2px 0;">${p.cantidad}x</td>
                  <td style="padding: 2px 0;">${p.nombre}</td>
                  <td style="text-align: right; padding: 2px 0;">$${(p.precio * p.cantidad).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="dash"></div>
          <div class="flex"><span>Subtotal:</span><span>$${ticketParaImprimir.subtotal.toFixed(2)}</span></div>
          <div class="flex"><span>I.V.A. (${config?.iva || 16}%):</span><span>$${ticketParaImprimir.iva.toFixed(2)}</span></div>
          <div class="flex bold" style="font-size: 12px; margin-top: 2px;"><span>TOTAL:</span><span>$${ticketParaImprimir.total.toFixed(2)}</span></div>
          <div class="dash"></div>
          <div class="center" style="margin-top: 12px; font-style: italic;">
            ${config?.mensaje_ticket || '¡Gracias por su preferencia!'}
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;
    doc.document.open();
    doc.document.write(htmlContent);
    doc.document.close();

    // 3. Imprimimos nativamente y luego matamos al iframe
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500); // Le damos tiempo a la ventana de impresión para que tome los datos
    }, 250);
  };
  // =========================================================================

  const solicitarConfirmacionCobro = async () => {
    if (!puedeCobrarCuenta || !mesaActivaInfo) return;

    setModalCobro({ isOpen: true, cargando: true, error: null });

    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/cocina`);
      const comandasCocina = await res.json();
      
      const mesaTarget = String(mesaActivaInfo.numMesa || '').trim().toLowerCase();
      const cocinaTrabajando = comandasCocina.some(p => String(p.numMesa || '').trim().toLowerCase() === mesaTarget);

      if (cocinaTrabajando) {
        setModalCobro({
          isOpen: true,
          cargando: false,
          error: `El chef todavía está preparando pedidos marchados en la cocina para la Mesa ${mesaActivaInfo.numMesa}. Es obligatorio esperar a que se terminen de cocinar.`
        });
        return;
      }

      setModalCobro({ isOpen: true, cargando: false, error: null });

    } catch (error) {
      setModalCobro({
        isOpen: true,
        cargando: false,
        error: 'Fallo crítico de comunicación de red. No se pudo verificar el estatus de la cocina.'
      });
    }
  };

  const procesarPagoMesa = async () => {
    setModalCobro(prev => ({ ...prev, cargando: true }));

    const payload = {
      mesero: usuario?.nombre || 'Mesero de Salón',
      platillos: cuentaActual,
      subtotal,
      iva,
      total,
      mesaNum: mesaActivaInfo.numMesa || 'Barra',
      cliente: mesaActivaInfo.nombre || 'Cliente General',
      personas: parseInt(mesaActivaInfo.personas) || 1
    };

    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/cobrar/${mesaActivaId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        try {
          await fetch(`http://${window.location.hostname}:3000/api/reservaciones/${mesaActivaId}`, { method: 'DELETE' });
        } catch (err) { console.error('No se pudo limpiar la reserva:', err); }

        setTicketParaImprimir({
          folio: data.folio,
          mesaNum: mesaActivaInfo.numMesa || 'Barra',
          mesero: usuario?.nombre || 'Mesero de Salón',
          cliente: mesaActivaInfo.nombre || 'General',
          platillos: [...cuentaActual],
          subtotal,
          iva,
          total,
          fecha: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
        });

        const idMesaLiberada = mesaActivaId;
        setMesaActivaId('');
        setModalCobro({ isOpen: false, cargando: false, error: null });
        if (onCobrar) onCobrar(idMesaLiberada);
      } else { 
        setModalCobro({ isOpen: true, cargando: false, error: data.error }); 
      }
    } catch (e) { 
      setModalCobro({ isOpen: true, cargando: false, error: `Error en red local: ${e.message}` }); 
    }
  };

  return (
    <div className="flex w-full h-full bg-[#070b16] font-sans select-none overflow-hidden relative">
      
      {/* MODAL INTERNO DE REVISIÓN Y CONFIRMACIÓN DE COBRO */}
      {modalCobro.isOpen && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col relative overflow-hidden">

            {modalCobro.cargando ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">Verificando comanda...</p>
              </div>
            ) : modalCobro.error ? (
              <>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600"></div>
                <div className="text-center mb-6">
                  <span className="text-5xl block mb-3">🛑</span>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider mb-2">Transacción Detenida</h2>
                  <p className="text-xs text-rose-300 font-medium leading-relaxed bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 text-left">
                    {modalCobro.error}
                  </p>
                </div>
                <button onClick={() => setModalCobro({ isOpen: false, cargando: false, error: null })} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-colors shadow-md">
                  Regresar al Salón
                </button>
              </>
            ) : (
              <>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <div className="text-center mb-5">
                  <span className="text-5xl block mb-2">💸</span>
                  <h2 className="text-xl font-black text-white tracking-tight mb-1">Cerrar Cuenta Actual</h2>
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                    Mesa {mesaActivaInfo?.numMesa || 'Barra'} • {mesaActivaInfo?.nombre || 'General'}
                  </p>
                </div>

                <div className="bg-[#050812] border border-slate-800 rounded-2xl p-5 mb-6 space-y-2.5">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Subtotal Consumido</span><span className="font-mono">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>I.V.A. Transaccional ({config?.iva || 16}%)</span><span className="font-mono">${iva.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-700 my-2 pt-3 flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto Liquidador</span>
                    <span className="text-3xl font-black text-emerald-400 font-mono tracking-tighter">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setModalCobro({ isOpen: false, cargando: false, error: null })} className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-colors">
                    Volver
                  </button>
                  <button onClick={procesarPagoMesa} className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20 cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-1.5">
                    <span>✔️</span> Liquidar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL: TICKET DE CONSUMO (VISTA PREVIA FISICA) */}
      {ticketParaImprimir && (
        <div className="fixed inset-0 z-[350] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col">
            <header className="mb-4 text-center">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center justify-center gap-2"><span>🖨️</span> Cuenta Sella con Folio</h3>
              <p className="text-xs text-slate-400 mt-1">Imprime el ticket físico para entregar al comensal.</p>
            </header>
            <div className="bg-white text-slate-950 p-4 rounded-xl font-mono text-[11px] space-y-1.5 border border-slate-200 shadow-inner select-text max-h-[45vh] overflow-y-auto">
              <div className="text-center font-sans space-y-0.5 mb-3">
                <p className="font-black text-xs uppercase text-slate-900 leading-none mb-1">{config?.nombre_negocio || 'Sabor.io Restaurante'}</p>
                <p className="text-[10px] text-slate-500">RFC: {config?.rfc || 'XAXX010101000'}</p>
                <p className="text-[10px] text-slate-500 truncate">{config?.direccion || 'Av. De los Héroes 123'}</p>
                <p className="text-[10px] text-slate-500">Tel: {config?.telefono || '686 555 1234'}</p>
              </div>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <p><strong>FOLIO:</strong> {ticketParaImprimir.folio}</p>
              <p><strong>MESA:</strong> {ticketParaImprimir.mesaNum}</p>
              <p><strong>CLIENTE:</strong> {ticketParaImprimir.cliente}</p>
              <p><strong>FECHA:</strong> {ticketParaImprimir.fecha}</p>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-dashed border-slate-300 font-bold">
                    <th className="pb-1">Cant</th><th className="pb-1">Item</th><th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketParaImprimir.platillos.map((p, i) => (
                    <tr key={i}><td className="py-0.5 font-bold text-slate-700">{p.cantidad}x</td><td className="py-0.5 truncate max-w-[120px]">{p.nombre}</td><td className="py-0.5 text-right font-bold">${(p.precio * p.cantidad).toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <div className="flex justify-between"><span>Subtotal:</span><span>${ticketParaImprimir.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>I.V.A. ({config?.iva || 16}%):</span><span>${ticketParaImprimir.iva.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-xs border-t border-slate-900 pt-1 mt-1"><span>TOTAL COBRADO:</span><span>${ticketParaImprimir.total.toFixed(2)}</span></div>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <p className="text-center font-sans italic text-[10px] text-slate-400 pt-1 leading-tight">{config?.mensaje_ticket || '¡Gracias por su preferencia!'}</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setTicketParaImprimir(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest text-[10px] cursor-pointer">Cerrar</button>
              <button onClick={handleImprimirTicket} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 cursor-pointer transition-transform active:scale-95">🖨️ Mandar a Ticketera</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CENTRAL DE NOTIFICACIONES DE COCINA */}
      {modalNotificacionesOpen && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans select-none">
          <div className="bg-[#0b1120] border border-emerald-900/50 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(16,185,129,0.15)] relative flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl">🛎️</span> Platos Listos</h2>
                <p className="text-xs text-slate-400 mt-1">Lleva estos platillos a su mesa y márcalos como entregados.</p>
              </div>
              <button onClick={() => setModalNotificacionesOpen(false)} className="text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors cursor-pointer shrink-0">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              {notificacionesCocina.map(notif => (
                <div key={notif.id} className="bg-[#050812] border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="bg-emerald-500/10 text-emerald-400 font-black px-2.5 py-1 rounded-md text-[10px] tracking-widest uppercase border border-emerald-500/20">Mesa {notif.numMesa}</span>
                      <span className="text-slate-500 text-[10px] ml-3 font-mono">Hora: {notif.horaCompletado}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-5 pl-2">
                    {notif.platillos.map((p, i) => (
                      <li key={i} className="text-sm font-bold text-slate-200 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span> 
                        <span><span className="font-mono text-emerald-400 mr-1.5">{p.cantidad}x</span>{p.nombre}{p.comentario && <span className="text-xs text-pink-400 font-normal ml-2 bg-pink-500/10 px-1.5 py-0.5 rounded">Nota: {p.comentario}</span>}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => onDespacharPlato(notif.id)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[10px] tracking-widest uppercase transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"><span>✔️ Marcar como Entregado al Cliente</span></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOTAS MAGENTA */}
      {modalNota.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#211725] border border-pink-500/40 rounded-[28px] p-6 max-w-sm w-full shadow-2xl relative text-white font-sans">
            <p className="text-sm font-medium text-pink-100 mb-3">Nota de preparación para {modalNota.nombre}:</p>
            <div className="p-0.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 mb-6 shadow-inner">
              <input type="text" autoFocus value={modalNota.texto} onChange={(e) => setModalNota({ ...modalNota, texto: e.target.value })} placeholder="Ej. sin cebolla..." className="w-full bg-[#150e18] text-pink-200 placeholder:text-pink-950 px-4 py-3 rounded-[14px] outline-none text-sm font-medium" />
            </div>
            <div className="flex justify-end gap-3 font-bold text-xs">
              <button onClick={() => setModalNota({ isOpen: false, index: -1, nombre: '', texto: '' })} className="px-6 py-2.5 bg-[#63224e] hover:bg-[#7a2a60] text-pink-200 rounded-full transition-colors cursor-pointer">Cancelar</button>
              <button onClick={guardarNota} className="px-6 py-2.5 bg-[#f472b6] hover:bg-[#fb7185] text-slate-950 font-black rounded-full shadow-lg shadow-pink-500/20 transition-transform active:scale-95 cursor-pointer">Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL IZQUIERDO */}
      <div className="flex-1 flex flex-col h-full p-6 md:p-8 overflow-hidden">
        <div className="flex flex-col gap-4 mb-6 shrink-0 w-full overflow-hidden">
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-none items-center flex-1">
              {mesasEnCurso.length === 0 ? (
                <div className="inline-flex items-center gap-2 bg-[#0b1120] text-slate-600 border border-slate-800/80 px-5 py-2.5 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-slate-700"></span><span>No hay mesas con pedidos en el salón</span>
                </div>
              ) : (
                mesasEnCurso.map(mesa => {
                  const estaSeleccionada = String(mesa.id) === String(mesaActivaId);
                  const textoMesa = `Mesa ${mesa.numMesa || '?'}${mesa.nombre ? ` (${mesa.nombre})` : ''}`;
                  return (
                    <button key={mesa.id} onClick={() => setMesaActivaId(mesa.id)} className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-black tracking-wide shrink-0 transition-all cursor-pointer ${estaSeleccionada ? 'bg-[#00d084] text-slate-950 shadow-[0_0_20px_rgba(0,208,132,0.35)] scale-105' : 'bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 border border-slate-800/80'}`}>
                      <span className={`w-2 h-2 rounded-full ${estaSeleccionada ? 'bg-slate-900' : 'bg-[#00d084]'}`}></span><span>{textoMesa}</span>
                    </button>
                  );
                })
              )}
            </div>

            {notificacionesCocina.length > 0 && (
              <div onClick={() => setModalNotificacionesOpen(true)} className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-2xl flex items-center gap-2 animate-pulse cursor-pointer shrink-0 hover:bg-emerald-500/20 transition-colors">
                <span className="text-lg">🛎️</span><span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{notificacionesCocina.length} Listos</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 shrink-0 scrollbar-none items-center border-t border-slate-800/60 pt-3">
            {gridCategorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaActiva(cat)} className={`px-5 py-2 rounded-[18px] text-xs tracking-wide transition-all cursor-pointer whitespace-nowrap ${categoriaActiva === cat ? 'bg-[#5a4bfa] text-white font-black shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white font-bold bg-transparent'}`}>{cat}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {platillosFiltrados.map(platillo => {
              const esUrl = platillo.imagen && platillo.imagen.startsWith('http');
              return (
                <button key={platillo.id} onClick={() => agregarPlatillo(platillo)} className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500/50 hover:bg-[#0f172a] transition-all group active:scale-95 min-h-[135px] relative overflow-hidden">
                  {esUrl ? <div className="w-14 h-14 rounded-xl overflow-hidden mb-2 shadow-md shrink-0 bg-slate-950"><img src={platillo.imagen} alt={platillo.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" /></div> : <div className="w-12 h-12 rounded-full bg-slate-900/80 flex items-center justify-center text-2xl mb-2 shrink-0 group-hover:scale-110 transition-transform">{platillo.imagen || '🍽️'}</div>}
                  <h3 className="text-xs font-black text-white leading-tight">{platillo.nombre}</h3>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 mt-1">${parseFloat(platillo.precio).toFixed(2)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PANEL DERECHO: TICKET */}
      <div className="w-full md:w-80 bg-[#0a0f1d] border-l border-slate-800/80 flex flex-col h-full shrink-0">
        <div className="p-5 border-b border-slate-800/80 shrink-0 bg-[#0a0f1d] flex flex-col gap-1.5">
          <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Comanda en curso</span>
          <h2 className="text-lg font-black text-white truncate">{mesaActivaInfo ? `Mesa ${mesaActivaInfo.numMesa || '?'} - ${mesaActivaInfo.nombre}` : 'Seleccione mesa arriba ☝️'}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-none">
          {!mesaActivaId ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 select-none opacity-40 text-center px-4"><span className="text-4xl mb-3">👆</span><p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Seleccione una mesa de la fila superior</p></div>
          ) : cuentaActual.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 select-none opacity-40"><span className="text-3xl mb-2">🍽️</span><p className="text-[10px] font-black uppercase tracking-widest">Mesa sin pedidos</p></div>
          ) : (
            cuentaActual.map((item, index) => {
              const enviado = item.enviado || 0;
              const pendiente = item.cantidad - enviado;
              return (
                <div key={index} className="bg-[#070b16] border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2"><h4 className="text-xs font-black text-white leading-tight">{item.nombre}</h4><p className="text-[9px] font-mono text-slate-400 mt-0.5">${parseFloat(item.precio).toFixed(2)} c/u</p></div>
                    <div className="text-right"><p className="text-xs font-black text-indigo-400 font-mono">${(item.precio * item.cantidad).toFixed(2)}</p></div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <div className="flex items-center bg-[#0d1322] rounded-lg border border-slate-700/60 overflow-hidden">
                      <button onClick={() => modificarCantidad(index, -1)} className="px-2.5 py-0.5 text-slate-400 hover:text-white hover:bg-slate-700 font-black text-xs cursor-pointer">-</button>
                      <span className="px-2 font-mono text-[11px] font-bold text-white min-w-[1.5rem] text-center">{item.cantidad}</span>
                      <button onClick={() => modificarCantidad(index, 1)} className="px-2.5 py-0.5 text-slate-400 hover:text-white hover:bg-slate-700 font-black text-xs cursor-pointer">+</button>
                    </div>
                    <button onClick={() => abrirModalNota(index, item)} className={`text-[10px] px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${item.comentario ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 font-mono' : 'bg-slate-800/80 text-slate-400 hover:text-white'}`}>{item.comentario ? '📝 Ver Nota' : '+ Nota'}</button>
                  </div>
                  {item.comentario && <div className="bg-pink-950/40 border border-pink-800/40 text-pink-300 text-[9px] p-1.5 rounded font-mono"><span className="text-[8px] font-bold uppercase text-pink-400 block">Nota:</span>{item.comentario}</div>}
                  {enviado > 0 && <div className="flex gap-1 mt-0.5"><span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1.5 py-0.2 rounded font-bold uppercase border border-emerald-500/20">{enviado} en cocina</span>{pendiente > 0 && <span className="bg-amber-500/10 text-amber-400 text-[8px] px-1.5 py-0.2 rounded font-bold uppercase border border-amber-500/20">{pendiente} por marchar</span>}</div>}
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-[#070b16] shrink-0">
          {mesaActivaId && (tienePlatillosPendientesDeMarchar || tienePlatillosListosSinEntregar) && (
            <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-xl text-center leading-tight animate-pulse">
              ⚠️ Bloqueo de Caja: {tienePlatillosPendientesDeMarchar ? 'Hay platillos sin marchar a cocina.' : 'Hay platillos listos en barra sin entregar.'}
            </div>
          )}
          <div className="space-y-1 mb-4 text-xs">
            <div className="flex justify-between text-slate-400 font-medium"><span>Subtotal</span><span className="font-mono">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-400 font-medium"><span>I.V.A. ({config?.iva || 16}%)</span><span className="font-mono">${iva.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800/80 mt-1"><span>TOTAL</span><span className="font-mono text-emerald-400">${total.toFixed(2)}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button disabled={!mesaActivaId || cuentaActual.length === 0} onClick={() => onEnviarCocina(mesaActivaInfo, cuentaActual)} className="py-2.5 bg-[#9a3412] hover:bg-[#c2410c] disabled:opacity-40 text-white font-black rounded-xl text-[10px] tracking-widest uppercase transition-all cursor-pointer shadow-md">🔥 MARCHAR</button>
            <button disabled={!puedeCobrarCuenta} onClick={solicitarConfirmacionCobro} className="py-2.5 bg-[#047857] hover:bg-[#059669] disabled:opacity-40 text-white font-black rounded-xl text-[10px] tracking-widest uppercase transition-all cursor-pointer shadow-md">💵 COBRAR</button>
          </div>
        </div>

      </div>
    </div>
  );
}