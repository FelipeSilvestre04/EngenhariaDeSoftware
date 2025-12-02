import styles from './ProjectCard.module.css'; 
import React from 'react';
import { Link } from 'react-router-dom';

function ProjectCard({ id, title, color }) { 
  
  return (
    <Link to={`/project/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className={styles.ProjectCard} title={title}>

        <div className={styles.ColorBox} style={{ backgroundColor: color }}></div>

        <div className={styles.ProjectContent}>
          <p className={styles.ProjectTitle}>{title}</p>
        </div>

      </div>
    </Link>
  );
}
export default ProjectCard;