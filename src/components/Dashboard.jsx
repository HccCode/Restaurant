import React, { useState, useEffect, useMemo } from 'react';
import HistorialCortes from './HistorialCortes';
import ModalCorteZ from './ModalCorteZ';

export default function Dashboard({ reservaciones, onIniciarCorteZ, usuario }) {
  // 🔥 NUEVA PESTAÑA AGREGADA: 'liquidacion' 🔥
  const [pestañaActiva, setPestañaActiva] = useState('en-vivo'); // 'en-vivo' | 'liquidacion' | 'cancelaciones' | 'historial'
  const [ventasTabla, setVentasTabla] = useState([]);
  
  const [cancelacionesTabla, setCancelacionesTabla] = useState([]);

  // Estados para el Buscador de Tickets
  const [filtroFolio, setFiltroFolio] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  // Control del modal de reimpresión interno
  const [modalReimpresion, setModalReimpresion] = useState({ isOpen: false, venta: null, config: null, platillos: [] });

  const [modalMovimientos, setModalMovimientos] = useState({ isOpen: false, tipo: 'salida', monto: '', concepto: '' });
  const tienePermisoCaja = ['Administrador', 'Admin', 'Gerente', 'Subgerente'].includes(usuario?.rol || 'Administrador');

  const cargarVentas = () => {
    const url = new URL(`http://${window.location.hostname}:3000/api/finanzas/historial-ventas`);
    if (filtroFolio) url.searchParams.append('folio', filtroFolio);
    if (filtroFecha) url.searchParams.append('fecha', filtroFecha);

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (!filtroFolio && !filtroFecha) {
          setVentasTabla(data.filter(v => v.corte_aplicado === false));
        } else {
          setVentasTabla(data);
        }
      })
      .catch(e => console.error('Error al leer de SQL:', e));

    fetch(`http://${window.location.hostname}:3000/api/cancelaciones`)
      .then(r => r.json())
      .then(data => setCancelacionesTabla(data))
      .catch(e => console.error(e));
  };

  useEffect(() => { cargarVentas(); }, [reservaciones]); 

  // KPIs calculados
  const traficoTotal = reservaciones.length;
  const sentados = reservaciones.filter(r => r.estado === 'en-curso').length;
  const enLobby = reservaciones.filter(r => r.estado === 'pendientes').length;
  
  const [liquidadasTurno, setLiquidadasTurno] = useState(0);
  const [ingresoParcial, setIngresoParcial] = useState(0);

  useEffect(() => {
    fetch(`http://${window.location.hostname}:3000/api/finanzas/historial-ventas`)
      .then(r => r.json())
      .then(data => {
        const delTurno = data.filter(v => v.corte_aplicado === false);
        setLiquidadasTurno(delTurno.length);
        setIngresoParcial(delTurno.reduce((acc, curr) => acc + parseFloat(curr.total || 0), 0));
      });
  }, [reservaciones]);

  const modoBusqueda = filtroFolio !== '' || filtroFecha !== '';

  // =========================================================================
  // 🔥 MOTOR MATEMÁTICO: LIQUIDACIÓN DE MESEROS 🔥
  // =========================================================================
  const liquidacionPorMesero = useMemo(() => {
    // Solo tomamos las ventas que NO han pasado por un Corte Z
    const ventasNoCortadas = ventasTabla.filter(v => v.corte_aplicado === false);
    
    const agrupado = ventasNoCortadas.reduce((acc, venta) => {
      const m = venta.mesero || 'Desconocido';
      if (!acc[m]) {
        acc[m] = { 
          mesero: m, mesas: 0, totalVendido: 0, 
          efectivo: 0, tarjeta: 0, propinaEfectivo: 0, propinaTarjeta: 0 
        };
      }
      acc[m].mesas += 1;
      acc[m].totalVendido += parseFloat(venta.total || 0);
      acc[m].efectivo += parseFloat(venta.pago_efectivo || 0);
      acc[m].tarjeta += parseFloat(venta.pago_tarjeta || 0);
      acc[m].propinaEfectivo += parseFloat(venta.propina_efectivo || 0);
      acc[m].propinaTarjeta += parseFloat(venta.propina_tarjeta || 0);
      return acc;
    }, {});

    return Object.values(agrupado).sort((a, b) => b.totalVendido - a.totalVendido);
  }, [ventasTabla]);

  const imprimirLiquidacionMesero = async (liq) => {
    let config = { nombre_negocio: 'Sabor.io Restaurante', rfc: 'XAXX010101000', direccion: '', telefono: '', iva: 16 };
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/configuracion`);
      if (res.ok) config = await res.json();
    } catch (e) {}

    const balanceCaja = liq.efectivo - liq.propinaTarjeta;
    let textoBalance = "";
    if (balanceCaja > 0) {
      textoBalance = `<div style="font-size:12px; font-weight:bold; margin-top:8px; border:2px solid #000; padding:4px;">A ENTREGAR A CAJA: $${balanceCaja.toFixed(2)}</div>`;
    } else if (balanceCaja < 0) {
      textoBalance = `<div style="font-size:12px; font-weight:bold; margin-top:8px; border:2px solid #000; padding:4px;">CAJA LE DEBE PAGAR: $${Math.abs(balanceCaja).toFixed(2)}</div>`;
    } else {
      textoBalance = `<div style="font-size:12px; font-weight:bold; margin-top:8px; border:2px dashed #000; padding:4px;">CUENTAS EN CEROS: $0.00</div>`;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const fechaHoy = new Date().toLocaleString('es-MX', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric' });

    const htmlContent = `
      <html>
        <head>
          <title>Liquidación - ${liq.mesero}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 260px; margin: 0; padding: 10px; color: #000; font-size: 11px; }
            .center { text-align: center; }
            .dash { border-top: 1px dashed #000; margin: 8px 0; }
            .flex { display: flex; justify-content: space-between; }
            .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="title">${config.nombre_negocio}</div>
            <div>LIQUIDACIÓN INDIVIDUAL</div>
            <div><b>MESERO:</b> ${liq.mesero}</div>
            <div>${fechaHoy}</div>
          </div>
          <div class="dash"></div>
          <div class="flex"><span>Mesas Atendidas:</span><span>${liq.mesas}</span></div>
          <div class="flex"><span>Venta Bruta Generada:</span><span>$${liq.totalVendido.toFixed(2)}</span></div>
          <div class="dash"></div>
          <div class="center" style="font-weight:bold; margin-bottom:4px;">DESGLOSE DE COBROS</div>
          <div class="flex"><span>Efectivo Recibido:</span><span>$${liq.efectivo.toFixed(2)}</span></div>
          <div class="flex"><span>Tarjetas Cobradas:</span><span>$${liq.tarjeta.toFixed(2)}</span></div>
          <div class="dash"></div>
          <div class="center" style="font-weight:bold; margin-bottom:4px;">PROPINAS</div>
          <div class="flex"><span>En Efectivo (Ya en mano):</span><span>$${liq.propinaEfectivo.toFixed(2)}</span></div>
          <div class="flex"><span>En Tarjeta (Retenidas):</span><span>$${liq.propinaTarjeta.toFixed(2)}</span></div>
          <div class="dash"></div>
          <div class="center" style="margin-top:4px;">
            <div>Fórmula: Efectivo - Propina Tarj.</div>
            ${textoBalance}
          </div>
          <div class="dash"></div>
          <div class="center" style="margin-top: 20px;">
            ___________________________<br>
            Firma de Conformidad
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;
    doc.document.open();
    doc.document.write(htmlContent);
    doc.document.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 500); 
    }, 250);
  };
  // =========================================================================

  const handleGuardarMovimiento = async () => {
    if (!modalMovimientos.monto || !modalMovimientos.concepto) {
      return alert("Por favor llena el monto y el concepto del movimiento.");
    }
    
    try {
      await fetch(`http://${window.location.hostname}:3000/api/movimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: modalMovimientos.tipo,
          monto: modalMovimientos.monto,
          concepto: modalMovimientos.concepto,
          usuario: usuario?.nombre || 'Administrador'
        })
      });
      setModalMovimientos({ isOpen: false, tipo: 'salida', monto: '', concepto: '' });
      alert(`Movimiento de ${modalMovimientos.tipo.toUpperCase()} registrado con éxito. Se incluirá en el próximo Corte Z.`);
    } catch(e) {
      alert("Error de red al guardar el movimiento en caja.");
    }
  };

  const handlePrepararReimpresion = async (venta) => {
    let config = { nombre_negocio: 'Sabor.io Restaurante', rfc: 'XAXX010101000', direccion: 'Av. De los Héroes 123', telefono: '686 555 1234', iva: 16, mensaje_ticket: '¡Gracias por su preferencia!' };
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/configuracion`);
      if (res.ok) config = await res.json();
    } catch (e) {}

    let platillos = [];
    try {
      platillos = Array.isArray(venta.items_consumidos) ? venta.items_consumidos : JSON.parse(venta.items_consumidos || '[]');
    } catch (e) {
      console.error("Error parseando platillos", e);
    }

    setModalReimpresion({ isOpen: true, venta, config, platillos });
  };

  const ejecutarImpresionFisica = () => {
    const { venta, config, platillos } = modalReimpresion;
    if (!venta) return;

    const pagoEfectivo = parseFloat(venta.pago_efectivo || 0);
    const pagoTarjeta = parseFloat(venta.pago_tarjeta || 0);
    const propEfectivo = parseFloat(venta.propina_efectivo || 0);
    const propTarjeta = parseFloat(venta.propina_tarjeta || 0);
    const totalEfectivo = pagoEfectivo + propEfectivo;
    const totalTarjeta = pagoTarjeta + propTarjeta;
    const tienePropina = propEfectivo > 0 || propTarjeta > 0;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Reimpresión Ticket #${venta.folio}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 260px; margin: 0; padding: 10px; color: #000; font-size: 11px; }
            .center { text-align: center; }
            .dash { border-top: 1px dashed #000; margin: 8px 0; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
            .watermark { font-size: 12px; font-weight: bold; text-align: center; margin-bottom: 12px; border: 2px solid #000; padding: 4px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="watermark">*** COPIA DE REIMPRESIÓN ***</div>
          <div class="center">
            <div class="title">${config.nombre_negocio}</div>
            <div>RFC: ${config.rfc}</div>
            <div>${config.direccion}</div>
            <div>Tel: ${config.telefono}</div>
          </div>
          <div class="dash"></div>
          <div><b>FOLIO:</b> ${venta.folio}</div>
          <div><b>MESA:</b> ${venta.num_mesa}</div>
          <div><b>MESERO:</b> ${venta.mesero}</div>
          <div><b>FECHA:</b> ${venta.hora_cobro || 'Registro Histórico'}</div>
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
              ${platillos.map(p => `
                <tr>
                  <td style="padding: 2px 0; vertical-align: top;">${p.cantidad}x</td>
                  <td style="padding: 2px 0;">
                    ${p.nombre}
                    ${p.modificadores && p.modificadores.length > 0 ? `<div style="font-size:9px; color:#555; padding-left: 4px;">${p.modificadores.map(m => `+ ${m.nombre}`).join('<br>')}</div>` : ''}
                  </td>
                  <td style="text-align: right; padding: 2px 0; vertical-align: top;">$${(parseFloat(p.precio) * parseInt(p.cantidad)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="dash"></div>
          <div class="flex"><span>Subtotal:</span><span>$${parseFloat(venta.subtotal).toFixed(2)}</span></div>
          ${venta.descuento > 0 ? `<div class="flex bold" style="color: #dc2626;"><span>Descuento / Cortesía:</span><span>-$${parseFloat(venta.descuento).toFixed(2)}</span></div>` : ''}
          <div class="flex"><span>I.V.A. (${config.iva}%):</span><span>$${parseFloat(venta.iva).toFixed(2)}</span></div>
          ${tienePropina ? `<div class="flex"><span>Propina Sugerida:</span><span>$${(propEfectivo + propTarjeta).toFixed(2)}</span></div>` : ''}
          <div class="flex bold" style="font-size: 12px; margin-top: 4px; padding-top: 4px; border-top: 1px solid #000;">
            <span>TOTAL PAGADO:</span><span>$${parseFloat(venta.total).toFixed(2)}</span>
          </div>

          <div class="dash"></div>
          <div class="center bold" style="font-size: 10px; margin-bottom: 2px;">MÉTODO DE PAGO</div>
          ${totalEfectivo > 0 ? `<div class="flex" style="font-size: 10px;"><span>💵 Efectivo:</span><span>$${totalEfectivo.toFixed(2)}</span></div>` : ''}
          ${totalTarjeta > 0 ? `<div class="flex" style="font-size: 10px;"><span>💳 Tarjeta:</span><span>$${totalTarjeta.toFixed(2)}</span></div>` : ''}

          <div class="dash"></div>
          <div class="center" style="margin-top: 12px; font-style: italic;">
            ${config.mensaje_ticket}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#070b16] text-slate-200 select-none font-sans relative">
      
      {/* MODAL DE CAJA (ENTRADAS Y SALIDAS) */}
      {modalMovimientos.isOpen && (
        <div className="fixed inset-0 z-[600] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0b1120] border border-slate-700 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col relative overflow-hidden">
            <header className="mb-5 text-center">
              <span className="text-4xl block mb-2">💵</span>
              <h2 className="text-xl font-black text-white tracking-tight">Movimiento de Caja</h2>
              <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest">Registra ingresos o retiros para el Corte Z</p>
            </header>

            <div className="flex bg-[#050812] rounded-xl border border-slate-800 p-1 mb-5">
              <button onClick={() => setModalMovimientos({...modalMovimientos, tipo: 'salida'})} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${modalMovimientos.tipo === 'salida' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Salida (Retiro)</button>
              <button onClick={() => setModalMovimientos({...modalMovimientos, tipo: 'entrada'})} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${modalMovimientos.tipo === 'entrada' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Entrada (Fondo)</button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Monto ($)</label>
                <input type="number" value={modalMovimientos.monto} onChange={e => setModalMovimientos({...modalMovimientos, monto: e.target.value})} placeholder="0.00" className="w-full bg-[#050812] border border-slate-700 text-white text-lg rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-mono text-center" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Concepto / Motivo</label>
                <input type="text" value={modalMovimientos.concepto} onChange={e => setModalMovimientos({...modalMovimientos, concepto: e.target.value})} placeholder="Ej. Pago de garrafones, Fondo inicial..." className="w-full bg-[#050812] border border-slate-700 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-sans" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalMovimientos({ isOpen: false, tipo: 'salida', monto: '', concepto: '' })} className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-colors">Cancelar</button>
              <button onClick={handleGuardarMovimiento} className={`flex-1 font-black rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-all shadow-lg text-white ${modalMovimientos.tipo === 'salida' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'}`}>Registrar {modalMovimientos.tipo}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INTERNO DE REIMPRESIÓN */}
      {modalReimpresion.isOpen && (
        <div className="fixed inset-0 z-[350] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col">
            <header className="mb-4 text-center">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
                <span>🖨️</span> Vista Previa de Auditoría
              </h3>
              <p className="text-xs text-slate-400 mt-1">Copia fiel del archivo digital en base de datos.</p>
            </header>

            <div className="bg-white text-slate-950 p-4 rounded-xl font-mono text-[11px] space-y-1.5 border border-slate-200 shadow-inner max-h-[45vh] overflow-y-auto select-text">
              <div className="text-center font-sans space-y-0.5 mb-3">
                <p className="text-[10px] font-black border border-slate-950 px-2 py-0.5 rounded tracking-wide mb-2 inline-block">*** REIMPRESIÓN ***</p>
                <p className="font-black text-xs uppercase text-slate-900 leading-none mb-1">{modalReimpresion.config?.nombre_negocio}</p>
                <p className="text-[10px] text-slate-500">RFC: {modalReimpresion.config?.rfc}</p>
                <p className="text-[10px] text-slate-500 truncate">{modalReimpresion.config?.direccion}</p>
                <p className="text-[10px] text-slate-500">Tel: {modalReimpresion.config?.telefono}</p>
              </div>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <p><strong>FOLIO:</strong> {modalReimpresion.venta?.folio}</p>
              <p><strong>MESA:</strong> {modalReimpresion.venta?.num_mesa}</p>
              <p><strong>ATENDIÓ:</strong> {modalReimpresion.venta?.mesero}</p>
              <p><strong>FECHA:</strong> {modalReimpresion.venta?.hora_cobro || 'Histórica'}</p>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-dashed border-slate-300 font-bold">
                    <th className="pb-1">Cant</th><th className="pb-1">Item</th><th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {modalReimpresion.platillos.map((p, i) => (
                    <tr key={i}>
                      <td className="py-0.5 font-bold text-slate-700 vertical-align: top;">{p.cantidad}x</td>
                      <td className="py-0.5">
                        {p.nombre}
                        {p.modificadores && p.modificadores.length > 0 ? 
                          `<div style="font-size:9px; color:#555; padding-left: 4px;">
                            ${p.modificadores.map(m => `+ ${m.nombre}`).join('<br>')}
                          </div>` : ''}
                      </td>
                      <td className="py-0.5 text-right font-bold vertical-align: top;">${(parseFloat(p.precio) * parseInt(p.cantidad)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <div className="flex justify-between"><span>Subtotal:</span><span>${parseFloat(modalReimpresion.venta?.subtotal || 0).toFixed(2)}</span></div>
              {modalReimpresion.venta?.descuento > 0 && <div className="flex justify-between text-rose-600 font-bold"><span>Descuento / Cortesía:</span><span>-${parseFloat(modalReimpresion.venta?.descuento).toFixed(2)}</span></div>}
              <div className="flex justify-between"><span>I.V.A. ({modalReimpresion.config?.iva}%):</span><span>${parseFloat(modalReimpresion.venta?.iva || 0).toFixed(2)}</span></div>
              
              {(parseFloat(modalReimpresion.venta?.propina_efectivo || 0) + parseFloat(modalReimpresion.venta?.propina_tarjeta || 0)) > 0 && (
                <div className="flex justify-between"><span>Propina:</span><span>${(parseFloat(modalReimpresion.venta?.propina_efectivo || 0) + parseFloat(modalReimpresion.venta?.propina_tarjeta || 0)).toFixed(2)}</span></div>
              )}

              <div className="flex justify-between font-bold text-xs border-t border-slate-900 pt-1 mt-1"><span>TOTAL RECIBIDO:</span><span>${parseFloat(modalReimpresion.venta?.total || 0).toFixed(2)}</span></div>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <p className="text-center font-sans italic text-[10px] text-slate-400 pt-1 leading-tight">{modalReimpresion.config?.mensaje_ticket}</p>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setModalReimpresion({ isOpen: false, venta: null, config: null, platillos: [] })} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest text-[10px] cursor-pointer">Volver</button>
              <button onClick={ejecutarImpresionFisica} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 cursor-pointer transition-all active:scale-95">🖨️ Mandar a Ticketera</button>
            </div>
          </div>
        </div>
      )}

      {/* CABECERA MAESTRA CON PESTAÑAS */}
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Finanzas y Auditoría</h1>
          <p className="text-xs text-slate-400 mt-1">Indicadores de rendimiento, tickets liquidados y cortes fiscales.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {tienePermisoCaja && (
            <button 
              onClick={() => setModalMovimientos({...modalMovimientos, isOpen: true})} 
              className="px-5 py-2.5 bg-[#0b1120] border border-slate-700 hover:bg-slate-800 text-emerald-400 font-black rounded-xl text-[10px] uppercase tracking-widest transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="text-sm">💵</span> Movimientos de Caja
            </button>
          )}

          <div className="flex bg-[#0b1120] p-1.5 rounded-2xl border border-slate-800 shrink-0 shadow-lg overflow-x-auto scrollbar-none">
            <button onClick={() => setPestañaActiva('en-vivo')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap ${pestañaActiva === 'en-vivo' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              📊 Turno
            </button>
            <button onClick={() => setPestañaActiva('liquidacion')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap ${pestañaActiva === 'liquidacion' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              👥 Liquidación
            </button>
            <button onClick={() => setPestañaActiva('cancelaciones')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap ${pestañaActiva === 'cancelaciones' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              🚫 Canceladas
            </button>
            <button onClick={() => setPestañaActiva('historial')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap ${pestañaActiva === 'historial' ? 'bg-[#5a4bfa] text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              📑 Cortes Z
            </button>
          </div>
        </div>
      </header>

      {pestañaActiva === 'en-vivo' && (
        <div className="animate-fade-in">
          {/* 4 TARJETAS OPERATIVAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Tráfico Total</span>
              <p className="text-3xl font-black text-white flex items-baseline gap-2"><span>{traficoTotal}</span> <span className="text-xs font-semibold text-slate-400 lowercase">mesas registradas</span></p>
            </div>
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-2">Comensales Sentados</span>
              <p className="text-3xl font-black text-emerald-400 flex items-baseline gap-2"><span>{sentados}</span> <span className="text-xs font-semibold text-slate-400 lowercase">mesas activas</span></p>
            </div>
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-2">Cuentas Liquidadas</span>
              <p className="text-3xl font-black text-indigo-400 flex items-baseline gap-2"><span>{liquidadasTurno}</span> <span className="text-xs font-semibold text-slate-400 lowercase">listas para archivar</span></p>
            </div>
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-2">Espera en Lobby</span>
              <p className="text-3xl font-black text-amber-400 flex items-baseline gap-2"><span>{enLobby}</span> <span className="text-xs font-semibold text-slate-400 lowercase">sin sentar</span></p>
            </div>
          </div>

          <div className="bg-[#0b1120] border border-rose-950 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden mb-8">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-600"></div>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-2xl shrink-0 font-bold">🔒</div>
              <div>
                <h2 className="text-lg font-black text-white tracking-wide mb-1">Cierre de Caja y Fiscal: Corte Z</h2>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Al ejecutar esta acción, el sistema consolidará todas las ventas, desglosará el IVA y sumará o restará los movimientos de caja registrados. <strong className="text-rose-400 font-bold">Advertencia:</strong> Esto limpiará el flujo del salón.
                </p>
              </div>
            </div>
            <button onClick={onIniciarCorteZ} className="px-8 py-4 bg-[#f43f5e] hover:bg-[#e11d48] text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap">
              Iniciar Cierre de Turno
            </button>
          </div>

          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end mb-6 pb-6 border-b border-slate-800/80 gap-6">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-3">
                  <span className="text-xl">🧾</span>
                  <span>{modoBusqueda ? 'Resultados Históricos' : 'Cuentas Cobradas en este Turno'}</span>
                  <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[8px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-500/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    GUARDADO EN BD
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {modoBusqueda ? 'Mostrando recibos de días anteriores.' : 'Estas ventas ya están seguras en la base de datos, pendientes de empaquetar en el Corte Z.'}
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-3 bg-[#050812] p-2.5 rounded-xl border border-slate-800 shadow-inner">
                <div>
                  <input type="text" value={filtroFolio} onChange={e => setFiltroFolio(e.target.value)} placeholder="Folio V-..." className="bg-[#0b1120] border border-slate-700 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 font-mono w-28 uppercase" title="Buscar por Folio" />
                </div>
                <div>
                  <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="bg-[#0b1120] border border-slate-700 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer [color-scheme:dark]" title="Buscar por Fecha" />
                </div>
                <button onClick={cargarVentas} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors h-[30px] cursor-pointer">Buscar</button>
                {modoBusqueda && (
                  <button onClick={() => { setFiltroFolio(''); setFiltroFecha(''); setTimeout(cargarVentas, 50); }} className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors h-[30px] cursor-pointer border border-rose-500/20">Limpiar</button>
                )}
              </div>

              {!modoBusqueda && (
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans tracking-widest font-bold">Ingreso Parcial</span>
                  <span className="text-xl font-black text-emerald-400">${ingresoParcial.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="pb-3 pl-2">Folio de Venta</th>
                    <th className="pb-3">Mesa / Ubicación</th>
                    <th className="pb-3">Atendió</th>
                    {modoBusqueda && <th className="pb-3">Fecha y Hora</th>}
                    <th className="pb-3 text-right">Subtotal</th>
                    <th className="pb-3 text-right">IVA (16%)</th>
                    <th className="pb-3 text-right">Total Pagado</th>
                    <th className="pb-3 text-center pr-2">Reimpresión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-medium text-slate-300">
                  {ventasTabla.map(v => (
                    <tr key={v.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 pl-2 font-mono font-bold text-indigo-400">{v.folio}</td>
                      <td className="py-3">
                        <span className="bg-slate-800 text-white font-bold px-2 py-0.5 rounded text-[11px]">{v.num_mesa}</span>
                        {v.corte_aplicado && <span className="ml-2 text-[8px] font-bold text-amber-500/80 border border-amber-500/30 px-1 rounded uppercase tracking-wider bg-amber-500/5">Z-Aplicado</span>}
                      </td>
                      <td className="py-3 text-slate-400">{v.mesero}</td>
                      {modoBusqueda && <td className="py-3 text-slate-500 font-mono text-[10px]">{v.hora_cobro}</td>}
                      <td className="py-3 text-right font-mono">${parseFloat(v.subtotal || 0).toFixed(2)}</td>
                      <td className="py-3 text-right font-mono text-slate-400">${parseFloat(v.iva || 0).toFixed(2)}</td>
                      <td className="py-3 text-right font-mono font-black text-emerald-400">${parseFloat(v.total || 0).toFixed(2)}</td>
                      <td className="py-3 text-center pr-2">
                        <button onClick={() => handlePrepararReimpresion(v)} className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 p-1.5 rounded-lg transition-colors cursor-pointer shadow-sm active:scale-90" title="Visualizar y Reimprimir">
                          🖨️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 NUEVA PESTAÑA: LIQUIDACIÓN DE MESEROS 🔥 */}
      {pestañaActiva === 'liquidacion' && (
        <div className="animate-fade-in bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[500px]">
          <div className="mb-6 pb-6 border-b border-slate-800/80">
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-3">
              <span className="text-xl">👥</span> Liquidación Individual de Meseros
            </h3>
            <p className="text-xs text-slate-400 mt-1">Cálculo automático de propinas retenidas y efectivo a entregar a caja por cada mesero activo en este turno.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {liquidacionPorMesero.length === 0 ? (
              <p className="text-slate-500 italic font-medium col-span-full py-10 text-center">Nadie ha cobrado mesas en este turno todavía.</p>
            ) : (
              liquidacionPorMesero.map((liq, idx) => {
                const balanceFinal = liq.efectivo - liq.propinaTarjeta;
                const debeEntregar = balanceFinal > 0;
                const cajaDebePagar = balanceFinal < 0;

                return (
                  <div key={idx} className="bg-[#050812] border border-slate-800/80 rounded-2xl p-5 flex flex-col shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/50"></div>
                    
                    <div className="flex justify-between items-start mb-4 pl-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Mesero en Turno</span>
                        <h4 className="text-lg font-black text-white flex items-center gap-2">👤 {liq.mesero}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-1">Venta Bruta</span>
                        <span className="font-mono font-black text-emerald-400">${liq.totalVendido.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-5 pl-3 border-t border-slate-800/60 pt-4">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Cobrado en Efectivo:</span>
                        <span className="font-mono font-bold">${liq.efectivo.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Cobrado con Tarjeta:</span>
                        <span className="font-mono">${liq.tarjeta.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-dashed border-slate-800 my-1"></div>
                      <div className="flex justify-between text-xs text-amber-500/80">
                        <span>Propinas recibidas en Efectivo:</span>
                        <span className="font-mono">${liq.propinaEfectivo.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-amber-400 font-bold">
                        <span>Propinas retenidas en Tarjeta:</span>
                        <span className="font-mono">${liq.propinaTarjeta.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className={`mt-auto p-3 rounded-xl border flex justify-between items-center pl-4 ${
                      debeEntregar ? 'bg-emerald-500/10 border-emerald-500/30' : 
                      cajaDebePagar ? 'bg-rose-500/10 border-rose-500/30' : 
                      'bg-slate-800/50 border-slate-700'
                    }`}>
                      <span className={`text-[10px] font-black uppercase tracking-widest leading-tight ${debeEntregar ? 'text-emerald-500' : cajaDebePagar ? 'text-rose-400' : 'text-slate-400'}`}>
                        {debeEntregar ? 'Entregar a Caja:' : cajaDebePagar ? 'Caja le paga:' : 'En ceros (Paz)'}
                      </span>
                      <span className={`text-xl font-black font-mono tracking-tighter ${debeEntregar ? 'text-emerald-400' : cajaDebePagar ? 'text-rose-400' : 'text-slate-400'}`}>
                        ${Math.abs(balanceFinal).toFixed(2)}
                      </span>
                    </div>

                    <button 
                      onClick={() => imprimirLiquidacionMesero(liq)}
                      className="mt-4 w-full py-2.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 font-bold text-[10px] uppercase tracking-widest rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      🖨️ Imprimir Recibo
                    </button>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {pestañaActiva === 'cancelaciones' && (
        <div className="animate-fade-in bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-end mb-6 pb-6 border-b border-slate-800/80">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-3">
                <span className="text-xl">🚫</span> Registro de Platillos Cancelados
              </h3>
              <p className="text-xs text-slate-400 mt-1">Platillos eliminados por meseros o chefs después de haber sido enviados a estación.</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-500 block uppercase font-sans tracking-widest font-bold">Pérdida del Turno</span>
              <span className="text-xl font-black text-rose-400">
                ${cancelacionesTabla.reduce((acc, curr) => acc + (parseFloat(curr.precio) * curr.cantidad), 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="pb-3 pl-2">Hora</th>
                  <th className="pb-3">Platillo Cancelado</th>
                  <th className="pb-3 text-center">Cant.</th>
                  <th className="pb-3">Motivo Registrado</th>
                  <th className="pb-3">Usuario / Estación</th>
                  <th className="pb-3 text-right pr-2">Monto Perdido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-medium text-slate-300">
                {cancelacionesTabla.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-500 italic">No hay cancelaciones registradas en este turno. ¡Excelente!</td></tr>
                ) : (
                  cancelacionesTabla.map(c => (
                    <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 pl-2 text-slate-500 font-mono text-[10px]">{c.hora_cancelacion}</td>
                      <td className="py-3 font-bold text-slate-200">{c.platillo}</td>
                      <td className="py-3 text-center font-mono">
                        <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded text-[11px] font-bold">{c.cantidad}x</span>
                      </td>
                      <td className="py-3 text-amber-400/90 text-[11px] font-bold">{c.motivo}</td>
                      <td className="py-3 text-slate-400">{c.usuario}</td>
                      <td className="py-3 text-right font-mono font-black text-rose-400 pr-2">
                        ${(parseFloat(c.precio) * c.cantidad).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pestañaActiva === 'historial' && (
        <HistorialCortes />
      )}

    </div>
  );
}