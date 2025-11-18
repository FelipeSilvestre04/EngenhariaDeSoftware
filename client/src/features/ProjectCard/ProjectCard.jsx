import styles from './ProjectCard.module.css'; 
import React from 'react';

function ProjectCard({ title, color }) { 
  
  return (
    <div className={styles.ProjectCard} title={title}>

      <div className={styles.ColorBox} style={{ backgroundColor: color }}></div>

      <div className={styles.ProjectContent}>
        <p className={styles.ProjectTitle}>{title}</p>
      </div>

    </div>
  );
}
export default ProjectCard;