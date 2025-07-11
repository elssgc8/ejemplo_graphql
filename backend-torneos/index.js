const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { Pool } = require('pg');
const cors = require('cors');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();

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
    equipo: Equipo!
  }

  type Equipo {
    id: Int!
    nombre: String!
    liga: Liga!
    jugadores: [Jugador]!
  }

  type Liga {
    id: Int!
    nombre: String!
    pais: String
    equipos: [Equipo]!
    torneos: [Torneo]!
  }

  type Torneo {
    id: Int!
    nombre: String!
    liga: Liga!
    fechaInicio: String
    fechaFin: String
    partidos: [Partido]!
  }

  type Partido {
    id: Int!
    torneo: Torneo!
    equipoLocal: Equipo!
    equipoVisitante: Equipo!
    fecha: String!
    golesLocal: Int
    golesVisitante: Int
  }

  type Query {
    jugadores: [Jugador]!
    equipos: [Equipo]!
    partidos: [Partido]!
    ligas: [Liga]!
  }

  type Mutation {
    crearJugador(nombre: String!, posicion: String, equipoId: Int!): Jugador
    actualizarGolesPartido(id: Int!, golesLocal: Int!, golesVisitante: Int!): Partido
    borrarJugador(id: Int!): Jugador  # <-- Añade esta línea
    crearEquipo(nombre: String!, ligaId: Int!): Equipo
    crearLiga(nombre: String!, pais: String): Liga
    crearTorneo(nombre: String!, ligaId: Int!, fechaInicio: String, fechaFin: String): Torneo
    crearPartido(
      torneoId: Int!
      equipoLocalId: Int!
      equipoVisitanteId: Int!
      fecha: String!
    ): Partido
    actualizarJugador(
      id: Int!
      nombre: String
      posicion: String
      equipoId: Int
    ): Jugador
    borrarEquipo(id: Int!): Equipo
  }

  type Subscription {
    partidoActualizado: Partido!
  }
`;

// Resolvers de GraphQL
const resolvers = {
  Query: {
    jugadores: async () => (await pool.query('SELECT * FROM jugadores')).rows,
    equipos: async () => (await pool.query('SELECT * FROM equipos')).rows,
    ligas: async () => (await pool.query('SELECT * FROM ligas')).rows,
    partidos: async () => (await pool.query(`
      SELECT p.*, 
        t.nombre as torneo_nombre,
        el.nombre as equipo_local_nombre,
        ev.nombre as equipo_visitante_nombre
      FROM partidos p
      JOIN torneos t ON p.torneo_id = t.id
      JOIN equipos el ON p.equipo_local_id = el.id
      JOIN equipos ev ON p.equipo_visitante_id = ev.id
    `)).rows,
  },
  Mutation: {
  crearJugador: async (_, { nombre, posicion, equipoId }) => {
    const { rows } = await pool.query(
      'INSERT INTO jugadores (nombre, posicion, equipo_id) VALUES ($1, $2, $3) RETURNING *',
      [nombre, posicion, equipoId]
    );
    return rows[0];
  },

  actualizarGolesPartido: async (_, { id, golesLocal, golesVisitante }) => {
    const { rows } = await pool.query(
      'UPDATE partidos SET goles_local = $1, goles_visitante = $2 WHERE id = $3 RETURNING *',
      [golesLocal, golesVisitante, id]
    );
    pubsub.publish('PARTIDO_ACTUALIZADO', { partidoActualizado: rows[0] });
    return rows[0];
  },
  crearEquipo: async (_, { nombre, ligaId }) => {
    const { rows } = await pool.query(
      'INSERT INTO equipos (nombre, liga_id) VALUES ($1, $2) RETURNING *',
      [nombre, ligaId]
    );
    return rows[0];
  },
  borrarJugador: async (_, { id }) => {
    const { rows } = await pool.query(
      'DELETE FROM jugadores WHERE id = $1 RETURNING *',
      [id]
    );
    if (rows.length === 0) {
      throw new Error(`Jugador con ID ${id} no encontrado`);
    }
    return rows[0];
  },
  crearLiga: async (_, { nombre, pais }) => {
    const { rows } = await pool.query(
      'INSERT INTO ligas (nombre, pais) VALUES ($1, $2) RETURNING *',
      [nombre, pais]
    );
    return rows[0];
  },
  crearTorneo: async (_, { nombre, ligaId, fechaInicio, fechaFin }) => {
    const { rows } = await pool.query(
      'INSERT INTO torneos (nombre, liga_id, fecha_inicio, fecha_fin) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, ligaId, fechaInicio, fechaFin]
    );
    return rows[0];
  },
  crearPartido: async (_, { torneoId, equipoLocalId, equipoVisitanteId, fecha }) => {
    // Validar que los equipos sean diferentes
    if (equipoLocalId === equipoVisitanteId) {
      throw new Error('Un equipo no puede jugar contra sí mismo');
    }

    const { rows } = await pool.query(
      `INSERT INTO partidos 
       (torneo_id, equipo_local_id, equipo_visitante_id, fecha) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [torneoId, equipoLocalId, equipoVisitanteId, fecha]
    );
    return rows[0];
  },
  actualizarJugador: async (_, { id, nombre, posicion, equipoId }) => {
    const { rows } = await pool.query(
      `UPDATE jugadores 
       SET nombre = COALESCE($2, nombre), 
           posicion = COALESCE($3, posicion), 
           equipo_id = COALESCE($4, equipo_id)
       WHERE id = $1 RETURNING *`,
      [id, nombre, posicion, equipoId]
    );
    if (rows.length === 0) {
      throw new Error(`Jugador con ID ${id} no encontrado`);
    }
    return rows[0];
  },
  borrarEquipo: async (_, { id }) => {
    // Verificar si el equipo tiene jugadores
    const { rows: jugadores } = await pool.query(
      'SELECT id FROM jugadores WHERE equipo_id = $1 LIMIT 1',
      [id]
    );
    
    if (jugadores.length > 0) {
      throw new Error('No se puede borrar el equipo porque tiene jugadores asignados');
    }

    const { rows } = await pool.query(
      'DELETE FROM equipos WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (rows.length === 0) {
      throw new Error(`Equipo con ID ${id} no encontrado`);
    }
    return rows[0];
  }
},
  Subscription: {
    partidoActualizado: {
      subscribe: () => pubsub.asyncIterator(['PARTIDO_ACTUALIZADO']),
    },
  },
  // Resolvers para relaciones
  Jugador: {
    equipo: async (parent) => (await pool.query('SELECT * FROM equipos WHERE id = $1', [parent.equipo_id])).rows[0],
  },
  Equipo: {
    liga: async (parent) => (await pool.query('SELECT * FROM ligas WHERE id = $1', [parent.liga_id])).rows[0],
    jugadores: async (parent) => (await pool.query('SELECT * FROM jugadores WHERE equipo_id = $1', [parent.id])).rows,
  },
  Liga: {
    equipos: async (parent) => (await pool.query('SELECT * FROM equipos WHERE liga_id = $1', [parent.id])).rows,
    torneos: async (parent) => (await pool.query('SELECT * FROM torneos WHERE liga_id = $1', [parent.id])).rows,
  },
  Torneo: {
    partidos: async (parent) => (await pool.query('SELECT * FROM partidos WHERE torneo_id = $1', [parent.id])).rows,
  },
};

async function startApolloServer() {
  const app = express();
  
  // Configura CORS PRIMERO, antes de Apollo
  app.use(cors({
    origin: [
      'http://localhost:3000', // Frontend React
      'https://studio.apollographql.com', // Apollo Sandbox
      'http://studio.apollographql.com' // Alternativa
    ],
    credentials: true
  }));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Habilita introspection para Apollo Studio
    playground: true // Habilita GraphQL Playground
  });

  await server.start();
  server.applyMiddleware({ 
    app,
    cors: false // Desactiva CORS de Apollo porque ya lo manejamos con express
  });

// ======================
  // ENDPOINTS REST COMPLETOS
  // ======================

  // 1. Endpoints básicos (CRUD)
  app.get('/api/jugadores', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT j.*, e.nombre as equipo_nombre 
      FROM jugadores j
      LEFT JOIN equipos e ON j.equipo_id = e.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

  app.get('/api/equipos', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM equipos');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/ligas', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM ligas');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/torneos', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM torneos');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/partidos', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT p.*, 
          t.nombre as torneo_nombre,
          el.nombre as equipo_local_nombre,
          ev.nombre as equipo_visitante_nombre
        FROM partidos p
        JOIN torneos t ON p.torneo_id = t.id
        JOIN equipos el ON p.equipo_local_id = el.id
        JOIN equipos ev ON p.equipo_visitante_id = ev.id
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Endpoints para relaciones (equivalentes a las resoluciones en GraphQL)
  app.get('/api/jugadores/:id/equipo', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT e.* FROM equipos e JOIN jugadores j ON e.id = j.equipo_id WHERE j.id = $1',
        [req.params.id]
      );
      res.json(rows[0] || null);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/equipos/:id/liga', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT l.* FROM ligas l JOIN equipos e ON l.id = e.liga_id WHERE e.id = $1',
        [req.params.id]
      );
      res.json(rows[0] || null);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/equipos/:id/jugadores', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM jugadores WHERE equipo_id = $1',
        [req.params.id]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/ligas/:id/equipos', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM equipos WHERE liga_id = $1',
        [req.params.id]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/ligas/:id/torneos', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM torneos WHERE liga_id = $1',
        [req.params.id]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/torneos/:id/partidos', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM partidos WHERE torneo_id = $1',
        [req.params.id]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Endpoints combinados (equivalente a queries anidadas en GraphQL)
  app.get('/api/jugadores-completos/:id', async (req, res) => {
    try {
      // Obtener jugador
      const jugador = (await pool.query(
        'SELECT * FROM jugadores WHERE id = $1',
        [req.params.id]
      )).rows[0];

      if (!jugador) {
        return res.status(404).json({ error: 'Jugador no encontrado' });
      }

      // Obtener equipo del jugador
      const equipo = (await pool.query(
        'SELECT * FROM equipos WHERE id = $1',
        [jugador.equipo_id]
      )).rows[0];

      // Obtener liga del equipo
      const liga = (await pool.query(
        'SELECT * FROM ligas WHERE id = $1',
        [equipo.liga_id]
      )).rows[0];

      // Respuesta combinada
      res.json({
        ...jugador,
        equipo: {
          ...equipo,
          liga
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Mutaciones (POST, PUT, DELETE)
  app.post('/api/jugadores', async (req, res) => {
    try {
      const { nombre, posicion, equipoId } = req.body;
      const { rows } = await pool.query(
        'INSERT INTO jugadores (nombre, posicion, equipo_id) VALUES ($1, $2, $3) RETURNING *',
        [nombre, posicion, equipoId]
      );
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/partidos/:id/goles', async (req, res) => {
    try {
      const { golesLocal, golesVisitante } = req.body;
      const { rows } = await pool.query(
        'UPDATE partidos SET goles_local = $1, goles_visitante = $2 WHERE id = $3 RETURNING *',
        [golesLocal, golesVisitante, req.params.id]
      );
      
      // Notificar a los suscriptores (simulación de subscription)
      // En REST no hay equivalente real, esto es solo para demostración
      pubsub.publish('PARTIDO_ACTUALIZADO', { partidoActualizado: rows[0] });
      
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Inicia el servidor
  app.listen({ port: 4000 }, () => {
    console.log(`🚀 Servidor GraphQL en http://localhost:4000${server.graphqlPath}`);
    console.log(`📡 Subscriptions listas en ws://localhost:4000${server.graphqlPath}`);
    console.log(`🔗 REST API disponible en múltiples endpoints:`);
    console.log(`   - GET /api/jugadores`);
    console.log(`   - GET /api/equipos`);
    console.log(`   - GET /api/ligas`);
    console.log(`   - GET /api/partidos`);
    console.log(`   - GET /api/jugadores-completos/:id`);
    console.log(`   - POST /api/jugadores`);
    console.log(`   - PUT /api/partidos/:id/goles`);
  });
}

startApolloServer().catch(err => console.error(err));