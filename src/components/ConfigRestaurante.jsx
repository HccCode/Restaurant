import React, { useState, useEffect } from 'react';

export default function Configuracion() {
  const [form, setForm] = useState({
    nombre_negocio: '',
    rfc: '',
    telefono: '',
    direccion: '',
    mensaje_ticket: '',
    link_facturacion: '',
    iva: 16.00
  });

  const [notificacion, setNotificacion] = useState(null);

  useEffect(() => {
    fetch(`http://${window.location.hostname}:3000/api/configuracion`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setForm({
            nombre_negocio: data.nombre_negocio || '',
            rfc: data.rfc || '',
            telefono: data.telefono || '',
            direccion: data.direccion || '',
            mensaje_ticket: data.mensaje_ticket || '',
            link_facturacion: data.link_facturacion || 'https://facturas.sabor.io/facturar/',
            iva: parseFloat(data.iva || 16.00)
          });
        }
      })
      .catch(err => console.error("Error al cargar configuración", err));
  }, []);

  const handleGuardar = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/configuracion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, iva: parseFloat(form.iva) })
      });
      if (res.ok) {
        setNotificacion('¡Configuración guardada en la impresora!');
        setTimeout(() => setNotificacion(null), 3000);
      }
    } catch (err) {
      alert("Error al guardar la configuración.");
    }
  };

  const calcularIVA = (subtotal) => {
    return subtotal * (form.iva / 100);
  };

  const subtotalFake = 1194.44;
  const ivaFake = calcularIVA(subtotalFake);
  const totalFake = subtotalFake + ivaFake;

  // Calculamos el link seguro para que el QR funcione bien incluso si olvidan poner el slash final
  const linkSeguro = form.link_facturacion.endsWith('/') ? form.link_facturacion : `${form.link_facturacion}/`;
  const qrSimulador = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(linkSeguro + 'V-1034')}&margin=0`;

  return (
    <div className="flex-1 p-6 md:p-8 bg-[#0a0f1d] min-h-screen text-slate-200 font-sans select-none overflow-y-auto">
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* PANEL IZQUIERDO: FORMULARIO */}
        <div className="w-full lg:w-2/3 bg-[#0f1524] p-6 lg:p-8 rounded-3xl border border-slate-800 relative">
          {notificacion && (
            <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider animate-fade-in shadow-lg">
              {notificacion}
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight mb-1">Memoria de Recibos</h2>
            <p className="text-xs text-slate-400">Estos datos encabezarán los tickets impresos y dictarán el cobro fiscal.</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Nombre público del restaurante</label>
              <input type="text" value={form.nombre_negocio} onChange={e => setForm({...form, nombre_negocio: e.target.value})} className="w-full bg-[#070b16] border border-slate-800 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">R.F.C. / ID Fiscal</label>
                <input type="text" value={form.rfc} onChange={e => setForm({...form, rfc: e.target.value.toUpperCase()})} className="w-full bg-[#070b16] border border-slate-800 text-white text-sm font-bold font-mono rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors uppercase" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Teléfono de reservas</label>
                <input type="text" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="w-full bg-[#070b16] border border-slate-800 text-white text-sm font-bold font-mono rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Dirección del establecimiento</label>
              <input type="text" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} className="w-full bg-[#070b16] border border-slate-800 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Frase de despedida (Pie de ticket)</label>
              <input type="text" value={form.mensaje_ticket} onChange={e => setForm({...form, mensaje_ticket: e.target.value})} className="w-full bg-[#070b16] border border-slate-800 text-slate-300 text-sm font-medium italic rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors" />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1.5 block">Link de Facturación (Auto-factura QR)</label>
              <input type="url" value={form.link_facturacion} onChange={e => setForm({...form, link_facturacion: e.target.value})} placeholder="https://facturas.mi-restaurante.com/" className="w-full bg-indigo-950/20 border border-indigo-900/50 text-indigo-200 text-sm font-mono rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div className="pt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1.5 flex items-center gap-2">
                <span>📄</span> Impuesto al Valor Agregado — I.V.A. (%)
              </label>
              <div className="relative">
                <input type="number" step="0.01" value={form.iva} onChange={e => setForm({...form, iva: e.target.value})} className="w-full bg-[#070b16] border border-emerald-900/50 text-emerald-400 text-sm font-black font-mono rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xs">%</span>
              </div>
            </div>

            <button onClick={handleGuardar} className="w-full mt-4 bg-[#5a4bfa] hover:bg-[#4b3ae6] text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
              <span>💾</span> Guardar Datos en Impresora POS
            </button>

          </div>
        </div>

        {/* PANEL DERECHO: SIMULADOR TICKET */}
        <div className="w-full lg:w-1/3 flex flex-col items-center pt-2">
          <h3 className="text-[10px] font-black text-[#5a4bfa] uppercase tracking-widest mb-4 font-mono text-center">Simulador Papel Térmico (80mm)</h3>
          
          <div className="bg-[#FAF6EE] text-[#1c1917] w-[280px] p-6 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] font-mono text-[11px] leading-relaxed relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d6d3d1] to-transparent opacity-50"></div>
            
            <div className="text-center mb-4">
              <p className="font-black text-[13px] uppercase tracking-wider mb-1 font-sans">{form.nombre_negocio || 'SABOR.IO RESTAURANTE'}</p>
              <p className="text-[9px] text-[#57534e] uppercase px-4 leading-tight">{form.direccion || 'Av. De los Héroes 123, Centro Cívico, Mexicali, B.C.'}</p>
              <p className="text-[9px] text-[#57534e] mt-2 uppercase">RFC: {form.rfc || 'XAXX010101000'}</p>
              <p className="text-[9px] text-[#57534e] uppercase">TEL: {form.telefono || '686 555 1234'}</p>
            </div>

            <div className="border-t border-dashed border-[#d6d3d1] my-3"></div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-start">
                <span className="w-4">1x</span>
                <span className="flex-1 px-1">Tomahawk Añejado</span>
                <span className="font-bold">$1,200.00</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="w-4">2x</span>
                <span className="flex-1 px-1">Limonada Mineral</span>
                <span className="font-bold">$90.00</span>
              </div>
            </div>

            <div className="border-t border-dashed border-[#d6d3d1] my-3 pt-3 flex flex-col items-end space-y-1 pr-1">
              <div className="flex justify-end gap-3 w-full"><span className="text-[#57534e]">SUBTOTAL:</span><span className="font-bold w-16 text-right">${subtotalFake.toFixed(2)}</span></div>
              <div className="flex justify-end gap-3 w-full"><span className="text-[#57534e]">IVA ({form.iva}%):</span><span className="font-bold w-16 text-right">${ivaFake.toFixed(2)}</span></div>
              <div className="flex justify-end gap-3 w-full mt-1"><span className="font-black text-[13px]">TOTAL:</span><span className="font-black text-[13px] w-16 text-right">${totalFake.toFixed(2)}</span></div>
            </div>

            <div className="border-t border-dashed border-[#d6d3d1] my-3"></div>

            {/* SIMULACIÓN DEL CÓDIGO QR GENERADO */}
            <div className="text-center font-sans">
              <p className="font-bold text-[10px] uppercase">🧾 Facturación en Línea</p>
              <div className="flex justify-center my-2">
                <img src={qrSimulador} alt="QR Facturacion Simulado" className="w-24 h-24 border-2 border-[#1c1917] p-1 rounded-lg opacity-90 mix-blend-multiply" />
              </div>
              <p className="text-[9px] text-[#57534e]">Escanea el QR o ingresa a:</p>
              <p className="text-[9px] font-bold mt-0.5">{form.link_facturacion || 'facturas.sabor.io'}</p>
            </div>

            <div className="border-t border-dashed border-[#d6d3d1] my-3"></div>

            <div className="text-center italic text-[#57534e] text-[10px] mt-4 px-2 leading-tight font-serif">
              {form.mensaje_ticket || '¡Gracias por su preferencia! Vuelva pronto.'}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}