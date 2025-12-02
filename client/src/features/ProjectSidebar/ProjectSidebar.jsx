
import React, {useState} from 'react'; 
import ProjectCard from '../ProjectCard/ProjectCard';
import { Link } from 'react-router-dom';
import styles from './ProjectSidebar.module.css'; 
import Projects from '../projects-data'

function ProjectSidebar({ isOpen, onToggleClick }) {

  const [projects, setProjects] = useState(Projects);

  const sidebarClass = `${styles.sidebarContainer} ${isOpen ? styles.open : styles.collapsed}`;

  return (
    <aside className={sidebarClass}>
      
      <button onClick={onToggleClick} className={styles.toggleButton}>
        ☰
      </button>
      
      {/* topActions moved inside projects card to keep the background unified */}
      {isOpen && (
        <>
          <div className={styles.projectsCard}>
            <div className={styles.projectsCardHeader}>
                <div className={styles.headerLeft}>
                  <svg className={styles.homeIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                  <h2>Meus Projetos</h2>
                </div>
                <div className={styles.headerRight}>
                  <Link to="/" className={styles.homeButton} aria-label="Ir para tela inicial">
                    <span className={styles.homeText}>Início</span>
                  </Link>
                </div>
              </div>

            <div className={styles.projectsCardBody}>
              <div className={styles.cardList}>
                {projects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    id={project.id}
                    title={project.title} 
                    color={project.color} 
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
export default ProjectSidebar;