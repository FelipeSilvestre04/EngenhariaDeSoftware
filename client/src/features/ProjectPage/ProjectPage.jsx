import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Projects from '../projects-data'
import './ProjectPage.css'
import ProjectChatToggle from '../ProjectChat/ProjectChatToggle'
import { KanbanBoard } from './KanbanBoard'

function ProjectPage({ theme }) {
  const { projectId } = useParams()
  const id = parseInt(projectId, 10)

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)

  // Busca projeto da API com fallback para dados locais
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${id}`)

        if (response.ok) {
          const data = await response.json()
          setProject(data)
          console.log('✅ Projeto carregado da API:', data)
        } else {
          // Fallback: usa dados locais
          const localProject = Projects.find(p => p.id === id)
          setProject(localProject)
          console.log('⚠️ Usando projeto local (API falhou):', localProject)
        }
      } catch (err) {
        // Fallback: usa dados locais
        const localProject = Projects.find(p => p.id === id)
        setProject(localProject)
        console.log('⚠️ Usando projeto local (erro na API):', err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [id])

  if (loading) {
    return (
      <div className="project-page">
        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
          <p>Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="project-page">
        <h2>Projeto não encontrado</h2>
        <Link to="/">Voltar para lista de projetos</Link>
      </div>
    )
  }

  return (
    <div className="project-page">
      <div className="project-header" style={{ background: project.color }}>
        <h1>{project.title}</h1>
      </div>

      <div className="project-main-content">
        <div className="kanban-board-container">
          <KanbanBoard projectId={project.id} />
        </div>
      </div>

      <ProjectChatToggle projectName={project.title} projectId={project.id} theme={theme} />
    </div>
  )
}

export default ProjectPage