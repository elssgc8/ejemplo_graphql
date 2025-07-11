import React from 'react';
import { useSubscription } from '@apollo/client';
import { gql } from '@apollo/client';

const PARTIDO_ACTUALIZADO = gql`
  subscription {
    partidoActualizado {
      id
      golesLocal
      golesVisitante
      equipoLocal { nombre }
      equipoVisitante { nombre }
    }
  }
`;

function PartidosEnVivo() {
  const { data, loading } = useSubscription(PARTIDO_ACTUALIZADO);
  
  return (
    <div>
      <h3>⚽ Partidos en vivo</h3>
      {!loading && data && (
        <div>
          <p>
            {data.partidoActualizado.equipoLocal.nombre} {data.partidoActualizado.golesLocal} - 
            {data.partidoActualizado.golesVisitante} {data.partidoActualizado.equipoVisitante.nombre}
          </p>
        </div>
      )}
    </div>
  );
}

export default PartidosEnVivo;