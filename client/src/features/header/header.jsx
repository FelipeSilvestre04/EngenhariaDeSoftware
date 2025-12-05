
import React, { useState } from 'react';

import styles from './header.module.css'; 

import themeIconPath from '../../assets/night-mode.svg';
import userIconPath from '../../assets/user.svg';
import settingsIconPath from '../../assets/settings.svg';

function Header({ onThemeToggle, theme, onLogout, user }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const profileImage = user?.picture || userIconPath;
  const getFirstName = () => {
      if (!user?.name) return "Usuário";

      const firstName = user.name.split(' ')[0]; 
      
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
                          src={profileImage} 
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
                    className={styles.AccountBtn} 
                    onClick={onLogout}>
                    Sair da Conta
                </button>

                  <button 
                    className={styles.DeleteAccountBtn} 
                    /*onClick={onLogout}  /*Placeholder para deletar conta*/>   
                    Excluir Conta
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