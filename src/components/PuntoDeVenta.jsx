import React, { useState, useMemo, useEffect } from 'react';

export default function PuntoDeVenta({ menu, reservaciones, comandas, setComandas, onCobrar, onEnviarCocina, notificacionesCocina, onDespacharPlato, usuario, config }) {
  const [mesaActivaId, setMesaActivaId] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Platos Fuertes');
  
  const [modalNota, setModalNota] = useState({ isOpen: false, index: -1, nombre: '', texto: '', categoria: '' });
  const [modalNotificacionesOpen, setModalNotificacionesOpen] = useState(false);
  const [ticketParaImprimir, setTicketParaImprimir] = useState(null);
  const [modalCobro, setModalCobro] = useState({ isOpen: false, cargando: false, error: null });
  const [modalModificador, setModalModificador] = useState({ isOpen: false, platillo: null, selecciones: {} });

  const [modalCancelacion, setModalCancelacion] = useState({ isOpen: false, index: -1, item: null, motivo: '' });
  const [modalAutorizacion, setModalAutorizacion] = useState({ isOpen: false, titulo: '', accionPendiente: null, pin: '', error: '' });
  const [descuentoDesbloqueado, setDescuentoDesbloqueado] = useState(false); 

  const [clientes, setClientes] = useState([]);
  
  const [modalCRM, setModalCRM] = useState({ 
    isOpen: false, 
    busqueda: '', 
    clienteSeleccionado: null, 
    tipoServicio: 'Domicilio', 
    form: { nombre: '', telefono: '', direccion: '' } 
  });

  const [propinaPct, setPropinaPct] = useState(0);
  const [divisiones, setDivisiones] = useState(1);
  const [partesPagadas, setPartesPagadas] = useState({});
  const [descuentoTipo, setDescuentoTipo] = useState('%'); 
  const [descuentoInput, setDescuentoInput] = useState('');

  const [metodoDivision, setMetodoDivision] = useState('iguales'); 
  const [asignacionItems, setAsignacionItems] = useState({});

  const [horaActual, setHoraActual] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const esAdmin = ['Gerente', 'Subgerente', 'Administrador', 'Admin'].includes(usuario?.rol);

  const bgGradients = [
    'from-indigo-600 to-blue-600', 'from-emerald-600 to-teal-600', 'from-amber-600 to-orange-600',
    'from-rose-600 to-pink-600', 'from-purple-600 to-fuchsia-600', 'from-cyan-600 to-sky-600'
  ];

  const categoriasDeBarra = ['Bebidas', 'Coctelería', 'Cervezas', 'Licores'];

  let tipoNotaDetectado = 'Alimentos';
  if (categoriasDeBarra.includes(modalNota.categoria)) {
    tipoNotaDetectado = 'Bebidas';
  } else if (modalNota.categoria === 'Postres') {
    tipoNotaDetectado = 'Postres';
  }

  const notasBD = config?.notas_predefinidas || {
    "Alimentos": ["Sin cebolla", "Sin picante", "Bien cocido", "Sin tomate", "Sin queso", "Para llevar"],
    "Bebidas": ["Poco hielo", "Sin hielo", "Extra limón", "Sin popote", "Para llevar"],
    "Postres": ["Sin nueces", "Extra chocolate", "Para llevar"]
  };
  const notasRapidasAMostrar = notasBD[tipoNotaDetectado] || notasBD['Alimentos'] || [];

  const cargarClientes = () => {
    fetch(`http://${window.location.hostname}:3000/api/clientes`)
      .then(r => r.json())
      .then(data => setClientes(data))
      .catch(e => console.error("Error cargando clientes", e));
  };

  useEffect(() => {
    cargarClientes();
    if (notificacionesCocina.length === 0) setModalNotificacionesOpen(false);
  }, [notificacionesCocina]);

  const clientesFiltrados = useMemo(() => {
    if (!modalCRM.busqueda) return [];
    const q = modalCRM.busqueda.toLowerCase();
    return clientes.filter(c => c.nombre.toLowerCase().includes(q) || (c.telefono && c.telefono.includes(q)));
  }, [modalCRM.busqueda, clientes]);

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
  const subtotalBruto = cuentaActual.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);
  const tienePermisoDescuento = esAdmin || descuentoDesbloqueado;

  const montoDescuento = tienePermisoDescuento
    ? (descuentoTipo === '%' ? subtotalBruto * ((parseFloat(descuentoInput) || 0) / 100) : (parseFloat(descuentoInput) || 0))
    : 0;

  const subtotalNeto = Math.max(0, subtotalBruto - montoDescuento);
  const iva = subtotalNeto * factorIVA;
  const totalBase = subtotalNeto + iva;
  const propinaCalculada = subtotalBruto * (propinaPct / 100); 
  const granTotal = totalBase + propinaCalculada;

  const tienePlatillosPendientesDeMarchar = useMemo(() => {
    return cuentaActual.some(item => item.cantidad > (item.enviado || 0));
  }, [cuentaActual]);

  const tienePlatillosListosSinEntregar = useMemo(() => {
    if (!mesaActivaInfo) return false;
    return notificacionesCocina.some(notif => String(notif.numMesa).trim() === String(mesaActivaInfo.numMesa).trim());
  }, [notificacionesCocina, mesaActivaInfo]);

  const puedeCobrarCuenta = mesaActivaId && cuentaActual.length > 0 && !tienePlatillosPendientesDeMarchar && !tienePlatillosListosSinEntregar;

  const itemsDesglosadosFisicos = useMemo(() => {
    const desglosados = [];
    cuentaActual.forEach((item, itemIdx) => {
      for (let i = 0; i < item.cantidad; i++) {
        desglosados.push({ ...item, indexOriginal: itemIdx, uId: `${item.id}-${itemIdx}-${i}`, precioUnitario: parseFloat(item.precio) });
      }
    });
    return desglosados;
  }, [cuentaActual]);

  const desgloseMatematicoPersonas = useMemo(() => {
    const listadoPersonas = Array.from({ length: divisiones }).map((_, idx) => ({
      index: idx, bruto: 0, descuento: 0, iva: 0, propina: 0, total: 0, itemsAsignadosCount: 0
    }));

    if (metodoDivision === 'iguales') {
      const brutoPorPersona = subtotalBruto / divisiones;
      const descPorPersona = montoDescuento / divisiones;
      const ivaPorPersona = iva / divisiones;
      const propinaPorPersona = propinaCalculada / divisiones;
      const totalPorPersona = granTotal / divisiones;

      listadoPersonas.forEach(p => {
        p.bruto = brutoPorPersona; p.descuento = descPorPersona; p.iva = ivaPorPersona;
        p.propina = propinaPorPersona; p.total = totalPorPersona;
      });
    } else {
      itemsDesglosadosFisicos.forEach(item => {
        const personaAsignadaIdx = asignacionItems[item.uId];
        if (personaAsignadaIdx !== undefined && personaAsignadaIdx !== null && personaAsignadaIdx < divisiones) {
          listadoPersonas[personaAsignadaIdx].bruto += item.precioUnitario;
          listadoPersonas[personaAsignadaIdx].itemsAsignadosCount += 1;
        }
      });
      listadoPersonas.forEach(p => {
        const factorProporcional = subtotalBruto > 0 ? (p.bruto / subtotalBruto) : 0;
        p.descuento = montoDescuento * factorProporcional;
        const netoPersona = Math.max(0, p.bruto - p.descuento);
        p.iva = netoPersona * factorIVA;
        p.propina = p.bruto * (propinaPct / 100);
        p.total = netoPersona + p.iva + p.propina;
      });
    }
    return listadoPersonas;
  }, [metodoDivision, divisiones, itemsDesglosadosFisicos, asignacionItems, subtotalBruto, montoDescuento, iva, propinaCalculada, granTotal, factorIVA, propinaPct]);

  const todosLosItemsAsignados = useMemo(() => {
    if (metodoDivision === 'iguales') return true;
    return itemsDesglosadosFisicos.every(item => asignacionItems[item.uId] !== undefined && asignacionItems[item.uId] !== null && asignacionItems[item.uId] < divisiones);
  }, [metodoDivision, itemsDesglosadosFisicos, asignacionItems, divisiones]);

  const todosTienenMetodoPago = useMemo(() => {
    if (divisiones === 1) return true;
    return desgloseMatematicoPersonas.every(p => p.total <= 0 || partesPagadas[p.index] !== undefined);
  }, [desgloseMatematicoPersonas, partesPagadas, divisiones]);

  const listoParaLiquidarCuentaTotal = todosLosItemsAsignados && todosTienenMetodoPago;

  const procesarPinAutorizacion = async (pinIngresado, accionAprobada) => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: pinIngresado })
      });
      const data = await res.json();
      
      if (res.ok && ['Gerente', 'Subgerente', 'Administrador', 'Admin'].includes(data.rol)) {
        setModalAutorizacion({ isOpen: false, titulo: '', accionPendiente: null, pin: '', error: '' });
        if (accionAprobada) accionAprobada();
      } else {
        setModalAutorizacion(prev => ({ ...prev, pin: '', error: 'PIN incorrecto o sin privilegios.' }));
      }
    } catch (e) {
      setModalAutorizacion(prev => ({ ...prev, pin: '', error: 'Error de conexión con el servidor.' }));
    }
  };

  const handleDigitoPin = (num) => {
    setModalAutorizacion(prev => {
      if (prev.pin.length >= 4) return prev;
      const nuevoPin = prev.pin + num;
      if (nuevoPin.length === 4) {
        setTimeout(() => procesarPinAutorizacion(nuevoPin, prev.accionPendiente), 50);
      }
      return { ...prev, pin: nuevoPin, error: '' };
    });
  };

  const handleCrearOrdenExterna = async () => {
    let clienteFinal = modalCRM.clienteSeleccionado;
    
    if (!clienteFinal && modalCRM.form.nombre) {
      try {
        const res = await fetch(`http://${window.location.hostname}:3000/api/clientes`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modalCRM.form)
        });
        clienteFinal = await res.json();
        cargarClientes();
      } catch (e) { return alert("Error al registrar el nuevo cliente en la base de datos."); }
    }
    if (!clienteFinal) return alert("Por favor selecciona o registra a un cliente.");

    const prefijo = modalCRM.tipoServicio === 'Domicilio' ? 'DOM' : 'PICK';
    const nombreCorto = clienteFinal.nombre.split(' ')[0].substring(0,4).toUpperCase();
    const numFolioExterno = `${prefijo}-${nombreCorto}-${Math.floor(Math.random()*1000)}`;

    try {
      const resReserva = await fetch(`http://${window.location.hostname}:3000/api/reservaciones`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: clienteFinal.nombre, fecha: new Date().toISOString().split('T')[0], hora: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          personas: 1, telefono: clienteFinal.telefono, tipo_servicio: modalCRM.tipoServicio,
          direccion_entrega: modalCRM.tipoServicio === 'Domicilio' ? (clienteFinal.direccion || modalCRM.form.direccion) : '',
          numMesa: numFolioExterno, estado: 'en-curso', tipo: 'General', color: 'from-emerald-400 to-teal-500'
        })
      });
      const nuevaOrden = await resReserva.json();
      setMesaActivaId(nuevaOrden.id);
      
      setModalCRM({ isOpen: false, busqueda: '', clienteSeleccionado: null, tipoServicio: 'Domicilio', form: { nombre: '', telefono: '', direccion: '' } });
    } catch (e) { alert("Error al levantar la orden en el servidor."); }
  };

  const seleccionarClienteExistente = (cliente) => {
    setModalCRM({
      ...modalCRM, clienteSeleccionado: cliente, busqueda: cliente.nombre,
      form: { nombre: cliente.nombre, telefono: cliente.telefono || '', direccion: cliente.direccion || '' }
    });
  };

  const obtenerPrecioActual = (platillo) => {
    let precioNormal = parseFloat(platillo.precio);
    let promoActiva = false;
    let precioPromo = precioNormal;

    try {
      const promo = typeof platillo.promocion === 'string' ? JSON.parse(platillo.promocion) : (platillo.promocion || {});
      
      if (promo.activo && promo.dias && promo.dias.length > 0) {
        const diaActual = horaActual.getDay(); 
        const horas = String(horaActual.getHours()).padStart(2, '0');
        const mins = String(horaActual.getMinutes()).padStart(2, '0');
        const horaStr = `${horas}:${mins}`;

        if (promo.dias.includes(diaActual)) {
          if (horaStr >= (promo.inicio || "00:00") && horaStr <= (promo.fin || "23:59")) {
            promoActiva = true;
            precioPromo = parseFloat(promo.precio_promo || 0);
          }
        }
      }
    } catch (e) {}

    return { precioOriginal: precioNormal, precioFinal: promoActiva ? precioPromo : precioNormal, promoActiva };
  };

  const agregarPlatillo = (platillo) => {
    if (!mesaActivaId) return alert('Primero selecciona una de las mesas o pedidos en la barra superior.');
    
    const { precioFinal, promoActiva } = obtenerPrecioActual(platillo);
    const platilloConPromo = { ...platillo, precioActualizado: precioFinal, esPromo: promoActiva };

    const gruposMod = typeof platillo.grupos_modificadores === 'string' ? JSON.parse(platillo.grupos_modificadores || '[]') : (platillo.grupos_modificadores || []);
    if (gruposMod.length > 0) {
      setModalModificador({ isOpen: true, platillo: { ...platilloConPromo, gruposParsed: gruposMod }, selecciones: {} });
    } else {
      confirmarPlatillo(platilloConPromo, [], 0);
    }
  };

  const confirmarPlatillo = (platilloEval, modsElegidos, precioExtra) => {
    const precioBaseEval = platilloEval.precioActualizado !== undefined ? platilloEval.precioActualizado : parseFloat(platilloEval.precio);
    const precioTotalItem = precioBaseEval + precioExtra;
    
    setComandas(prev => {
      const cuenta = [...(prev[mesaActivaId] || [])];
      
      const index = cuenta.findIndex(p => 
        p.id === platilloEval.id && 
        !p.comentario && 
        parseFloat(p.precioBase) === precioBaseEval && 
        JSON.stringify(p.modificadores || []) === JSON.stringify(modsElegidos)
      );

      if (index >= 0) {
        cuenta[index] = { ...cuenta[index], cantidad: cuenta[index].cantidad + 1 };
      } else {
        cuenta.push({ 
          ...platilloEval, cantidad: 1, enviado: 0, comentario: '', modificadores: modsElegidos, 
          precio: precioTotalItem, precioBase: precioBaseEval 
        });
      }
      return { ...prev, [mesaActivaId]: cuenta };
    });
    setModalModificador({ isOpen: false, platillo: null, selecciones: {} });
  };

  const toggleOpcionModificador = (gIndex, opcion, maximo) => {
    setModalModificador(prev => {
      const sels = { ...prev.selecciones };
      const actual = sels[gIndex] || [];
      const existe = actual.find(o => o.nombre === opcion.nombre);
      if (existe) {
        sels[gIndex] = actual.filter(o => o.nombre !== opcion.nombre);
      } else {
        if (maximo === 1) sels[gIndex] = [opcion];
        else if (actual.length < maximo) sels[gIndex] = [...actual, opcion];
      }
      return { ...prev, selecciones: sels };
    });
  };

  const procesarModificadores = () => {
    const { platillo, selecciones } = modalModificador;
    let modsFinales = []; let extraAcumulado = 0;
    Object.keys(selecciones).forEach(gIdx => {
      selecciones[gIdx].forEach(opcion => {
        modsFinales.push({ nombre: opcion.nombre, precio: parseFloat(opcion.precio || 0) });
        extraAcumulado += parseFloat(opcion.precio || 0);
      });
    });
    confirmarPlatillo(platillo, modsFinales, extraAcumulado);
  };

  const modificarCantidad = (index, delta) => {
    const cuenta = [...(comandas[mesaActivaId] || [])];
    const itemAnterior = cuenta[index];
    let nuevaCantidad = itemAnterior.cantidad + delta;
    
    if (delta < 0 && (itemAnterior.enviado || 0) > 0 && nuevaCantidad < itemAnterior.enviado) {
      const activarModalCancelacion = () => setModalCancelacion({ isOpen: true, index: index, item: itemAnterior, motivo: '' });
      
      if (esAdmin) {
        activarModalCancelacion();
      } else {
        setModalAutorizacion({ isOpen: true, titulo: 'Autorizar Cancelación', accionPendiente: activarModalCancelacion, pin: '', error: '' });
      }
      return;
    }

    setComandas(prev => {
      const copyCuenta = [...(prev[mesaActivaId] || [])];
      if (nuevaCantidad <= 0 && (itemAnterior.enviado || 0) === 0) copyCuenta.splice(index, 1);
      else copyCuenta[index] = { ...itemAnterior, cantidad: nuevaCantidad };
      return { ...prev, [mesaActivaId]: copyCuenta };
    });
  };

  const ejecutarCancelacionLocal = async () => {
    if (!modalCancelacion.motivo.trim()) return alert('El motivo es obligatorio para cancelar un platillo marchado.');
    try {
      await fetch(`http://${window.location.hostname}:3000/api/cancelaciones`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platillo: modalCancelacion.item.nombre, cantidad: 1, precio: modalCancelacion.item.precio, motivo: modalCancelacion.motivo, usuario: usuario?.nombre || 'Mesero' })
      });
      setComandas(prev => {
        const cuenta = [...(prev[mesaActivaId] || [])];
        const target = cuenta[modalCancelacion.index];
        target.cantidad -= 1; target.enviado -= 1;
        if (target.cantidad <= 0) cuenta.splice(modalCancelacion.index, 1);
        else cuenta[modalCancelacion.index] = target;

        fetch(`http://${window.location.hostname}:3000/api/comandas/${mesaActivaId}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platillos: cuenta })
        });
        return { ...prev, [mesaActivaId]: cuenta };
      });
      setModalCancelacion({ isOpen: false, index: -1, item: null, motivo: '' });
    } catch (e) { alert("Fallo de red al registrar cancelación."); }
  };

  const abrirModalNota = (index, platillo) => {
    setModalNota({ isOpen: true, index, nombre: platillo.nombre, texto: platillo.comentario || '', categoria: platillo.categoria || '' });
  };

  const guardarNota = () => {
    setComandas(prev => {
      const cuenta = [...(prev[mesaActivaId] || [])];
      if (cuenta[modalNota.index]) cuenta[modalNota.index] = { ...cuenta[modalNota.index], comentario: modalNota.texto };
      return { ...prev, [mesaActivaId]: cuenta };
    });
    setModalNota({ isOpen: false, index: -1, nombre: '', texto: '', categoria: '' });
  };

  const handleMarcharLocal = async () => {
    const pendientes = cuentaActual.filter(item => item.cantidad > (item.enviado || 0));
    if (pendientes.length === 0) return;
    const platillosBarra = pendientes.filter(p => categoriasDeBarra.includes(p.categoria)).map(p => ({ ...p, cantidad: p.cantidad - (p.enviado || 0) }));
    const platillosCocina = pendientes.filter(p => !categoriasDeBarra.includes(p.categoria)).map(p => ({ ...p, cantidad: p.cantidad - (p.enviado || 0) }));

    try {
      if (platillosBarra.length > 0) {
        await fetch(`http://${window.location.hostname}:3000/api/cocina`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numMesa: mesaActivaInfo?.numMesa || 'Barra', platillos: platillosBarra }) });
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (platillosCocina.length > 0) {
        await fetch(`http://${window.location.hostname}:3000/api/cocina`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numMesa: mesaActivaInfo?.numMesa || 'Barra', platillos: platillosCocina }) });
      }
      const nuevaCuenta = cuentaActual.map(p => ({ ...p, enviado: p.cantidad }));
      setComandas(prev => ({ ...prev, [mesaActivaId]: nuevaCuenta }));
      await fetch(`http://${window.location.hostname}:3000/api/comandas/${mesaActivaId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platillos: nuevaCuenta }) });
    } catch (e) { alert("Fallo de red al enviar a estaciones."); }
  };

  const handleImprimirTicket = () => {
    if (!ticketParaImprimir) return;

    // 🔥 GENERADOR DINÁMICO DE QR BASADO EN LA CONFIGURACIÓN 🔥
    const linkBase = config?.link_facturacion || 'https://facturas.sabor.io/facturar/';
    const linkSeguro = linkBase.endsWith('/') ? linkBase : `${linkBase}/`;
    const urlCompletaFactura = `${linkSeguro}${ticketParaImprimir.folio}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(urlCompletaFactura)}&margin=0`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
    document.body.appendChild(iframe);

    const esDelivery = ticketParaImprimir.tipo_servicio === 'Domicilio' || ticketParaImprimir.tipo_servicio === 'Pick Up';
    const infoEntregaHTML = esDelivery ? `
      <div class="dash"></div>
      <div style="font-weight:bold; text-align:center; font-size:12px; margin-bottom:2px;">TIPO: ${ticketParaImprimir.tipo_servicio.toUpperCase()}</div>
      <div><b>TELÉFONO:</b> ${ticketParaImprimir.telefono || 'No registrado'}</div>
      ${ticketParaImprimir.tipo_servicio === 'Domicilio' ? `<div><b>ENTREGAR EN:</b> ${ticketParaImprimir.direccion_entrega || 'Revisar notas'}</div>` : ''}
    ` : '';

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
          <div><b>ATENDIÓ:</b> ${ticketParaImprimir.mesero}</div>
          <div><b>FECHA:</b> ${ticketParaImprimir.fecha}</div>
          <div class="dash"></div>
          <div><b>MESA/ORDEN:</b> ${ticketParaImprimir.mesaNum}</div>
          <div><b>CLIENTE:</b> ${ticketParaImprimir.cliente}</div>
          ${infoEntregaHTML}
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
              ${ticketParaImprimir.platillos.map((p) => `
                <tr>
                  <td style="padding: 2px 0; vertical-align: top;">${p.cantidad}x</td>
                  <td style="padding: 2px 0;">
                    ${p.nombre} ${p.esPromo ? '(Promo)' : ''}
                    ${p.modificadores && p.modificadores.length > 0 ? `<div style="font-size:9px; color:#555; padding-left: 4px;">${p.modificadores.map(m => `+ ${m.nombre}`).join('<br>')}</div>` : ''}
                  </td>
                  <td style="text-align: right; padding: 2px 0; vertical-align: top;">$${(p.precio * p.cantidad).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="dash"></div>
          <div class="flex"><span>Subtotal:</span><span>$${ticketParaImprimir.subtotalBruto.toFixed(2)}</span></div>
          ${ticketParaImprimir.descuento > 0 ? `<div class="flex bold" style="color: #dc2626;"><span>Descuento / Cortesía:</span><span>-$${ticketParaImprimir.descuento.toFixed(2)}</span></div>` : ''}
          <div class="flex"><span>I.V.A. (${config?.iva || 16}%):</span><span>$${ticketParaImprimir.iva.toFixed(2)}</span></div>
          ${ticketParaImprimir.propina > 0 ? `<div class="flex"><span>Propina Sugerida:</span><span>$${ticketParaImprimir.propina.toFixed(2)}</span></div>` : ''}
          <div class="flex bold" style="font-size: 12px; margin-top: 4px; padding-top: 4px; border-top: 1px solid #000;">
            <span>TOTAL PAGADO:</span><span>$${ticketParaImprimir.granTotal.toFixed(2)}</span>
          </div>
          <div class="dash"></div>
          <div class="center bold" style="font-size: 10px; margin-bottom: 2px;">MÉTODO DE PAGO UTILIZADO</div>
          ${(ticketParaImprimir.desglosePago.efectivo + ticketParaImprimir.desglosePropina.efectivo) > 0 ? `<div class="flex" style="font-size: 10px;"><span>💵 Efectivo:</span><span>$${(ticketParaImprimir.desglosePago.efectivo + ticketParaImprimir.desglosePropina.efectivo).toFixed(2)}</span></div>` : ''}
          ${(ticketParaImprimir.desglosePago.tarjeta + ticketParaImprimir.desglosePropina.tarjeta) > 0 ? `<div class="flex" style="font-size: 10px;"><span>💳 Tarjeta:</span><span>$${(ticketParaImprimir.desglosePago.tarjeta + ticketParaImprimir.desglosePropina.tarjeta).toFixed(2)}</span></div>` : ''}
          ${ticketParaImprimir.divisiones > 1 ? `<div class="center" style="margin-top: 6px; font-size: 10px; color: #555;">(Cuenta dividida en ${ticketParaImprimir.divisiones} partes)</div>` : ''}
          
          <div class="dash"></div>
          <div class="center" style="margin-top: 10px;">
            <b>🧾 FACTURACIÓN EN LÍNEA</b><br/>
            <img src="${qrUrl}" alt="QR Factura" style="margin: 8px 0; border: 2px solid #000; border-radius: 8px; padding: 4px;" /><br/>
            Escanea el código QR o ingresa a:<br/>
            <b>${linkBase}</b><br/>
            <div style="margin-top: 4px;">
              Ticket: ${ticketParaImprimir.folio}<br/>
              Monto: $${ticketParaImprimir.granTotal.toFixed(2)}
            </div>
          </div>
          <div class="dash"></div>
          <div class="center" style="margin-top: 8px; font-style: italic;">${config?.mensaje_ticket || '¡Gracias por su preferencia!'}</div>
        </body>
      </html>
    `;
    const doc = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;
    doc.document.open(); doc.document.write(htmlContent); doc.document.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 500); }, 500);
  };

  const solicitarConfirmacionCobro = async () => {
    if (!puedeCobrarCuenta || !mesaActivaInfo) return;
    setPropinaPct(0); setDivisiones(1); setPartesPagadas({}); setDescuentoInput(''); setDescuentoTipo('%');
    setMetodoDivision('iguales'); setAsignacionItems({}); 
    setDescuentoDesbloqueado(false); 
    setModalCobro({ isOpen: true, cargando: true, error: null });

    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/cocina`);
      const comandasCocina = await res.json();
      const mesaTarget = String(mesaActivaInfo.numMesa || '').trim().toLowerCase();
      const cocinaTrabajando = comandasCocina.some(p => String(p.numMesa || '').trim().toLowerCase() === mesaTarget);
      if (cocinaTrabajando) {
        setModalCobro({ isOpen: true, cargando: false, error: `Las estaciones de preparación (Cocina/Barra) aún tienen platillos pendientes para la orden ${mesaActivaInfo.numMesa}.` });
        return;
      }
      setModalCobro({ isOpen: true, cargando: false, error: null });
    } catch (error) { setModalCobro({ isOpen: true, cargando: false, error: 'Fallo crítico de comunicación de red. No se pudo verificar el estatus de las estaciones.' }); }
  };

  const togglePartePagada = (i, metodo) => {
    setPartesPagadas(prev => {
      const copy = { ...prev };
      if (copy[i] === metodo) delete copy[i]; 
      else copy[i] = metodo; 
      return copy;
    });
  };

  const procesarPagoMesa = async (metodoPagoUnico = null) => {
    setModalCobro(prev => ({ ...prev, cargando: true }));
    let pagoEfectivo = 0, pagoTarjeta = 0;
    let propEfectivo = 0, propTarjeta = 0;

    let copiasPartesPagadas = { ...partesPagadas };
    if (divisiones === 1 && metodoPagoUnico) {
      copiasPartesPagadas[0] = metodoPagoUnico;
    }

    desgloseMatematicoPersonas.forEach(p => {
      const metodoPersona = copiasPartesPagadas[p.index];
      const totalBasePersona = Math.max(0, p.bruto - p.descuento + p.iva);
      
      if (metodoPersona === 'Efectivo') {
        pagoEfectivo += totalBasePersona; propEfectivo += p.propina;
      } else if (metodoPersona === 'Tarjeta') {
        pagoTarjeta += totalBasePersona; propTarjeta += p.propina;
      }
    });

    const payload = {
      mesero: usuario?.nombre || 'Mesero de Salón', platillos: cuentaActual, subtotal: subtotalNeto, iva, propina: propinaCalculada, total: granTotal, 
      metodoPago: divisiones === 1 ? metodoPagoUnico : 'Mixto/Dividido', desglosePago: { efectivo: pagoEfectivo, tarjeta: pagoTarjeta }, desglosePropina: { efectivo: propEfectivo, tarjeta: propTarjeta },
      descuento: montoDescuento, mesaNum: mesaActivaInfo?.numMesa || 'Barra', cliente: mesaActivaInfo?.nombre || 'Cliente General', personas: parseInt(mesaActivaInfo?.personas || 1),
      tipo_servicio: mesaActivaInfo?.tipo_servicio || 'Comedor', direccion_entrega: mesaActivaInfo?.direccion_entrega || ''
    };

    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/cobrar/${mesaActivaId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        try { await fetch(`http://${window.location.hostname}:3000/api/reservaciones/${mesaActivaId}`, { method: 'DELETE' }); } catch (err) {}
        setTicketParaImprimir({
          folio: data.folio, mesaNum: payload.mesaNum, mesero: payload.mesero, cliente: payload.cliente, platillos: [...cuentaActual],
          subtotalBruto: subtotalBruto, subtotal: subtotalNeto, descuento: montoDescuento, iva, propina: propinaCalculada, granTotal: granTotal,
          divisiones: divisiones, desglosePago: payload.desglosePago, desglosePropina: payload.desglosePropina, tipo_servicio: payload.tipo_servicio,
          telefono: mesaActivaInfo?.telefono || '', direccion_entrega: payload.direccion_entrega, fecha: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
        });
        const idMesaLiberada = mesaActivaId; setMesaActivaId(''); setModalCobro({ isOpen: false, cargando: false, error: null });
        if (onCobrar) onCobrar(idMesaLiberada);
      } else { setModalCobro({ isOpen: true, cargando: false, error: data.error }); }
    } catch (e) { setModalCobro({ isOpen: true, cargando: false, error: `Error en red local: ${e.message}` }); }
  };

  return (
    <div className="flex w-full h-full bg-[#070b16] font-sans select-none overflow-hidden relative">
      
      {/* MODAL DE AUTORIZACIÓN (MANAGER OVERRIDE) */}
      {modalAutorizacion.isOpen && (
        <div className="fixed inset-0 z-[800] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#0b1120] border border-indigo-500/30 rounded-3xl p-6 md:p-8 max-w-xs w-full shadow-[0_0_50px_rgba(99,102,241,0.15)] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
            <header className="mb-6 text-center">
              <span className="text-4xl block mb-2">🔐</span>
              <h2 className="text-lg font-black text-white tracking-tight">{modalAutorizacion.titulo}</h2>
              <p className="text-[10px] text-indigo-400 mt-1 uppercase tracking-widest font-bold">Ingrese PIN de Gerencia</p>
            </header>
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((_, i) => (
                <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black transition-all ${modalAutorizacion.pin.length > i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110' : 'bg-slate-900 border border-slate-700 text-transparent'}`}>
                  {modalAutorizacion.pin.length > i ? '•' : ''}
                </div>
              ))}
            </div>
            {modalAutorizacion.error && <p className="text-rose-400 text-[10px] text-center font-bold uppercase tracking-wider mb-4 animate-pulse">{modalAutorizacion.error}</p>}
            <div className="grid grid-cols-3 gap-3 mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} onClick={() => handleDigitoPin(String(num))} className="h-14 bg-slate-800 hover:bg-slate-700 text-white text-xl font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer">{num}</button>
              ))}
              <button onClick={() => setModalAutorizacion(prev => ({...prev, pin: '', error: ''}))} className="h-14 bg-rose-900/30 text-rose-500 hover:bg-rose-900/50 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer">Borrar</button>
              <button onClick={() => handleDigitoPin('0')} className="h-14 bg-slate-800 hover:bg-slate-700 text-white text-xl font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer">0</button>
              <button onClick={() => setModalAutorizacion({ isOpen: false, titulo: '', accionPendiente: null, pin: '', error: '' })} className="h-14 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCELACIÓN POR MESERO */}
      {modalCancelacion.isOpen && (
        <div className="fixed inset-0 z-[700] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#1a0f14] border border-rose-900/50 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(225,29,72,0.15)] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600"></div>
            <header className="mb-5 text-center">
              <span className="text-4xl block mb-2">🚫</span>
              <h2 className="text-xl font-black text-white tracking-tight">Cancelar Platillo</h2>
              <p className="text-[11px] text-rose-400 mt-1 uppercase tracking-widest font-bold">Este producto ya fue enviado a cocina</p>
            </header>
            <div className="bg-rose-950/30 border border-rose-900/30 p-3 rounded-xl mb-5 text-center">
              <p className="text-slate-300 text-sm font-bold truncate">{modalCancelacion.item?.nombre}</p>
            </div>
            <div className="mb-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Motivo de la cancelación</label>
              <select value={modalCancelacion.motivo} onChange={e => setModalCancelacion({...modalCancelacion, motivo: e.target.value})} className="w-full bg-[#0b1120] border border-slate-700 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-rose-500 font-sans cursor-pointer">
                <option value="" disabled>Seleccione un motivo...</option>
                <option value="Cliente se arrepintió">El cliente se arrepintió</option>
                <option value="Error de captura">Error de captura</option>
                <option value="Demasiado tiempo de espera">Demasiado tiempo de espera</option>
                <option value="Falta de insumo en cocina">No hay insumo en cocina</option>
                <option value="Otro">Otro...</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalCancelacion({ isOpen: false, index: -1, item: null, motivo: '' })} className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-colors shadow-sm">Volver</button>
              <button onClick={ejecutarCancelacionLocal} className="flex-1 font-black rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-all shadow-lg text-white bg-rose-600 hover:bg-rose-500 shadow-rose-600/20">Confirmar Baja</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRM (CLIENTES / PEDIDOS) */}
      {modalCRM.isOpen && (
        <div className="fixed inset-0 z-[600] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#0b1120] border border-slate-700 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col relative overflow-hidden">
            <header className="mb-5 text-center">
              <span className="text-4xl block mb-2">🛵</span>
              <h2 className="text-xl font-black text-white tracking-tight">Pedido Externo</h2>
              <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest">Busca un cliente o registra uno nuevo</p>
            </header>
            
            <div className="flex bg-[#050812] rounded-xl border border-slate-800 p-1 mb-5">
              <button onClick={() => setModalCRM({...modalCRM, tipoServicio: 'Domicilio'})} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${modalCRM.tipoServicio === 'Domicilio' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>🛵 Domicilio</button>
              <button onClick={() => setModalCRM({...modalCRM, tipoServicio: 'Pick Up'})} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${modalCRM.tipoServicio === 'Pick Up' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>🛍️ Pick Up</button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Buscar o crear cliente (Nombre o Teléfono)</label>
                <input type="text" value={modalCRM.busqueda} onChange={e => setModalCRM({...modalCRM, busqueda: e.target.value, clienteSeleccionado: null, form: {...modalCRM.form, nombre: e.target.value}})} placeholder="Ej. Juan Pérez o 555-1234" className="w-full bg-[#050812] border border-slate-700 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500" />
                {modalCRM.busqueda && !modalCRM.clienteSeleccionado && clientesFiltrados.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 max-h-40 overflow-y-auto">
                    {clientesFiltrados.map(c => (
                      <div key={c.id} onClick={() => seleccionarClienteExistente(c)} className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0">
                        <p className="text-white text-sm font-bold">{c.nombre}</p>
                        <p className="text-xs text-slate-400 font-mono">{c.telefono} • {c.direccion}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!modalCRM.clienteSeleccionado && (
                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-3">
                  <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-2">✨ Nuevo Cliente detectado, llena sus datos:</p>
                  <input type="text" value={modalCRM.form.telefono} onChange={e => setModalCRM({...modalCRM, form: {...modalCRM.form, telefono: e.target.value}})} placeholder="Teléfono a 10 dígitos" className="w-full bg-[#050812] border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-mono" />
                  {modalCRM.tipoServicio === 'Domicilio' && <input type="text" value={modalCRM.form.direccion} onChange={e => setModalCRM({...modalCRM, form: {...modalCRM.form, direccion: e.target.value}})} placeholder="Dirección completa de entrega" className="w-full bg-[#050812] border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500" />}
                </div>
              )}

              {modalCRM.clienteSeleccionado && modalCRM.tipoServicio === 'Domicilio' && (
                <div className="p-3 bg-indigo-900/20 rounded-xl border border-indigo-500/30">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Entregar en:</p>
                  <p className="text-sm text-white">{modalCRM.clienteSeleccionado.direccion || 'Sin dirección registrada'}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 shrink-0">
              <button onClick={() => setModalCRM({ isOpen: false, busqueda: '', clienteSeleccionado: null, tipoServicio: 'Domicilio', form: { nombre: '', telefono: '', direccion: '' } })} className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-colors">Cancelar</button>
              <button onClick={handleCrearOrdenExterna} className="flex-1 font-black rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-all shadow-lg text-white bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 flex items-center justify-center gap-2">Levantar Comanda</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SELECCIÓN DE MODIFICADORES */}
      {modalModificador.isOpen && modalModificador.platillo && (
        <div className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0b1120] border border-slate-700 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col relative overflow-hidden max-h-[90vh]">
            <header className="mb-5 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>🍽️</span> Prepara: {modalModificador.platillo.nombre}
              </h2>
              <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest">Selecciona las opciones del cliente</p>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
              {modalModificador.platillo.gruposParsed.map((grupo, gIdx) => {
                const seleccionados = modalModificador.selecciones[gIdx] || [];
                const cumplido = seleccionados.length >= (grupo.min || 0);

                return (
                  <div key={gIdx} className="bg-[#050812] border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${cumplido ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <div className="flex justify-between items-end mb-3 pl-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{grupo.nombre}</h4>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
                          Selecciona de {grupo.min} a {grupo.max} opciones
                        </p>
                      </div>
                      {!cumplido && <span className="text-[9px] font-bold text-amber-500 animate-pulse bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Requerido</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pl-2">
                      {grupo.opciones.map((opcion, oIdx) => {
                        const estaSeleccionado = seleccionados.find(o => o.nombre === opcion.nombre);
                        const topado = !estaSeleccionado && seleccionados.length >= grupo.max;

                        return (
                          <button 
                            key={oIdx}
                            disabled={topado}
                            onClick={() => toggleOpcionModificador(gIdx, opcion, grupo.max)}
                            className={`flex flex-col items-start p-2.5 rounded-xl border transition-all text-left ${estaSeleccionado ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : topado ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-50' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer'}`}
                          >
                            <span className="text-xs font-bold truncate w-full leading-tight">{opcion.nombre}</span>
                            {parseFloat(opcion.precio) > 0 && <span className={`text-[9px] font-mono mt-1 ${estaSeleccionado ? 'text-indigo-200' : 'text-emerald-400'}`}>+ ${parseFloat(opcion.precio).toFixed(2)}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="mt-6 pt-4 border-t border-slate-800 flex gap-3 shrink-0">
              <button onClick={() => setModalModificador({ isOpen: false, platillo: null, selecciones: {} })} className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-colors">Cancelar</button>
              
              <button 
                onClick={procesarModificadores}
                disabled={!modalModificador.platillo.gruposParsed.every((g, i) => (modalModificador.selecciones[i] || []).length >= (g.min || 0))}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black rounded-xl uppercase tracking-widest text-[10px] cursor-pointer shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center"
              >
                Añadir a la Orden
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL COBRO INVOLUCRANDO EL NUEVO SISTEMA POR PLATILLOS */}
      {modalCobro.isOpen && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl flex flex-col relative overflow-hidden max-h-[92vh]">

            {modalCobro.cargando ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">Procesando pago...</p>
              </div>
            ) : modalCobro.error ? (
              <>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600"></div>
                <div className="text-center mb-6">
                  <span className="text-5xl block mb-3">🛑</span>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider mb-2">Transacción Detenida</h2>
                  <p className="text-xs text-rose-300 font-medium leading-relaxed bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 text-left">{modalCobro.error}</p>
                </div>
                <button onClick={() => setModalCobro({ isOpen: false, cargando: false, error: null })} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-colors shadow-md">Regresar al Salón</button>
              </>
            ) : (
              <>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <div className="text-center mb-4 shrink-0">
                  <span className="text-4xl block mb-1">💸</span>
                  <h2 className="text-xl font-black text-white tracking-tight">Cerrar Cuenta Actual</h2>
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">Orden {mesaActivaInfo?.numMesa || 'Barra'} • {mesaActivaInfo?.nombre || 'General'}</p>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 scrollbar-thin scrollbar-thumb-slate-800">
                  <div className="bg-[#050812] border border-slate-800 rounded-2xl p-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400"><span>Consumo Bruto Global:</span><span className="font-mono">${subtotalBruto.toFixed(2)}</span></div>
                    
                    <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 min-h-[46px]">
                      {tienePermisoDescuento ? (
                        <div className="flex items-center gap-2 w-full justify-between animate-fade-in">
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase text-slate-500">Descuento:</span>
                             <div className="flex bg-[#050812] rounded border border-slate-700">
                               <button onClick={() => setDescuentoTipo('%')} className={`px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${descuentoTipo === '%' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>%</button>
                               <button onClick={() => setDescuentoTipo('$')} className={`px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${descuentoTipo === '$' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>$</button>
                             </div>
                             <input type="number" value={descuentoInput} onChange={e=>setDescuentoInput(e.target.value)} placeholder="0" className="w-12 bg-[#050812] border border-slate-700 text-white text-[10px] text-center rounded py-1 outline-none focus:border-indigo-500 font-mono" />
                             <button onClick={() => {setDescuentoTipo('%'); setDescuentoInput('100');}} className="bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 px-2 py-1 rounded font-bold uppercase text-[9px] transition-colors cursor-pointer ml-1">Cortesía</button>
                          </div>
                          {montoDescuento > 0 && <span className="text-rose-400 font-mono font-bold shrink-0">- ${montoDescuento.toFixed(2)}</span>}
                        </div>
                      ) : (
                        <button onClick={() => setModalAutorizacion({ isOpen: true, titulo: 'Autorizar Descuento', accionPendiente: () => setDescuentoDesbloqueado(true), pin: '', error: '' })} className="flex items-center justify-center gap-2 w-full bg-slate-900/50 hover:bg-indigo-900/30 text-slate-500 hover:text-indigo-400 py-1.5 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer">
                          <span className="text-sm leading-none">🔒</span>
                          <span className="text-[9px] font-black uppercase tracking-wider">Desbloquear Descuentos (Requiere Gerente)</span>
                        </button>
                      )}
                    </div>

                    <div className="flex justify-between text-xs text-slate-400 border-b border-dashed border-slate-800 pb-2"><span>I.V.A. Global ({config?.iva || 16}%):</span><span className="font-mono">${iva.toFixed(2)}</span></div>
                    
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Propina Sugerida:</span>
                      <span className="text-sm font-mono font-bold text-amber-400">+ ${propinaCalculada.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2 pt-1.5">
                      {[0, 10, 15, 20].map(pct => (
                        <button key={`pct-${pct}`} onClick={() => setPropinaPct(pct)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${propinaPct === pct ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>{pct === 0 ? 'Sin Propina' : `${pct}%`}</button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b border-slate-800 pb-3 gap-3">
                      <div className="flex bg-[#050812] rounded-xl border border-slate-700 p-1 w-full sm:w-auto">
                        <button onClick={() => { setMetodoDivision('iguales'); setPartesPagadas({}); }} className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${metodoDivision === 'iguales' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>División Igualitaria</button>
                        <button onClick={() => { setMetodoDivision('platillo'); setPartesPagadas({}); setAsignacionItems({}); }} className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${metodoDivision === 'platillo' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Por Consumo / Platillo</button>
                      </div>

                      <div className="flex items-center gap-2 bg-[#050812] rounded-lg border border-slate-700 p-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Personas:</span>
                        <button onClick={() => { setDivisiones(Math.max(1, divisiones - 1)); setPartesPagadas({}); setAsignacionItems({}); }} className="px-2.5 py-1 text-slate-400 hover:text-white font-black cursor-pointer">-</button>
                        <span className="px-1 font-mono font-bold text-white text-xs">{divisiones}</span>
                        <button onClick={() => { setDivisiones(divisiones + 1); setPartesPagadas({}); setAsignacionItems({}); }} className="px-2.5 py-1 text-slate-400 hover:text-white font-black cursor-pointer">+</button>
                      </div>
                    </div>

                    {metodoDivision === 'platillo' && divisiones > 1 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="border border-slate-800 rounded-xl bg-[#050812] p-3 max-h-56 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
                          <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest block mb-1">Haz clic en el número de comensal (P1, P2...) para asignarle el producto:</span>
                          
                          {itemsDesglosadosFisicos.map((item, index) => {
                            const asignadoAPersonaIdx = asignacionItems[item.uId];
                            return (
                              <div key={item.uId} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/40 p-2 rounded-xl gap-2 border border-slate-800/40">
                                <div className="truncate max-w-[240px]">
                                  <p className="text-white font-bold text-xs truncate">
                                    {item.nombre} {item.esPromo ? <span className="text-[8px] bg-rose-600/20 text-rose-400 px-1 py-0.5 rounded border border-rose-500/30 uppercase tracking-widest ml-1">Promo</span> : ''}
                                  </p>
                                  {item.modificadores?.length > 0 && <p className="text-[9px] text-slate-500 truncate">{item.modificadores.map(m=>`+${m.nombre}`).join(' ')}</p>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono text-emerald-400 text-xs font-bold mr-2">${item.precioUnitario.toFixed(2)}</span>
                                  <div className="flex gap-1">
                                    {Array.from({ length: divisiones }).map((_, pIdx) => (
                                      <button 
                                        key={pIdx} 
                                        onClick={() => setAsignacionItems({...asignacionItems, [item.uId]: pIdx})}
                                        className={`w-7 h-7 text-[9px] font-black rounded-lg transition-all cursor-pointer ${asignadoAPersonaIdx === pIdx ? 'bg-indigo-600 text-white shadow-md font-extrabold ring-1 ring-indigo-400' : 'bg-[#050812] text-slate-500 border border-slate-700 hover:text-slate-300'}`}
                                      >
                                        P{pIdx + 1}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {divisiones > 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {desgloseMatematicoPersonas.map((p) => {
                          const metodoSeleccionado = partesPagadas[p.index];
                          const gradiente = bgGradients[p.index % bgGradients.length];

                          return (
                            <div key={p.index} className={`p-4 rounded-2xl border flex flex-col justify-between gap-2 transition-all ${metodoSeleccionado ? 'bg-slate-950/80 border-slate-700' : 'bg-[#050812] border-slate-800'}`}>
                              <div className="flex justify-between items-center">
                                <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded text-white bg-gradient-to-r ${gradiente}`}>
                                  Comensal {p.index + 1}
                                </span>
                                {metodoDivision === 'platillo' && (
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">{p.itemsAsignadosCount} items</span>
                                )}
                              </div>

                              <div className="space-y-0.5 my-1">
                                <div className="flex justify-between text-[11px] text-slate-500"><span>Consumo Bruto:</span><span className="font-mono">${p.bruto.toFixed(2)}</span></div>
                                {p.descuento > 0 && <div className="flex justify-between text-[11px] text-rose-500"><span>Desc. Proporcional:</span><span className="font-mono">-${p.descuento.toFixed(2)}</span></div>}
                                <div className="flex justify-between text-[11px] text-slate-500"><span>Impuestos e IVA:</span><span className="font-mono">${p.iva.toFixed(2)}</span></div>
                                <div className="flex justify-between text-[11px] text-amber-500/80"><span>Propina:</span><span className="font-mono">${p.propina.toFixed(2)}</span></div>
                              </div>

                              <div className="flex justify-between items-end border-t border-dashed border-slate-800 pt-2 mt-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Cuenta</span>
                                <span className="text-xl font-black text-emerald-400 font-mono tracking-tight">${p.total.toFixed(2)}</span>
                              </div>

                              {p.total > 0 ? (
                                <div className="flex w-full gap-1 mt-2">
                                  <button onClick={() => togglePartePagada(p.index, 'Efectivo')} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center cursor-pointer transition-all ${metodoSeleccionado === 'Efectivo' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>💵 Efe</button>
                                  <button onClick={() => togglePartePagada(p.index, 'Tarjeta')} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center cursor-pointer transition-all ${metodoSeleccionado === 'Tarjeta' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>💳 Tar</button>
                                </div>
                              ) : (
                                <div className="text-center py-2 text-[10px] text-slate-600 italic uppercase">Sin consumo</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {divisiones === 1 && (
                      <div className="flex justify-between items-end pt-3 mt-2 font-mono text-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left">Monto total neto a cobrar:</span>
                        <span className="text-3xl font-black text-emerald-400 font-mono tracking-tighter block">${granTotal.toFixed(2)}</span>
                      </div>
                    )}

                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-800 shrink-0">
                  <button onClick={() => setModalCobro({ isOpen: false, cargando: false, error: null })} className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest text-[10px] cursor-pointer transition-colors">Volver</button>
                  {divisiones === 1 ? (
                    <>
                      <button onClick={() => procesarPagoMesa('Efectivo')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl uppercase tracking-widest text-[10px] cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-1.5">💵 Efectivo</button>
                      <button onClick={() => procesarPagoMesa('Tarjeta')} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl uppercase tracking-widest text-[10px] cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-1.5">💳 Tarjeta</button>
                    </>
                  ) : (
                    <button 
                      disabled={!listoParaLiquidarCuentaTotal} 
                      onClick={() => procesarPagoMesa('Mixto')} 
                      className={`flex-1 py-3.5 font-black rounded-xl uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-1.5 ${listoParaLiquidarCuentaTotal ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'}`}
                    >
                      <span>✔️</span> 
                      <span>{!todosLosItemsAsignados ? 'Faltan Items por Asignar' : !todosTienenMetodoPago ? 'Faltan Formas de Pago' : 'Liquidar Cuentas'}</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL: TICKET FISICO */}
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
              <p><strong>ATENDIÓ:</strong> {ticketParaImprimir.mesero}</p>
              <p><strong>FECHA:</strong> {ticketParaImprimir.fecha}</p>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <div><b>MESA/ORDEN:</b> {ticketParaImprimir.mesaNum}</div>
              <div><b>CLIENTE:</b> {ticketParaImprimir.cliente}</div>
              {ticketParaImprimir.tipo_servicio === 'Domicilio' || ticketParaImprimir.tipo_servicio === 'Pick Up' ? (
                <>
                  <div className="border-t border-dashed border-slate-300 my-2"></div>
                  <div style={{fontWeight:'bold', textAlign:'center', fontSize:'12px', marginBottom:'2px'}}>TIPO: {ticketParaImprimir.tipo_servicio.toUpperCase()}</div>
                  <div><b>TELÉFONO:</b> {ticketParaImprimir.telefono || 'No registrado'}</div>
                  {ticketParaImprimir.tipo_servicio === 'Domicilio' && <div><b>ENTREGAR EN:</b> {ticketParaImprimir.direccion_entrega || 'Revisar notas'}</div>}
                </>
              ) : ''}
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-dashed border-slate-300 font-bold">
                    <th className="pb-1">Cant</th><th className="pb-1">Item</th><th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketParaImprimir.platillos.map((p, i) => (
                    <tr key={`print-${p.id || i}`}><td className="py-0.5 font-bold text-slate-700 vertical-align: top;">{p.cantidad}x</td>
                      <td className="py-0.5">
                        {p.nombre} {p.esPromo ? '(Promo)' : ''}
                        {p.modificadores && p.modificadores.length > 0 ? `<div style="font-size:9px; color:#555; padding-left: 4px;">${p.modificadores.map(m => `+ ${m.nombre}`).join('<br>')}</div>` : ''}
                      </td>
                    <td className="py-0.5 text-right font-bold vertical-align: top;">${(p.precio * p.cantidad).toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <div className="flex justify-between"><span>Subtotal:</span><span>${ticketParaImprimir.subtotalBruto.toFixed(2)}</span></div>
              {ticketParaImprimir.descuento > 0 && <div className="flex justify-between font-bold text-rose-600"><span>Descuento / Cortesía:</span><span>-${ticketParaImprimir.descuento.toFixed(2)}</span></div>}
              <div className="flex justify-between"><span>I.V.A. ({config?.iva || 16}%):</span><span>${ticketParaImprimir.iva.toFixed(2)}</span></div>
              {ticketParaImprimir.propina > 0 && <div className="flex justify-between"><span>Propina Sugerida:</span><span>${ticketParaImprimir.propina.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-xs border-t border-slate-900 pt-1 mt-1"><span>TOTAL PAGADO:</span><span>${ticketParaImprimir.granTotal.toFixed(2)}</span></div>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <p className="text-center font-bold text-[10px] mb-1">MÉTODO DE PAGO UTILIZADO</p>
              {(ticketParaImprimir.desglosePago.efectivo + ticketParaImprimir.desglosePropina.efectivo) > 0 && <div className="flex justify-between text-[10px]"><span>💵 Efectivo:</span><span>$${(ticketParaImprimir.desglosePago.efectivo + ticketParaImprimir.desglosePropina.efectivo).toFixed(2)}</span></div>}
              {(ticketParaImprimir.desglosePago.tarjeta + ticketParaImprimir.desglosePropina.tarjeta) > 0 && <div className="flex justify-between text-[10px]"><span>💳 Tarjeta:</span><span>$${(ticketParaImprimir.desglosePago.tarjeta + ticketParaImprimir.desglosePropina.tarjeta).toFixed(2)}</span></div>}
              {ticketParaImprimir.divisiones > 1 && <div className="center italic text-[9px] text-slate-600 mt-2">(Cuenta dividida en ${ticketParaImprimir.divisiones} partes)</div>}
              
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              <div className="center" style={{marginTop: '10px'}}>
                <b>🧾 FACTURACIÓN EN LÍNEA</b><br/>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent((config?.link_facturacion || 'https://facturas.sabor.io/facturar/').endsWith('/') ? (config?.link_facturacion || 'https://facturas.sabor.io/facturar/') : (config?.link_facturacion || 'https://facturas.sabor.io/facturar/') + '/')}${ticketParaImprimir.folio}&margin=0`} alt="QR Factura" style={{margin: '8px 0', border: '2px solid #000', borderRadius: '8px', padding: '4px'}} /><br/>
                Escanea el código QR o ingresa a:<br/>
                <b>{config?.link_facturacion || 'https://facturas.sabor.io/facturar/'}</b><br/>
                <div style={{marginTop: '4px'}}>
                  Ticket: {ticketParaImprimir.folio}<br/>
                  Monto: ${ticketParaImprimir.granTotal.toFixed(2)}
                </div>
              </div>

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

      {/* MODAL NOTIFICACIONES COCINA Y BARRA */}
      {modalNotificacionesOpen && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans select-none">
          <div className="bg-[#0b1120] border border-emerald-900/50 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(16,185,129,0.15)] relative flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl">🛎️</span> Platos y Bebidas Listas</h2>
                <p className="text-xs text-slate-400 mt-1">Lleva estos items a su mesa y márcalos como entregados.</p>
              </div>
              <button onClick={() => setModalNotificacionesOpen(false)} className="text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors cursor-pointer shrink-0">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              {notificacionesCocina.map((notif, idxNotif) => (
                <div key={`notif-${notif.id}-${idxNotif}`} className="bg-[#050812] border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="bg-emerald-500/10 text-emerald-400 font-black px-2.5 py-1 rounded-md text-[10px] tracking-widest uppercase border border-emerald-500/20">Mesa {notif.numMesa}</span>
                      <span className="text-slate-500 text-[10px] ml-3 font-mono">Hora: {notif.horaCompletado}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-5 pl-2">
                    {notif.platillos.map((p, i) => {
                      const iconoItem = categoriasDeBarra.includes(p.categoria) ? '🍸' : '🍳';
                      return (
                        <li key={`item-${i}`} className="text-sm font-bold text-slate-200 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span> 
                          <span><span className="font-mono text-emerald-400 mr-1.5">{p.cantidad}x</span>{iconoItem} {p.nombre}{p.comentario && <span className="text-xs text-pink-400 font-normal ml-2 bg-pink-500/10 px-1.5 py-0.5 rounded">Nota: {p.comentario}</span>}</span>
                        </li>
                      );
                    })}
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
            <div className="flex flex-wrap gap-2 mb-4">
              {notasRapidasAMostrar.map((nota, i) => (
                <button key={i} onClick={() => setModalNota(prev => ({ ...prev, texto: prev.texto ? `${prev.texto}, ${nota}` : nota }))} className="bg-pink-900/30 hover:bg-pink-800/50 border border-pink-500/30 text-pink-200 px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer active:scale-95 shadow-sm">{nota}</button>
              ))}
              <button onClick={() => setModalNota(prev => ({ ...prev, texto: '' }))} className="bg-slate-900/50 hover:bg-slate-800/80 border border-slate-700/50 text-slate-400 px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer active:scale-95 shadow-sm">Limpiar 🧹</button>
            </div>
            <div className="p-0.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 mb-6 shadow-inner">
              <input type="text" autoFocus value={modalNota.texto} onChange={(e) => setModalNota({ ...modalNota, texto: e.target.value })} placeholder="Ej. sin cebolla..." className="w-full bg-[#150e18] text-pink-200 placeholder:text-pink-950 px-4 py-3 rounded-[14px] outline-none text-sm font-medium" />
            </div>
            <div className="flex justify-end gap-3 font-bold text-xs">
              <button onClick={() => setModalNota({ isOpen: false, index: -1, nombre: '', texto: '', categoria: '' })} className="px-6 py-2.5 bg-[#63224e] hover:bg-[#7a2a60] text-pink-200 rounded-full transition-colors cursor-pointer">Cancelar</button>
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
                mesasEnCurso.map((mesa, idxMesa) => {
                  const estaSeleccionada = String(mesa.id) === String(mesaActivaId);
                  const iconoServicio = mesa.tipo_servicio === 'Domicilio' ? '🛵' : (mesa.tipo_servicio === 'Pick Up' ? '🛍️' : '🪑');
                  const prefijo = mesa.tipo_servicio === 'Comedor' ? 'Mesa ' : '';
                  const textoMesa = `${iconoServicio} ${prefijo}${mesa.numMesa || '?'}${mesa.nombre ? ` (${mesa.nombre})` : ''}`;

                  return (
                    <button key={`mesa-${mesa.id}-${idxMesa}`} onClick={() => setMesaActivaId(mesa.id)} className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-black tracking-wide shrink-0 transition-all cursor-pointer ${estaSeleccionada ? `text-slate-950 shadow-lg scale-105 bg-gradient-to-r ${mesa.color || 'from-[#00d084] to-emerald-500'}` : 'bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 border border-slate-800/80'}`}>
                      <span className={`w-2 h-2 rounded-full ${estaSeleccionada ? 'bg-slate-900' : 'bg-[#00d084]'}`}></span><span>{textoMesa}</span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => setModalCRM({...modalCRM, isOpen: true})} className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 px-3.5 py-2 rounded-2xl flex items-center gap-2 transition-colors cursor-pointer text-[10px] font-black uppercase tracking-widest shadow-sm"><span>🚚</span> Envíos y Pick Up</button>
              {notificacionesCocina.length > 0 && (
                <div onClick={() => setModalNotificacionesOpen(true)} className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-2xl flex items-center gap-2 animate-pulse cursor-pointer hover:bg-emerald-500/20 transition-colors">
                  <span className="text-lg">🛎️</span><span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{notificacionesCocina.length} Listos</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 shrink-0 scrollbar-none items-center border-t border-slate-800/60 pt-3">
            {gridCategorias.map((cat, idxCat) => (
              <button key={`cat-${cat}-${idxCat}`} onClick={() => setCategoriaActiva(cat)} className={`px-5 py-2 rounded-[18px] text-xs tracking-wide transition-all cursor-pointer whitespace-nowrap ${categoriaActiva === cat ? 'bg-[#5a4bfa] text-white font-black shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white font-bold bg-transparent'}`}>{cat}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {platillosFiltrados.map((platillo, idxPlatillo) => {
              const esUrl = platillo.imagen && platillo.imagen.startsWith('http');
              const esDeBarra = categoriasDeBarra.includes(platillo.categoria);
              
              const { precioOriginal, precioFinal, promoActiva } = obtenerPrecioActual(platillo);

              return (
                <button key={`plat-${platillo.id}-${idxPlatillo}`} onClick={() => agregarPlatillo(platillo)} className={`bg-[#0b1120] border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-${esDeBarra ? 'cyan' : 'indigo'}-500/50 hover:bg-[#0f172a] transition-all group active:scale-95 min-h-[135px] relative overflow-hidden`}>
                  {promoActiva && <div className="absolute top-0 right-0 bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg shadow-lg">⭐ HAPPY HOUR</div>}
                  {esUrl ? <div className="w-14 h-14 rounded-xl overflow-hidden mb-2 shadow-md shrink-0 bg-slate-950"><img src={platillo.imagen} alt={platillo.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" /></div> : <div className="w-12 h-12 rounded-full bg-slate-900/80 flex items-center justify-center text-2xl mb-2 shrink-0 group-hover:scale-110 transition-transform">{platillo.imagen || (esDeBarra ? '🍸' : '🍽️')}</div>}
                  <h3 className="text-xs font-black text-white leading-tight">{platillo.nombre}</h3>
                  
                  {promoActiva ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-mono text-slate-500 line-through">${precioOriginal.toFixed(2)}</span>
                      <span className="text-[11px] font-mono font-black text-rose-400">${precioFinal.toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-mono font-bold text-${esDeBarra ? 'cyan' : 'indigo'}-400 mt-1`}>${precioOriginal.toFixed(2)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PANEL DERECHO: TICKET */}
      <div className="w-full md:w-80 bg-[#0a0f1d] border-l border-slate-800/80 flex flex-col h-full shrink-0">
        <div className="p-5 border-b border-slate-800/80 shrink-0 bg-[#0a0f1d] flex flex-col gap-1.5 relative overflow-hidden">
          {mesaActivaInfo?.tipo_servicio !== 'Comedor' && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>}
          <div className="flex justify-between items-start">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">{mesaActivaInfo?.tipo_servicio === 'Domicilio' ? '🛵 Domicilio' : (mesaActivaInfo?.tipo_servicio === 'Pick Up' ? '🛍️ Pick Up' : '🪑 Comedor')}</span>
            {mesaActivaInfo?.tipo_servicio !== 'Comedor' && mesaActivaInfo && <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase border border-emerald-500/30">Envío</span>}
          </div>
          <h2 className="text-xl font-black text-white truncate leading-tight">{mesaActivaInfo?.tipo_servicio !== 'Comedor' && mesaActivaInfo ? mesaActivaInfo.numMesa : (mesaActivaInfo ? `MESA #${mesaActivaInfo.numMesa}` : 'Seleccione mesa o pedido ☝️')}</h2>
          {mesaActivaInfo && mesaActivaInfo.tipo_servicio !== 'Comedor' && (
            <div className="mt-1 space-y-0.5 text-[10px] text-slate-400 font-mono">
              <p>👤 {mesaActivaInfo.nombre}</p>
              {mesaActivaInfo.telefono && <p>📞 {mesaActivaInfo.telefono}</p>}
              {mesaActivaInfo.tipo_servicio === 'Domicilio' && mesaActivaInfo.direccion_entrega && <p className="truncate">📍 {mesaActivaInfo.direccion_entrega}</p>}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-none">
          {!mesaActivaId ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 select-none opacity-40 text-center px-4"><span className="text-4xl mb-3">👆</span><p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Seleccione una orden o levante un pedido</p></div>
          ) : cuentaActual.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 select-none opacity-40"><span className="text-3xl mb-2">🍽️</span><p className="text-[10px] font-black uppercase tracking-widest">Cuenta sin pedidos</p></div>
          ) : (
            cuentaActual.map((item, index) => {
              const enviado = item.enviado || 0; const pendiente = item.cantidad - enviado; const esDeBarra = categoriasDeBarra.includes(item.categoria);
              return (
                <div key={`cuenta-${index}`} className={`bg-[#070b16] border ${esDeBarra ? 'border-cyan-900/40' : 'border-slate-800/80'} rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden`}>
                  {esDeBarra && <div className="absolute top-0 left-0 w-1 h-full bg-cyan-600/50"></div>}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <h4 className="text-xs font-black text-white leading-tight flex items-center gap-1.5">
                        {esDeBarra ? '🍸' : '🍳'} {item.nombre}
                        {item.esPromo && <span className="text-[8px] bg-rose-600/20 text-rose-400 px-1 py-0.5 rounded border border-rose-500/30 uppercase tracking-widest ml-1">Promo</span>}
                      </h4>
                      {item.modificadores && item.modificadores.length > 0 && (
                        <div className="ml-5 mt-1 space-y-0.5 mb-2">
                          {item.modificadores.map((mod, iMod) => (
                            <div key={iMod} className="text-[9px] text-slate-500 font-mono leading-tight flex justify-between">
                              <span>+ {mod.nombre}</span>
                              {mod.precio > 0 && <span className="text-emerald-500/70">+${parseFloat(mod.precio).toFixed(2)}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5 ml-5">${parseFloat(item.precioBase || item.precio).toFixed(2)} Base</p>
                    </div>
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
                  {enviado > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      <span className={`bg-${esDeBarra ? 'cyan' : 'emerald'}-500/10 text-${esDeBarra ? 'cyan' : 'emerald'}-400 text-[8px] px-1.5 py-0.2 rounded font-bold uppercase border border-${esDeBarra ? 'cyan' : 'emerald'}-500/20`}>{enviado} en {esDeBarra ? 'barra' : 'cocina'}</span>
                      {pendiente > 0 && <span className="bg-amber-500/10 text-amber-400 text-[8px] px-1.5 py-0.2 rounded font-bold uppercase border border-amber-500/20">{pendiente} por marchar</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-[#070b16] shrink-0">
          {mesaActivaId && (tienePlatillosPendientesDeMarchar || tienePlatillosListosSinEntregar) && <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-xl text-center leading-tight animate-pulse">⚠️ Bloqueo de Caja: {tienePlatillosPendientesDeMarchar ? 'Hay platillos sin marchar.' : 'Hay platillos listos sin entregar.'}</div>}
          <div className="space-y-1 mb-4 text-xs">
            <div className="flex justify-between text-slate-400 font-medium"><span>Subtotal Base</span><span className="font-mono">${subtotalBruto.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800/80 mt-1"><span>TOTAL (C/ IVA)</span><span className="font-mono text-emerald-400">${(subtotalBruto * (1 + factorIVA)).toFixed(2)}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button disabled={!mesaActivaId || cuentaActual.length === 0} onClick={handleMarcharLocal} className="py-2.5 bg-[#9a3412] hover:bg-[#c2410c] disabled:opacity-40 text-white font-black rounded-xl text-[10px] tracking-widest uppercase transition-all cursor-pointer shadow-md">🔥 MARCHAR</button>
            <button disabled={!puedeCobrarCuenta} onClick={solicitarConfirmacionCobro} className="py-2.5 bg-[#047857] hover:bg-[#059669] disabled:opacity-40 text-white font-black rounded-xl text-[10px] tracking-widest uppercase transition-all cursor-pointer shadow-md">💵 COBRAR</button>
          </div>
        </div>

      </div>
    </div>
  );
}