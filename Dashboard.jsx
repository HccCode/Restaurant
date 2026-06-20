import React, { useState, useEffect } from 'react';
import TablaReservaciones from './TablaReservaciones';
import TarjetaEstadistica from './TarjetaEstadistica';
// import { BarChart, Bar, XAxis, Tooltip } from 'recharts';

export default function Dashboard() {
  const [estadisticas, setEstadisticas] = useState({
    ocupacion: '75%',
    reservasHoy: 42,
    tiempoPromedio: '1h 15m'
  });

  return (
    <div className="dashboard-container p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Panel de Estadísticas</h1>
      
      {/* KPIs */}
      <div className="grid-kpi flex gap-4 mb-8">
        <TarjetaEstadistica titulo="Ocupación Actual" valor={estadisticas.ocupacion} />
        <TarjetaEstadistica titulo="Reservas Hoy" valor={estadisticas.reservasHoy} />
        <TarjetaEstadistica titulo="Tiempo Promedio" valor={estadisticas.tiempoPromedio} />
      </div>

      <div className="seccion-principal flex flex-col md:flex-row gap-6">
        {/* Gráfica (Placeholder) */}
        <div className="grafica-container flex-1 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Flujo de Clientes</h2>
          <div className="placeholder-grafica h-64 bg-gray-100 flex items-center justify-center">
            {/* Aquí iría el componente <BarChart> */}
            <span className="text-gray-400">Gráfica de Horarios Pico</span>
          </div>
        </div>

        {/* Tabla con Sticky Headers */}
        <div className="tabla-container flex-1 bg-white p-4 rounded shadow overflow-hidden">
          <h2 className="text-xl font-semibold mb-4">Próximas Reservaciones</h2>
          <TablaReservaciones />
        </div>
      </div>
    </div>
  );
}