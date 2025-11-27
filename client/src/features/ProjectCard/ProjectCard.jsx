import styles from './ProjectCard.module.css'; 
import React from 'react';

function ProjectCard({ title, color, onClick }) { 
  return (
    <div
      className={styles.ProjectCard}
      title={title}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); }}
    >

      <div className={styles.ColorBox} style={{ backgroundColor: color }}></div>

      <div className={styles.ProjectContent}>
        <p className={styles.ProjectTitle}>{title}</p>
      </div>

    </div>
  );
}
export default ProjectCard;