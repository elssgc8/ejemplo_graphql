import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_JUGADORES = gql`
  query {
    jugadores {
      id
      nombre
      equipo {
        nombre
      }
    }
  }
`;

const BORRAR_JUGADOR = gql`
  mutation borrarJugador($id: Int!) {
    borrarJugador(id: $id) {
      id
      nombre
    }
  }
`;

export const GET_EQUIPOS = gql`
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

function BorrarJugador() {
  const { loading, error, data } = useQuery(GET_JUGADORES);
  const [borrarJugador] = useMutation(BORRAR_JUGADOR, {
    refetchQueries: [{ query: GET_JUGADORES }, { query: GET_EQUIPOS }]
  });

  const [mensaje, setMensaje] = useState('');

  const handleBorrar = async (id) => {
    try {
      await borrarJugador({ variables: { id } });
      setMensaje('Jugador borrado exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setMensaje(`Error: ${err.message}`);
    }
  };

  if (loading) return <p>Cargando jugadores...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div style={styles.container}>
      <h3>Borrar Jugadores</h3>
      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}
      <ul style={styles.list}>
        {data.jugadores.map((jugador) => (
          <li key={jugador.id} style={styles.listItem}>
            {jugador.nombre} ({jugador.equipo.nombre})
            <button 
              onClick={() => handleBorrar(jugador.id)}
              style={styles.deleteButton}
            >
              Borrar
            </button>
          </li>
        ))}
      </ul>
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
  list: {
    listStyle: 'none',
    padding: 0
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #eee'
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  mensaje: {
    color: '#4CAF50',
    fontWeight: 'bold'
  }
};

export default BorrarJugador;