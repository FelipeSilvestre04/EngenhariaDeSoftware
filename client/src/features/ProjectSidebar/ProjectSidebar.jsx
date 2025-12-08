import React, { useState, useEffect, useRef } from 'react';
import ProjectCard from '../ProjectCard/ProjectCard';
import { Link } from 'react-router-dom';
import styles from './ProjectSidebar.module.css';

// Usa a mesma origem em produção; permite override via env para desenvolvimento
const API_BASE = import.meta.env?.VITE_API_URL || '/api';

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

const PREDEFINED_COLORS = [
  '#ff5b5b',
  '#cf50f2',
  '#3357ff',
  '#33ff57',
  '#ffbd33',
  '#33ccff',
];

function ProjectSidebar({ isOpen, onToggleClick }) {

  const [projects, setProjects] = useState(FALLBACK_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const [showOptions, setShowOptions] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);

  /* States para criação de projeto */
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PREDEFINED_COLORS[0]);

  const colorInputRef = useRef(null);

  // Busca projetos da API ao montar o componente
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${API_BASE}/projects`);

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

  // Ativa o modo de exclusão
  const handleEnterDeleteMode = () => {
    setIsDeleteMode(true);
    setShowOptions(false);
    setSelectedProjects([]);
  };

  const handleCancelDelete = () => {
    setIsDeleteMode(false);
    setSelectedProjects([]);
  };

  const toggleSelection = (id) => {
    if (selectedProjects.includes(id)) {
      setSelectedProjects(selectedProjects.filter(pid => pid !== id));
    } else {
      setSelectedProjects([...selectedProjects, id]);
    }
  };

  const handleDeleteConfirm = async () => {
    console.log("Excluindo projetos na API:", selectedProjects);

    try {
      const deletePromises = selectedProjects.map(id => 
        fetch(`${API_BASE}/projects/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      );

      await Promise.all(deletePromises);

      console.log("✅ Projetos excluídos com sucesso");

      const newProjectList = projects.filter(p => !selectedProjects.includes(p.id));
      setProjects(newProjectList);

      handleCancelDelete();

    } catch (error) {
      console.error("Erro ao excluir projetos:", error);
      alert("Erro ao excluir alguns projetos. Tente novamente.");
    }
  };

  /*Criação de projeto */

  const openCreateModal = () => {
    setNewProjectName('');
    setNewProjectColor(PREDEFINED_COLORS[0]);
    setIsCreateModalOpen(true);
    setShowOptions(false);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    const projectPayload = {
      title: newProjectName,
      color: newProjectColor
    };

    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(projectPayload),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar projeto');
      }

      const createdProject = await response.json();
      console.log("✅ Projeto criado na API:", createdProject);

      setProjects(prev => [...prev, createdProject]);

      setIsCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectColor(PREDEFINED_COLORS[0]);

    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      alert("Erro ao criar projeto. Verifique o console.");
    }
  };

  const handleColorWheelClick = () => {
    colorInputRef.current.click();
  };

  /* Renderização */
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
                <svg className={styles.homeIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                <h2>Meus Projetos {usingFallback && '(offline)'}</h2>
              </div>

              <div className={styles.headerRight}>
                {!isDeleteMode && (
                  <>
                    <Link to="/" className={styles.homeButton}>
                      <span className={styles.homeText}>Início</span>
                    </Link>

                    <button
                      className={styles.optionsButton}
                      onClick={() => setShowOptions(!showOptions)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                    </button>
                  </>
                )}

                {showOptions && !isDeleteMode && (
                  <div className={styles.optionsMenu}>
                    <button className={styles.optionItem} onClick={openCreateModal}>
                      Criar projeto
                    </button>
                    <button
                      className={`${styles.optionItem} ${styles.danger}`}
                      onClick={handleEnterDeleteMode}
                    >
                      Excluir projeto
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.projectsCardBody}>
              {loading ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Carregando...</p>
              ) : (
                <div className={styles.cardList}>
                  {projects.map(project => (
                    <div
                      key={project.id}
                      className={`${styles.projectItemWrapper} ${isDeleteMode ? styles.shaking : ''}`}
                      onClick={() => isDeleteMode && toggleSelection(project.id)}
                    >
                      <div style={{ flex: 1, pointerEvents: isDeleteMode ? 'none' : 'auto' }}>
                        <ProjectCard
                          id={project.id}
                          title={project.title}
                          color={project.color}
                        />
                      </div>
                      {isDeleteMode && (
                        <input
                          type="checkbox"
                          className={styles.deleteCheckbox}
                          checked={selectedProjects.includes(project.id)}
                          onChange={() => { }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isDeleteMode && (
              <div className={styles.bottomActions}>
                <button
                  className={`${styles.actionBtn} ${styles.cancelBtn}`}
                  onClick={handleCancelDelete}
                >
                  Cancelar
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.confirmBtn}`}
                  onClick={handleDeleteConfirm}
                  disabled={selectedProjects.length === 0}
                >
                  Excluir ({selectedProjects.length})
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Novo Projeto</h3>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Nome do Projeto</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Ex: Meu projeto"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Cor do Projeto</label>

              <div className={styles.colorSelectionContainer}>
                {PREDEFINED_COLORS.map((color) => (
                  <div
                    key={color}
                    className={`${styles.colorOption} ${newProjectColor === color ? styles.selected : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewProjectColor(color)}
                    title={color}
                  />
                ))}

                <div
                  className={`${styles.customColorBtn} ${!PREDEFINED_COLORS.includes(newProjectColor) ? styles.selected : ''}`}
                  onClick={handleColorWheelClick}
                  title="Escolher cor personalizada"
                  // Se a cor atual não for predefinida, mostramos ela como background desse botão
                  style={!PREDEFINED_COLORS.includes(newProjectColor) ? { background: newProjectColor } : {}}
                >
                  <span className={styles.plusIcon}>+</span>

                  <input
                    type="color"
                    ref={colorInputRef}
                    className={styles.hiddenColorInput}
                    onChange={(e) => setNewProjectColor(e.target.value)}
                    value={newProjectColor}
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </button>

              <button
                className={`${styles.modalBtn} ${styles.modalBtnConfirm}`}
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                Criar
              </button>
            </div>

          </div>
        </div>
      )}
    </aside>
  );
}


export default ProjectSidebar;