import { ProjectsService } from './projects.service.js';

export class ProjectsController {
    constructor() {
        this.projectsService = new ProjectsService();
    }

    // GET /api/projects - Lista todos os projetos
    async getAll(req, res) {
        try {
            const projects = this.projectsService.getAllProjects();
            res.status(200).json(projects);
        } catch (error) {
            console.error('Erro ao buscar projetos:', error);
            res.status(500).json({ error: 'Erro ao buscar projetos' });
        }
    }

    // GET /api/projects/:id - Busca projeto por ID
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            const project = this.projectsService.getProjectById(id);

            if (!project) {
                return res.status(404).json({ error: 'Projeto não encontrado' });
            }

            res.status(200).json(project);
        } catch (error) {
            console.error('Erro ao buscar projeto:', error);
            res.status(500).json({ error: 'Erro ao buscar projeto' });
        }
    }

    // POST /api/projects - Cria novo projeto
    async create(req, res) {
        try {
            const { title, color } = req.body;

            if (!title) {
                return res.status(400).json({ error: 'Título do projeto é obrigatório' });
            }

            const newProject = this.projectsService.createProject(title, color);
            res.status(201).json(newProject);
        } catch (error) {
            console.error('Erro ao criar projeto:', error);
            res.status(500).json({ error: 'Erro ao criar projeto' });
        }
    }

    // DELETE /api/projects/:id - Deleta projeto
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            const deletedProject = this.projectsService.deleteProject(id);
            res.status(200).json({
                message: 'Projeto deletado com sucesso',
                project: deletedProject
            });
        } catch (error) {
            console.error('Erro ao deletar projeto:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(500).json({ error: 'Erro ao deletar projeto' });
        }
    }
}
