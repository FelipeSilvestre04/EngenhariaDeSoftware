import React from 'react'
import { useParams, Link } from 'react-router-dom'
import Projects from '../projects-data'
import './ProjectPage.css'
import ProjectChatToggle from '../ProjectChat/ProjectChatToggle'
import { KanbanBoard } from './KanbanBoard' // Importado

function ProjectPage() {
  const { projectId } = useParams()
  const id = parseInt(projectId, 10)
  const project = Projects.find(p => p.id === id)
  
  if (!project) {
    return (
      <div className="project-page">
        <h2>Projeto não encontrado</h2>
        <Link to="/">Voltar para lista de projetos</Link>
      </div>
    )
  }

// ProjectPage.jsx (Trecho do retorno)

  return (
    <div className="project-page">
      <div className="project-header" style={{ background: project.color }}>
        <h1>{project.title}</h1>
      </div>
      
      <div className="project-main-content">
        
        {/* Coluna 1: Detalhes do Projeto */}
        <div className="project-body">
          <h3>Detalhes do Projeto</h3>
          <p><strong>ID:</strong> {project.id}</p>
          <p><strong>Cor:</strong> <span style={{ color: project.color }}>{project.color}</span></p>
          <p>Esta é a área original de detalhes do projeto, mantida no lado esquerdo.</p>
          <Link to="/">← Voltar para Meus Projetos</Link>
        </div>
        
        {/* 🚨 CORREÇÃO AQUI: Envolver o KanbanBoard com a classe de layout 🚨 */}
        <div className="kanban-board-container">
          <KanbanBoard projectId={project.id} />
        </div>
      </div>

      <ProjectChatToggle projectName={project.title} theme="light" />
    </div>
  )
}

export default ProjectPage