import React, { useState } from 'react'
import styles from './ProjectChatToggle.module.css'
import { ChatWindow } from '../chat/ChatWindow'
import ChatIconPath from '../../assets/chat.svg';

export default function ProjectChatToggle({ projectName, theme}) {
  const [open, setOpen] = useState(false)

  const currentTheme = typeof theme === 'object' ? theme.theme : theme;

  return (
    <div className={styles.chatToggleContainer} aria-live="polite">
      {open && (
        <div className={styles.chatPanel}>
          <ChatWindow theme={theme} projectName={projectName} />
        </div>
      )}

      <button
        className={`${styles.toggleButton} ${open ? styles.open : ''}`}
        aria-expanded={open}
        aria-label={open ? 'Fechar chat do projeto' : 'Abrir chat do projeto'}
        onClick={() => setOpen(prev => !prev)}
      >
        {open ? '✕' : <img 
                        src={ChatIconPath} 
                        alt="Chat" 
                        className={`${styles.iconImage} ${theme === 'dark' ? styles.invert : ''}`}
                      />}
      </button>
    </div>
  )
}
