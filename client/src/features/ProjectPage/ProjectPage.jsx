import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Projects from '../projects-data'
import './ProjectPage.css'
import ProjectChatToggle from '../ProjectChat/ProjectChatToggle'

function ProjectPage({ theme }) {
  const { projectId } = useParams()
  const id = parseInt(projectId, 10)
  const project = Projects.find(p => p.id === id)

  const [isExpanded, setIsExpanded] = useState(true)

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

      {/* --- NOVA BARRA DE DETALHES --- */}
      {/* Ela recebe a classe 'expanded' ou 'collapsed' para estilização da borda */}
      <div 
        className={`details-toggle-bar ${isExpanded ? 'expanded' : 'collapsed'}`} 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>{isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
        <span className="toggle-icon">{isExpanded ? '▲' : '▼'}</span>
      </div>

      <div className={`project-body ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="project-body-content">
            <p>Detalhes do projeto: <strong>ID:</strong> {project.id}</p>
            <p>Cor do projeto: <span style={{ color: project.color }}>{project.color}</span></p>
            <Link to="/">← Voltar</Link>
        </div>
      </div>

      <ProjectChatToggle projectName={project.title} theme={theme} />
    </div>
  )
}

export default ProjectPage
