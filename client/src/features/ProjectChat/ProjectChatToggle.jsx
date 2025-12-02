import React, { useState } from 'react'
import styles from './ProjectChatToggle.module.css'
import { ChatWindow } from '../chat/ChatWindow'

export default function ProjectChatToggle({ projectName, theme = 'light' }) {
  const [open, setOpen] = useState(false)

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
        {open ? '✕' : '💬'}
      </button>
    </div>
  )
}
