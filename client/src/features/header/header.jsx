
import React, { useState } from 'react';

import styles from './header.module.css'; 

import themeIconPath from '../../assets/night-mode.svg';
import userIconPath from '../../assets/user.svg';
import settingsIconPath from '../../assets/settings.svg';

function Header({ onThemeToggle, theme }) { 
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className={styles.headerContainer}>

      <p className={styles.headerTitle}>SecretarIA</p>
      
      <div className={styles.Wrapper}>

        <div title="Mudar tema">
          <button className={styles.iconButton} onClick={onThemeToggle}>
            <img 
              src={themeIconPath} 
              alt="Tema" 
              className={`${styles.iconImage} ${theme === 'dark' ? styles.invert : ''}`}
            />
          </button>
        </div>

        <div className={styles.userContainer} title="Sua conta">
          
          <button 
            className={`${styles.iconButton} ${isUserMenuOpen ? styles.active : ''}`} 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className={styles.userAvatar}>
                <img 
                  src={userIconPath} 
                  alt="Sua conta" 
                  /* Nota: Se for uma foto real, remova o 'styles.invert'. 
                     Se continuar usando o ícone SVG preto, mantenha a lógica do invert.
                  */
                  className={`${styles.avatarImage} ${theme === 'dark' ? styles.invert : ''}`}
                />
            </div>
          </button>

          {isUserMenuOpen && (
            <div className={styles.userPopover}>
                {/* Botão de Fechar */}
                <button className={styles.closeBtn} onClick={() => setIsUserMenuOpen(false)}>
                    &times;
                </button>

                <div className={styles.popoverContent}>
                    <div className={styles.avatarRingLarge}>
                        <img 
                            src={userIconPath} 
                            alt="User Profile" 
                            className={theme === 'dark' ? styles.invert : ''}
                        />
                    </div>

                    <h3 className={styles.userName}>Hi, User!</h3>
                    <p className={styles.userEmail}>user@email.com</p>

                    <button className={styles.manageAccountBtn}>
                        Sair da Conta
                    </button>
                </div>
            </div>
          )}
        </div>

        <div title="Configurações">
          <button className={styles.iconButton}>
            <img 
              src={settingsIconPath} 
              alt="Configurações" 
              className={`${styles.iconImage} ${theme === 'dark' ? styles.invert : ''}`}
            />
          </button>
        </div>

      </div>
    </header>
  );
}

export default Header;