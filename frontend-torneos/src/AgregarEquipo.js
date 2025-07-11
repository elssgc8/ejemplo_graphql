import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const CREAR_EQUIPO = gql`
  mutation CrearEquipo($nombre: String!, $ligaId: Int!) {
    crearEquipo(nombre: $nombre, ligaId: $ligaId) {
      id
      nombre
    }
  }
`;

const GET_LIGAS = gql`
  query {
    ligas {
      id
      nombre
    }
  }
`;

function AgregarEquipo() {
  const [nombre, setNombre] = useState('');
  const [ligaId, setLigaId] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [crearEquipo] = useMutation(CREAR_EQUIPO, {
    refetchQueries: ['GetEquipos', 'GetLigas']
  });

  const { loading, error, data } = useQuery(GET_LIGAS);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearEquipo({ variables: { nombre, ligaId: parseInt(ligaId) } });
      setMensaje('Equipo creado exitosamente');
      setNombre('');
      setLigaId('');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setMensaje(`Error: ${err.message}`);
    }
  };

  if (loading) return <p>Cargando ligas...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div style={styles.container}>
      <h3>Agregar Nuevo Equipo</h3>
      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Nombre del equipo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={styles.input}
          required
        />
        <select
          value={ligaId}
          onChange={(e) => setLigaId(e.target.value)}
          style={styles.select}
          required
        >
          <option value="">Selecciona una liga</option>
          {data.ligas.map((liga) => (
            <option key={liga.id} value={liga.id}>
              {liga.nombre}
            </option>
          ))}
        </select>
        <button type="submit" style={styles.button}>
          Crear Equipo
        </button>
      </form>
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  button: {
    padding: '8px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  mensaje: {
    color: '#4CAF50',
    fontWeight: 'bold'
  }
};

export default AgregarEquipo;