import { ProjectsService } from './projects.service.js';

export class ProjectsController {
    constructor() {
        this.projectsService = new ProjectsService();
    }

    // GET /api/projects - Lista todos os projetos
    async getAll(req, res) {
        try {
            const projects = await this.projectsService.getAllProjects(req.userId);
            res.status(200).json(projects);
        } catch (error) {
            console.error('Erro ao buscar projetos:', error);
            res.status(500).json({ error: 'Erro ao buscar projetos' });
        }
    }

    // GET /api/projects/:id - Busca projeto por ID
    async getById(req, res) {
        try {
            const project = await this.projectsService.getProjectById(parseInt(req.params.id), req.userId);
            if (!project) return res.status(404).json({ eerror: 'Projeto não encontrado' });
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
            console.log(`📁 [ProjectsController] Criando projeto: title="${title}", color="${color}", userId=${req.userId}`);

            if (!title) return res.status(400).json({ error: 'Título obrigatório' });

            const project = await this.projectsService.createProject(req.userId, title, color);
            console.log(`✅ [ProjectsController] Projeto criado:`, project);
            res.status(201).json(project);
        } catch (error) {
            console.error('❌ [ProjectsController] Erro ao criar projeto:', error);
            res.status(500).json({ error: 'Erro ao criar projeto' });
        }
    }

    // DELETE /api/projects/:id - Deleta projeto
    async delete(req, res) {
        try {
            const project = await this.projectsService.deleteProject(parseInt(req.params.id), req.userId);
            res.status(200).json({ message: 'Deletado', project });
        } catch (error) {
            console.error('Erro ao deletar projeto:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(500).json({ error: 'Erro ao deletar projeto' })
        }
    }
}
