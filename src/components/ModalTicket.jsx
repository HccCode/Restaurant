import React from 'react';

export default function ModalTicket({ isOpen, datos, onClose, onConfirm }) {
  // Si el modal está cerrado o por alguna razón no llegan los datos, no dibujamos nada (Evita el crasheo)
  if (!isOpen || !datos) return null;

  // Extraemos los datos de manera segura usando valores por defecto
  const { 
    mesa = 'N/A', 
    cliente = 'Público General', 
    items = [], 
    subtotal = 0, 
    iva = 0, 
    total = 0 
  } = datos;

  // Fecha y hora actual para el ticket
  const fechaActual = new Date().toLocaleDateString();
  const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const numeroTicket = Math.floor(Math.random() * 90000) + 10000; // Genera un folio falso para diseño

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      
      {/* Contenedor principal que simula papel de ticket térmico */}
      <div className="bg-white w-full max-w-sm rounded-lg shadow-2xl overflow-hidden text-slate-800 font-mono flex flex-col max-h-[90vh]">
        
        {/* Cabecera del Ticket */}
        <div className="p-6 pb-2 text-center shrink-0">
          <div className="w-12 h-12 bg-slate-900 rounded-full mx-auto flex items-center justify-center mb-3">
            <span className="text-white font-black text-xl font-sans">S</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900 mb-1 font-sans">Sabor.io</h2>
          <p className="text-xs text-slate-500 uppercase font-bold">Av. Gastronómica #123, Centro</p>
          <p className="text-xs text-slate-500 uppercase font-bold mb-4">Tel: (555) 123-4567</p>
          
          <div className="border-b-2 border-dashed border-slate-300 w-full mb-4"></div>
          
          <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
            <span>Ticket: #{numeroTicket}</span>
            <span>{fechaActual} {horaActual}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Mesa: {mesa}</span>
            <span className="text-right truncate max-w-[120px]">Cliente: {cliente}</span>
          </div>
          
          <div className="border-b-2 border-dashed border-slate-300 w-full mt-4"></div>
        </div>

        {/* Cuerpo del Ticket (Desglose de Platillos - Scrolleable si es muy largo) */}
        <div className="px-6 py-2 flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="font-bold py-2 w-10">CANT</th>
                <th className="font-bold py-2">DESCRIPCIÓN</th>
                <th className="font-bold py-2 text-right">IMPORTE</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 text-center font-bold align-top">{item.cantidad}</td>
                  <td className="py-2 pr-2 font-semibold uppercase text-xs leading-tight">
                    {item.nombre}
                    <div className="text-[10px] text-slate-400 font-normal">
                      ${parseFloat(item.precio).toFixed(2)} c/u
                    </div>
                  </td>
                  <td className="py-2 text-right font-bold align-top">
                    ${(parseFloat(item.precio) * item.cantidad).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pie del Ticket (Totales) */}
        <div className="p-6 pt-2 shrink-0 bg-slate-50">
          <div className="border-t-2 border-dashed border-slate-300 w-full mb-3"></div>
          
          <div className="space-y-1 text-sm font-bold text-slate-600 flex flex-col items-end">
            <div className="flex justify-between w-48">
              <span>SUBTOTAL:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48">
              <span>IVA (16%):</span>
              <span>${iva.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-300">
            <span className="text-lg font-black uppercase">Total:</span>
            <span className="text-2xl font-black">${total.toFixed(2)}</span>
          </div>

          <div className="text-center mt-6 mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase">¡Gracias por su visita!</p>
          </div>

          {/* Botones de Acción (No se imprimirán en el ticket físico real) */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200 font-sans">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
            >
              ✅ Cobrar Mesa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}