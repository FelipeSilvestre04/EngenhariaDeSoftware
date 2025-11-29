export class ProjectsService {
    constructor() {
        this.projects = [
        { id: 1, title: 'Projeto Alpha', color: '#FF5733' },
        { id: 2, title: 'Projeto Beta', color: '#33C1FF' },
        { id: 3, title: 'Projeto Gamma', color: '#75FF33' },
        ];
    }

    createProject(title, color) {
        const newProject = {
            id: this.projects.length + 1,
            title,
            color
        };
        this.projects.push(newProject);
        return newProject;
    }

    getAllProjects() {
        return this.projects;
    }

    getProjectById(id) {
        return this.projects.find(project => project.id === id);
    }
}