import React from 'react';
import './TablaReservaciones.css'; // Aquí importamos el CSS para el Sticky Header

export default function TablaReservaciones() {
  // Datos de ejemplo que normalmente vendrían de tu base de datos
  const reservas = [
    { id: 1, nombre: 'Familia Martínez', hora: '14:00', personas: 4, estado: 'Confirmada' },
    { id: 2, nombre: 'Cena de Negocios', hora: '15:30', personas: 2, estado: 'En espera' },
    { id: 3, nombre: 'Cumpleaños Sofía', hora: '19:00', personas: 8, estado: 'Confirmada' },
    { id: 4, nombre: 'Aniversario', hora: '20:15', personas: 2, estado: 'Cancelada' },
    { id: 5, nombre: 'Mesa Amigos', hora: '21:00', personas: 6, estado: 'Confirmada' },
    // Imagina 20 registros más aquí...
  ];

  return (
    <div className="contenedor-scroll-tabla">
      <table className="tabla-moderna w-full text-left border-collapse">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Hora</th>
            <th>Pax</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((reserva) => (
            <tr key={reserva.id}>
              <td>{reserva.nombre}</td>
              <td>{reserva.hora}</td>
              <td>{reserva.personas}</td>
              <td>
                <span className={`badge ${reserva.estado.replace(' ', '-').toLowerCase()}`}>
                  {reserva.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}