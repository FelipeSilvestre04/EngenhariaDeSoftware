
import React, {useState} from 'react'; 
import ProjectCard from '../ProjectCard/ProjectCard';
import styles from './ProjectSidebar.module.css'; 

  const Projects = [
  { id: 1, title: 'Projeto App Mobile', color: '#cf50f2' },
  { id: 2, title: 'Campanha de Marketing QA', color: '#b180f3' },
  { id: 3, title: 'Desenvolvimento Web', color: '#836af2' },
  { id: 4, title: 'Jornal da verdade', color: '#ff1e1aff' },
  { id: 5, title: 'Liberdade Gibis', color: '#d9d62dff' },
  { id: 6, title: 'Projeto Sanderson', color: '#2dd952ff' },
  { id: 7, title: 'Campanha Tasso Presidente', color: '#2d94d9ff' }
];

function ProjectSidebar() {
  
  const [projects, setProjects] = useState(Projects);

  return (
    <aside className={styles.sidebarContainer}>
      <div className={styles.titleBar}>
        <h2>Meus Projetos</h2>
      </div>

      <div className={styles.cardList}>
        {projects.map(project => (
          <ProjectCard 
            key={project.id} 
            title={project.title} 
            color={project.color} 
          />
        ))}
      </div>
    </aside>
  );
}
export default ProjectSidebar;