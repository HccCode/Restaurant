import React from 'react';

export default function ModalCorteZ({ isOpen, onClose, onConfirm, datos }) {
  if (!isOpen || !datos) return null;

  const { mesasCobradas, totalVentas, subtotalGeneral, ivaGeneral, ticketPromedio } = datos;

  const handleImprimirYCerrarTurno = () => {
    window.print();
    onConfirm(); // Borra las mesas del turno e inicia el siguiente
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      
      {/* AISLAMIENTO DE IMPRESIÓN FISICA: Solo el ticket sale por la ticketera */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #corte-z-imprimible, #corte-z-imprimible * { visibility: visible !important; }
          #corte-z-imprimible { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 80mm; 
            padding: 12px; 
            margin: 0; 
            box-shadow: none; 
            border: none; 
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 bg-rose-950/30 border-b border-rose-900/40 flex justify-between items-center shrink-0">
          <span className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Reporte de Auditoría: Corte Z
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* ================= TICKET TÉRMICO DE CIERRE DE CAJA ================= */}
        <div 
          id="corte-z-imprimible" 
          className="bg-[#fcfdfa] text-slate-950 p-6 font-mono text-xs overflow-y-auto flex-1 shadow-inner select-none mx-4 my-4 rounded-xl border border-slate-300"
        >
          {/* Cabecera Fiscal */}
          <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
            <h2 className="font-black text-sm tracking-tight uppercase">Sabor.io Prime Steakhouse</h2>
            <p className="text-[10px] text-slate-700">RFC: OGN200626MXL</p>
            <p className="text-[10px] text-slate-600">Blvd. Benito Juárez #1234, Mexicali, B.C.</p>
            <div className="mt-2 bg-slate-950 text-white text-[10px] font-black py-1 px-3 uppercase tracking-widest inline-block rounded">
              Corte Z Num: #{Math.floor(100 + Math.random() * 900)}
            </div>
          </div>

          {/* Metadata del Cierre */}
          <div className="py-3 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span><strong>FECHA:</strong> {new Date().toLocaleDateString('es-MX')}</span>
              <span><strong>HORA:</strong> {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="flex justify-between">
              <span><strong>TURNO:</strong> Cierre de Turno 1</span>
              <span><strong>AUDITOR:</strong> Gerente General</span>
            </div>
          </div>

          {/* RESUMEN OPERATIVO DE SALA */}
          <div className="py-3 border-b border-dashed border-slate-400 space-y-2">
            <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Métricas de Turno</span>
            <div className="flex justify-between items-center text-[11px]">
              <span>Mesas Cerradas:</span>
              <span className="font-bold">{mesasCobradas} Cuentas</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span>Ticket Promedio por Mesa:</span>
              <span className="font-bold">${ticketPromedio.toFixed(2)}</span>
            </div>
          </div>

          {/* DESGLOSE FINANCIERO LEGAL */}
          <div className="py-4 space-y-2 border-b-2 border-slate-900">
            <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Auditoría Financiera</span>
            
            <div className="flex justify-between text-[11px] text-slate-700">
              <span>VENTAS BRUTAS:</span>
              <span>${totalVentas.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-700">
              <span>BASE IMPONIBLE:</span>
              <span>${subtotalGeneral.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-700">
              <span>IVA ACUMULADO (16%):</span>
              <span>${ivaGeneral.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-300 mt-2 text-slate-950">
              <span>TOTAL NETO:</span>
              <span>${totalVentas.toFixed(2)}</span>
            </div>
          </div>

          {/* Firmas de Auditoría */}
          <div className="pt-8 text-center space-y-12">
            <div className="border-t border-slate-400 w-32 mx-auto pt-1 text-[10px] text-slate-600 font-sans">
              Firma Cajero
            </div>
            <div className="border-t border-slate-400 w-32 mx-auto pt-1 text-[10px] text-slate-600 font-sans">
              Firma Auditor/Gerente
            </div>
            <div className="text-[8.5px] text-slate-400 text-center font-mono pt-4 border-t border-slate-200">
              CIERRE DE ARCHIVO LOCAL MEMORY AUTORIZADO - REGISTRO DE CAJA RESTAURADO
            </div>
          </div>

        </div>

        {/* Botones de Control */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
            Cancelar
          </button>
          
          <button 
            onClick={handleImprimirYCerrarTurno}
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(225,29,72,0.4)] cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Imprimir Corte Z y Bloquear Caja
          </button>
        </div>

      </div>
    </div>
  );
}