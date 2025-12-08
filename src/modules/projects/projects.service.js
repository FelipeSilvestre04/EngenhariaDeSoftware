import { db } from '../../shared/database/index.js';

/*export class ProjectsService {
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
}*/

export class ProjectsService {
    async getAllProjects(userId) {
        const query = `
            SELECT project_id as id, name as title, color 
            FROM project 
            WHERE user_id = $1 AND name != 'Projeto_Fantasma'
            ORDER BY project_id ASC
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    async getProjectById(id, userId) {
        const query = `
            SELECT project_id as id, name as title, color 
            FROM project 
            WHERE project_id = $1 AND user_id = $2
        `;
        const result = await db.query(query, [id, userId]);
        return result.rows[0];
    }

    /*async getIdByName(userId, title) {
        const query = `
            SELECT project_id as id 
            FROM project 
            WHERE user_id = $1 AND name = $2
        `;
        const result = await db.query(query, [userId, title]);
        
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0].id;
    }*/

    async createProject(userId, title, color = '#666666') {
        // Trigger Setup_AfterInsertProject [cite: 94-105] criará as listas automaticamente
        const query = `
            INSERT INTO project (user_id, name, color) 
            VALUES ($1, $2, $3) 
            RETURNING project_id as id, name as title, color
        `;
        const result = await db.query(query, [userId, title, color]);
        console.log(`✅ Projeto criado: ${title}`);
        return result.rows[0];
    }

    async deleteProject(id, userId) {
        const query = `
            DELETE FROM project 
            WHERE project_id = $1 AND user_id = $2 
            RETURNING project_id as id, name as title
        `;
        const result = await db.query(query, [id, userId]);
        if (result.rows.length === 0) throw new Error('Projeto não encontrado');
        return result.rows[0];
    }
}