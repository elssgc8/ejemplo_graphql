import React from 'react';
import CrearJugador from './CrearJugador';
import BorrarJugador from './BorrarJugador';
import AgregarEquipo from './AgregarEquipo';
import ActualizarPartido from './ActualizarPartido';
import ListarEquipos from './ListarEquipos';
import PartidosEnVivo from './PartidosEnVivo';

function AdminPanel() {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Panel de Administración de Torneos</h2>
      
      <div style={styles.grid}>
        <div style={styles.column}>
          <CrearJugador />
          <BorrarJugador />
        </div>
        
        <div style={styles.column}>
          <AgregarEquipo />
          <ListarEquipos />
        </div>
        
        <div style={styles.column}>
          <ActualizarPartido />
          <PartidosEnVivo />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '20px'
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  }
};

export default AdminPanel;