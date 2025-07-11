import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_PARTIDOS = gql`
  query {
    partidos {
      id
      equipoLocal { nombre }
      equipoVisitante { nombre }
      golesLocal
      golesVisitante
    }
  }
`;

const ACTUALIZAR_PARTIDO = gql`
  mutation ActualizarPartido(
    $id: Int!
    $golesLocal: Int!
    $golesVisitante: Int!
  ) {
    actualizarGolesPartido(
      id: $id
      golesLocal: $golesLocal
      golesVisitante: $golesVisitante
    ) {
      id
      golesLocal
      golesVisitante
    }
  }
`;

function ActualizarPartido() {
  const { loading, error, data } = useQuery(GET_PARTIDOS);
  const [actualizarPartido] = useMutation(ACTUALIZAR_PARTIDO);
  const [editingId, setEditingId] = useState(null);
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [mensaje, setMensaje] = useState('');

  const handleEdit = (partido) => {
    setEditingId(partido.id);
    setGolesLocal(partido.golesLocal);
    setGolesVisitante(partido.golesVisitante);
  };

  const handleUpdate = async () => {
    try {
      await actualizarPartido({
        variables: {
          id: editingId,
          golesLocal: parseInt(golesLocal),
          golesVisitante: parseInt(golesVisitante)
        }
      });
      setMensaje('Partido actualizado exitosamente');
      setEditingId(null);
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setMensaje(`Error: ${err.message}`);
    }
  };

  if (loading) return <p>Cargando partidos...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div style={styles.container}>
      <h3>Actualizar Resultados de Partidos</h3>
      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Partido</th>
            <th>Resultado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.partidos.map((partido) => (
            <tr key={partido.id}>
              <td>
                {partido.equipoLocal.nombre} vs {partido.equipoVisitante.nombre}
              </td>
              <td>
                {editingId === partido.id ? (
                  <div style={styles.editForm}>
                    <input
                      type="number"
                      value={golesLocal}
                      onChange={(e) => setGolesLocal(e.target.value)}
                      style={styles.input}
                    />
                    <span> - </span>
                    <input
                      type="number"
                      value={golesVisitante}
                      onChange={(e) => setGolesVisitante(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                ) : (
                  `${partido.golesLocal} - ${partido.golesVisitante}`
                )}
              </td>
              <td>
                {editingId === partido.id ? (
                  <button onClick={handleUpdate} style={styles.saveButton}>
                    Guardar
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(partido)}
                    style={styles.editButton}
                  >
                    Editar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  editForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  input: {
    width: '50px',
    padding: '5px',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  editButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  saveButton: {
    backgroundColor: '#4CAF50',
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

export default ActualizarPartido;