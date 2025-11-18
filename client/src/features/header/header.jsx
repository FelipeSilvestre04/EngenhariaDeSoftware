
import styles from './header.module.css'; 

import themeIconPath from '../../assets/night-mode.svg';
import userIconPath from '../../assets/user.svg';
import settingsIconPath from '../../assets/settings.svg';

function Header({ onThemeToggle, theme }) { 
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

        <div title="Sua conta">
          <button className={styles.iconButton}>
            <img 
              src={userIconPath} 
              alt="Sua conta" 
              className={`${styles.iconImage} ${theme === 'dark' ? styles.invert : ''}`}
            />
          </button>
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