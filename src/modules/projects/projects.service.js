export class ProjectsService {
    // Singleton: garante que só existe UMA instância compartilhada
    static instance = null;

    constructor() {
        // Se já existe uma instância, retorna ela
        if (ProjectsService.instance) {
            return ProjectsService.instance;
        }

        // Dados iniciais (3 projetos simples)
        this.projects = [
            { id: 1, title: 'Projeto Alpha', color: '#FF5733' },
            { id: 2, title: 'Projeto Beta', color: '#33C1FF' },
            { id: 3, title: 'Projeto Gamma', color: '#75FF33' },
        ];

        // Salva a instância
        ProjectsService.instance = this;
    }

    createProject(title, color = '#666666') {
        // Gera um ID único baseado no maior ID existente
        const maxId = this.projects.length > 0
            ? Math.max(...this.projects.map(p => p.id))
            : 0;

        const newProject = {
            id: maxId + 1,
            title,
            color
        };
        this.projects.push(newProject);
        console.log(`✅ [ProjectsService] Projeto criado: ${title} (ID: ${newProject.id})`);
        console.log(`📋 [ProjectsService] Total de projetos: ${this.projects.length}`);
        return newProject;
    }

    getAllProjects() {
        console.log(`📋 [ProjectsService] Retornando ${this.projects.length} projetos`);
        return this.projects;
    }

    getProjectById(id) {
        return this.projects.find(project => project.id === id);
    }

    deleteProject(id) {
        const projectIndex = this.projects.findIndex(project => project.id === id);
        if (projectIndex === -1) {
            throw new Error(`Projeto com ID ${id} não encontrado`);
        }
        const deletedProject = this.projects.splice(projectIndex, 1)[0];
        console.log(`❌ [ProjectsService] Projeto deletado: ${deletedProject.title} (ID: ${id})`);
        console.log(`📋 [ProjectsService] Total de projetos: ${this.projects.length}`);
        return deletedProject;
    }
}