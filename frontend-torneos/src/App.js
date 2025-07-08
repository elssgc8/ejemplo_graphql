import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import axios from "axios";
import { gql } from "@apollo/client";

// Query de GraphQL
const GET_JUGADORES = gql`
  query {
    jugadores {
      nombre
      equipo
    }
  }
`;

function App() {
  // Fetch con GraphQL
  const { loading, error, data } = useQuery(GET_JUGADORES);

  // Fetch con REST
  const [jugadoresRest, setJugadoresRest] = useState([]);
  useEffect(() => {
    axios.get("http://localhost:4000/api/jugadores").then((res) => {
      setJugadoresRest(res.data);
    });
  }, []);

  return (
    <div style={{ display: "flex" }}>
      {/* Sección GraphQL */}
      <div style={{ flex: 1, padding: "20px", borderRight: "1px solid #ccc" }}>
        <h2>GraphQL</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <ul>
            {data?.jugadores.map((jugador) => (
              <li key={jugador.id}>
                {jugador.nombre} - {jugador.equipo}
              </li>
            ))}
          </ul>
        )}

        <h2>GraphQL full response</h2>
        <ul>
          {data?.jugadores.map((jugador) => (
            <li key={jugador.id}>{JSON.stringify(jugador)}</li>
          ))}
        </ul>
      </div>

      {/* Sección REST */}
      <div style={{ flex: 1, padding: "20px" }}>
        <h2>REST</h2>
        <ul>
          {jugadoresRest.map((jugador) => (
            <li key={jugador.id}>
              {jugador.nombre} - {jugador.equipo}
            </li>
          ))}
        </ul>

        <h2>REST full response</h2>
        <ul>
          {jugadoresRest.map((jugador) => (
            <li key={jugador.id}>{JSON.stringify(jugador)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
