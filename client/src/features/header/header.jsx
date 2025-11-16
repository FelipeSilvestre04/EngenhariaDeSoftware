
import React from 'react';
import styles from './header.module.css'; 
import logoSia from '../../assets/SecretarIA_cut.png';
import imgpath from '../../assets/settings.png';
import userpath from '../../assets/user.png';
import themepath from '../../assets/night-mode.png';

function Header({ onToggleClick }) { 
  return (

    <header className={styles.headerContainer}>

      <img src={logoSia} alt="Logo SecretarIA" className={styles.logo} />
      <p className={styles.headerTitle}>SecretarIA</p>
      
      <div className={styles.Wrapper}>

        <div title="Tema escuro">
          <button className={styles.theme}>
            <img src={themepath} alt="Tema escuro"></img>
          </button>
        </div>

      <div title="Sua conta">
          <button className={styles.account}>
            <img src={userpath} alt="Sua conta"></img>
          </button>
        </div>

        <div title="Configurações">
          <button className={styles.Settings}>
            <img src={imgpath} alt="Configurações"></img>
          </button>
        </div>

      </div>

    </header>
    
  );
}

export default Header;