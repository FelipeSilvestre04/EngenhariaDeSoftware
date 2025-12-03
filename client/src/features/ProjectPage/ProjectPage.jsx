import React from 'react'
import { useParams, Link } from 'react-router-dom'
import Projects from '../projects-data'
import './ProjectPage.css'
import ProjectChatToggle from '../ProjectChat/ProjectChatToggle'

function ProjectPage({ theme }) {
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

  return (
    <div className="project-page">
      <div className="project-header" style={{ background: project.color }}>
        <h1>{project.title}</h1>
      </div>
      <div className="project-body">
        <p>Detalhes do projeto: <strong>ID:</strong> {project.id}</p>
        <p>Cor do projeto: <span style={{ color: project.color }}>{project.color}</span></p>
        <Link to="/">← Voltar</Link>
      </div>
      <ProjectChatToggle projectName={project.title} theme={theme} />
    </div>
  )
}

export default ProjectPage
