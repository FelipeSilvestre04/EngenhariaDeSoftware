import React, { useState, useEffect } from 'react';
import ProjectCard from '../ProjectCard/ProjectCard';
import { Link } from 'react-router-dom';
import styles from './ProjectSidebar.module.css';

// Fallback: dados estáticos caso a API falhe
const FALLBACK_PROJECTS = [
  { id: 1, title: 'Projeto App Mobile', color: '#cf50f2' },
  { id: 2, title: 'Campanha de Marketing QA', color: '#b180f3' },
  { id: 3, title: 'Desenvolvimento Web', color: '#836af2' },
  { id: 4, title: 'Jornal da verdade', color: '#c56968ff' },
  { id: 5, title: 'Liberdade Gibis', color: '#cbca74ff' },
  { id: 6, title: 'Projeto Sanderson', color: '#71be82ff' },
  { id: 7, title: 'Campanha Tasso Presidente', color: '#6494b4ff' },
  { id: 8, title: 'Joao pfv faz o BD', color: '#6494b4ff' },
  { id: 9, title: 'Projeto X', color: '#ff5733' },
  { id: 10, title: 'Projeto Y', color: '#33ff57' },
  { id: 11, title: 'Projeto Z', color: '#3357ff' }
];

function ProjectSidebar({ isOpen, onToggleClick }) {

  const [projects, setProjects] = useState(FALLBACK_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  // Busca projetos da API ao montar o componente
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');

        if (!response.ok) {
          throw new Error('Erro ao buscar projetos da API');
        }

        const data = await response.json();
        setProjects(data);
        setUsingFallback(false);
        console.log('🔄 Projetos atualizados:', data);
      } catch (err) {
        console.warn('⚠️ API não disponível, usando dados locais:', err.message);
        setProjects(FALLBACK_PROJECTS);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    };

    // Busca inicial
    fetchProjects();

    // Auto-refresh a cada 3 segundos para sincronizar com mudanças da LLM
    const intervalId = setInterval(() => {
      fetchProjects();
    }, 3000);

    // Cleanup: remove o interval quando o componente desmontar
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const sidebarClass = `${styles.sidebarContainer} ${isOpen ? styles.open : styles.collapsed}`;

  return (
    <aside className={sidebarClass}>

      <button onClick={onToggleClick} className={styles.toggleButton}>
        ☰
      </button>

      {isOpen && (
        <>
          <div className={styles.projectsCard}>
            <div className={styles.projectsCardHeader}>
              <div className={styles.headerLeft}>
                <svg className={styles.homeIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                <h2>Meus Projetos {usingFallback && '(offline)'}</h2>
              </div>
              <div className={styles.headerRight}>
                <Link to="/" className={styles.homeButton} aria-label="Ir para tela inicial">
                  <span className={styles.homeText}>Início</span>
                </Link>
              </div>
            </div>

            <div className={styles.projectsCardBody}>
              {loading ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Carregando...</p>
              ) : (
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
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
export default ProjectSidebar;