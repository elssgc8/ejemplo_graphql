const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { Pool } = require('pg');
const cors = require('cors');

// Conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'torneos_futbol',
  password: 'elss',
  port: 5432,
});

// Schema de GraphQL
const typeDefs = gql`
  type Jugador {
    id: Int!
    nombre: String!
    posicion: String
    equipo: String
  }

  type Query {
    jugadores: [Jugador]!
  }
`;

// Resolvers de GraphQL
const resolvers = {
  Query: {
    jugadores: async () => {
      const { rows } = await pool.query('SELECT * FROM jugadores');
      return rows;
    },
  },
};

// Configura Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });
const app = express();

// Configurar CORS
app.use(cors({
  origin: 'http://localhost:3000', // Permite peticiones desde el frontend
  credentials: true // Permite cookies y headers de autenticación
}));

// Función para iniciar el servidor
async function startServer() {
  await server.start();
  server.applyMiddleware({ app });
  
  // Ruta REST (para comparar)
  app.get('/api/jugadores', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM jugadores');
    res.json(rows);
  });
  
  // Inicia el servidor
  app.listen({ port: 4000 }, () => {
    console.log(`Servidor listo en http://localhost:4000${server.graphqlPath}`);
    console.log(`REST API en http://localhost:4000/api/jugadores`);
  });
}

// Ejecuta el servidor
startServer().catch(error => {
  console.error('Error al iniciar el servidor:', error);
});
