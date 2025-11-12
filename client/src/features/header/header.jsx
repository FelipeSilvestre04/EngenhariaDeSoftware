
import React from 'react';
import styles from './header.module.css'; 
import logoSia from '../../assets/SecretarIA_cut.png';

function Header({ onToggleClick }) { 
  return (

    <header className={styles.headerContainer}>

      <img src={logoSia} alt="Logo SecretarIA" className={styles.logo} />
      <p className={styles.headerTitle}>SecretarIA</p>

    </header>
    
  );
}

export default Header;