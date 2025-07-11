import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client";
import { GET_EQUIPOS } from "./BorrarJugador";

const CREAR_JUGADOR = gql`
  mutation CrearJugador($nombre: String!, $posicion: String, $equipoId: Int!) {
    crearJugador(nombre: $nombre, posicion: $posicion, equipoId: $equipoId) {
      id
      nombre
    }
  }
`;

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


function CrearJugador() {
  // Valor por defecto
  const [nombre, setNombre] = useState("");
  const [posicion, setPosicion] = useState("");
  const [equipoId, setEquipoId] = useState("");

  const { loading, error, data } = useQuery(GET_EQUIPOS);
  const [crearJugador] = useMutation(CREAR_JUGADOR, {
    refetchQueries: [{ query: GET_JUGADORES }, { query: GET_EQUIPOS }],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !equipoId) return; // Validación básica

    crearJugador({
      variables: {
        nombre,
        posicion: posicion || null, // Si no hay posición, envía null
        equipoId: parseInt(equipoId),
      },
    }).then(() => {
      // Limpiar el formulario después de enviar
      setNombre("");
      setPosicion("");
      setEquipoId("");
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "300px",
      }}
    >
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Posición (opcional)"
        value={posicion}
        onChange={(e) => setPosicion(e.target.value)}
      />
      <select 
        value={equipoId} 
        onChange={(e) => setEquipoId(e.target.value)}
        required
      >
        <option value="">Selecciona equipo</option>
        {data?.equipos.map((equipo) => (
          <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
        ))}
      </select>
      <button type="submit">Crear jugador</button>
    </form>
  );
}

export default CrearJugador;
