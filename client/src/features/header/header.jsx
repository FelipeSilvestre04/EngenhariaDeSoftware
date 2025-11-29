
import React, { useState } from 'react';

import styles from './header.module.css'; 

import themeIconPath from '../../assets/night-mode.svg';
import userIconPath from '../../assets/user.svg';
import settingsIconPath from '../../assets/settings.svg';

function Header({ onThemeToggle, theme, onLogout, user }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const profileImage = user?.picture || userIconPath;
  const getFirstName = () => {
      if (!user?.name) return "Usuário"; // Fallback se não tiver nome

      // 1. Pega apenas o primeiro nome (divide pelos espaços e pega o item 0)
      const firstName = user.name.split(' ')[0]; 
      
      // 2. Formata: Primeira letra Maiúscula + resto minúscula
      // Ex: "ABNER" vira "Abner"
      return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    };

    const displayName = getFirstName();
  const userEmail = user?.email || "email@exemplo.com";

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
                  src={profileImage}
                  alt="Sua conta" 
                  className={`${styles.avatarImage} ${
                    theme === 'dark' && !user?.picture ? styles.invert : ''
                  }`}
                />
            </div>
          </button>

          {isUserMenuOpen && (
            <div className={styles.userPopover}>
                <button className={styles.closeBtn} onClick={() => setIsUserMenuOpen(false)}>
                    &times;
                </button>

                <div className={styles.popoverContent}>
                    <div className={styles.avatarRingLarge}>
                        <img 
                          src={profileImage} // 3. Usa a imagem dinâmica aqui também
                          alt="User Profile" 
                          referrerPolicy="no-referrer" 
                          className={`${styles.avatarImage} ${
                          theme === 'dark' && !user?.picture ? styles.invert : ''
                        }`}
                        />
                    </div>

                    <h3 className={styles.userName}>
                        Olá, {displayName}!
                    </h3>
                    <p className={styles.userEmail}>{userEmail}</p>

                  <button 
                    className={styles.manageAccountBtn} 
                    onClick={onLogout}>
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