import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_EQUIPOS = gql`
  query {
    equipos {
      id
      nombre
      liga {
        nombre
      }
      jugadores {
        nombre
      }
    }
  }
`;

function ListarEquipos() {
  const { loading, error, data } = useQuery(GET_EQUIPOS);

  if (loading) return <p>Cargando equipos...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div style={styles.container}>
      <h3>Lista de Equipos</h3>
      <div style={styles.grid}>
        {data.equipos.map((equipo) => (
          <div key={equipo.id} style={styles.card}>
            <h4 style={styles.teamName}>{equipo.nombre}</h4>
            <p style={styles.league}>Liga: {equipo.liga.nombre}</p>
            <div>
              <p style={styles.playersTitle}>Jugadores:</p>
              <ul style={styles.playersList}>
                {equipo.jugadores.map((jugador, index) => (
                  <li key={index}>{jugador.nombre}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    margin: '20px 0'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px'
  },
  card: {
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  teamName: {
    marginTop: 0,
    color: '#333'
  },
  league: {
    color: '#666',
    marginBottom: '10px'
  },
  playersTitle: {
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  playersList: {
    margin: 0,
    paddingLeft: '20px'
  }
};

export default ListarEquipos;