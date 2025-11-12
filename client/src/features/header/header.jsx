// client/src/features/header/Header.jsx

import React from 'react';
import styles from './header.module.css'; // Importe seu CSS Module

// Lembre-se de receber a 'onToggleClick' que o App.jsx enviou
function Header({ onToggleClick }) { 
  return (
    <header className={styles.headerContainer}>
      
      {/* Botão da esquerda */}
      <button onClick={onToggleClick} className={styles.toggleButton}>
        ☰
      </button>

      {/* A seção da direita com o logo e perfil foi removida */}
      
    </header>
  );
}

export default Header;