/*export class TasksService {
    // Singleton: garante que só existe UMA instância compartilhada
    static instance = null;

    constructor() {
        // Se já existe uma instância, retorna ela
        if (TasksService.instance) {
            return TasksService.instance;
        }

        // Dados iniciais migrados de kanban-data.js
        this.tasks = [
            { id: 1, projectId: 1, title: 'Definir arquitetura mobile', description: 'Escolher entre React Native e Flutter.', column: 'to-do', tags: ['Backend'], createdAt: new Date(), updatedAt: new Date() },
            { id: 2, projectId: 1, title: 'Design da tela de Login', description: 'Criar mockups de alta fidelidade.', column: 'in-progress', tags: ['Design'], createdAt: new Date(), updatedAt: new Date() },
            { id: 3, projectId: 2, title: 'Análise de concorrência', description: 'Analisar 3 principais concorrentes no mercado QA.', column: 'done', tags: ['Marketing'], createdAt: new Date(), updatedAt: new Date() },
            { id: 4, projectId: 2, title: 'Definir público-alvo', description: 'Segmentação demográfica e comportamental.', column: 'to-do', tags: ['Marketing'], createdAt: new Date(), updatedAt: new Date() },
            { id: 5, projectId: 3, title: 'Configurar ambiente de dev', description: 'Instalar Node, npm e configurar o Vite.', column: 'in-progress', tags: ['Frontend'], createdAt: new Date(), updatedAt: new Date() },
            { id: 6, projectId: 3, title: 'Criar serviço de projetos (Backend)', description: 'Implementar CRUD básico para projetos.', column: 'done', tags: ['Backend'], createdAt: new Date(), updatedAt: new Date() },
            { id: 7, projectId: 1, title: 'Criar feature de chat com LLM', description: 'Integrar a LangChain com o modelo Groq.', column: 'to-do', tags: ['IA', 'Backend'], createdAt: new Date(), updatedAt: new Date() },
            { id: 8, projectId: 1, title: 'Implementar autenticação Google', description: 'Fluxo OAuth2 para Google Calendar.', column: 'in-progress', tags: ['Auth'], createdAt: new Date(), updatedAt: new Date() },
        ];

        // Salva a instância
        TasksService.instance = this;
    }

    getAllTasks() {
        return this.tasks;
    }

    getTasksByProject(projectId) {
        const projectTasks = this.tasks.filter(task => task.projectId === projectId);
        console.log(`📋 [TasksService] Retornando ${projectTasks.length} tarefas do projeto ${projectId}`);
        return projectTasks;
    }

    getTaskById(id) {
        return this.tasks.find(task => task.id === id);
    }

    createTask({ projectId, title, description, column = 'to-do', tags = [] }) {
        // Validação básica
        if (!title) {
            throw new Error('Título da tarefa é obrigatório');
        }

        // Gera ID único
        const maxId = this.tasks.length > 0
            ? Math.max(...this.tasks.map(t => t.id))
            : 0;

        const newTask = {
            id: maxId + 1,
            projectId,
            title,
            description: description || '',
            column,
            tags,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.tasks.push(newTask);
        console.log(`✅ [TasksService] Tarefa criada: "${title}" no projeto ${projectId}`);
        return newTask;
    }

    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);

        if (taskIndex === -1) {
            throw new Error(`Tarefa com ID ${id} não encontrada`);
        }

        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            ...updates,
            id, // Garante que ID não muda
            updatedAt: new Date()
        };

        console.log(`🔄 [TasksService] Tarefa ${id} atualizada`);
        return this.tasks[taskIndex];
    }

    deleteTask(id) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);

        if (taskIndex === -1) {
            throw new Error(`Tarefa com ID ${id} não encontrada`);
        }

        const deletedTask = this.tasks.splice(taskIndex, 1)[0];
        console.log(`❌ [TasksService] Tarefa "${deletedTask.title}" deletada`);
        return deletedTask;
    }
}*/

import { db } from '../../shared/database/index.js';

export class TasksService {

    // Auxiliar para pegar o list_id pelo nome
    async getListId(projectId, userId, listName) {
        const query = `
            SELECT list_id FROM list 
            WHERE project_id = $1 AND user_id = $2 AND name = $3
        `;
        const result = await db.query(query, [projectId, userId, listName]);
        if (result.rows.length === 0) {
            // Fallback para 'to-do' se não achar
            const fallback = await db.query(`SELECT list_id FROM list WHERE project_id=$1 AND name='to-do'`, [projectId]);
            return fallback.rows[0]?.list_id || 1;
        }
        return result.rows[0].list_id;
    }

    async getTasksByProject(projectId, userId) {
        const query = `
            SELECT 
                t.task_id as id, 
                t.project_id as "projectId", 
                t.text as title, 
                t.description as description,
                l.name as column,
                COALESCE(
                    array_agg(tg.tag_name) FILTER (WHERE tg.tag_name IS NOT NULL), 
                    '{}'
                ) as tags
            FROM task t
            JOIN list l ON t.list_id = l.list_id 
                AND t.project_id = l.project_id 
                AND t.user_id = l.user_id
            LEFT JOIN tag_task tt ON t.task_id = tt.task_id 
                AND t.project_id = tt.project_id
            LEFT JOIN tag tg ON tt.tag_id = tg.tag_id
            WHERE t.project_id = $1 AND t.user_id = $2
            GROUP BY t.task_id, l.list_id, l.name
            ORDER BY l.list_id, t.task_id ASC
        `;

        const result = await db.query(query, [projectId, userId]);
        return result.rows;
    }

    async createTask({ userId, projectId, title, description, column = 'to-do', tags = [] }) {
        const listId = await this.getListId(projectId, userId, column);

        const insertTaskQuery = `
            INSERT INTO task (list_id, project_id, user_id, text, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING task_id as id
        `;
        const taskResult = await db.query(insertTaskQuery, [listId, projectId, userId, title, description || '']);
        const newTaskId = taskResult.rows[0].id;

        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                await db.query(`SELECT link_tag_task($1, $2, $3, $4, $5)`,
                    [tagName, newTaskId, listId, projectId, userId]);
            }
        }

        return {
            id: newTaskId,
            projectId, title, description, column, tags
        };
    }

    async updateTask({ taskId, projectId, userId, currentColumn }, updates) {
        const oldListId = await this.getListId(projectId, userId, currentColumn);

        // 1. Mover de Coluna
        if (updates.column && updates.column !== currentColumn) {
            const newListId = await this.getListId(projectId, userId, updates.column);
            await db.query(`SELECT trocartask($1, $2, $3, $4, $5)`,
                [oldListId, newListId, taskId, projectId, userId]);
            return { message: "Tarefa movida" };
        }

        // 2. Atualizar Dados
        const fields = [];
        const values = [];
        let idx = 1;

        if (updates.title) { fields.push(`text = $${idx++}`); values.push(updates.title); }
        if (updates.description) { fields.push(`description = $${idx++}`); values.push(updates.description); }

        if (fields.length > 0) {
            values.push(taskId, userId, projectId, oldListId);
            const query = `
                UPDATE task SET ${fields.join(', ')}
                WHERE task_id = $${idx++} AND user_id = $${idx++} AND project_id = $${idx++} AND list_id = $${idx++}
            `;
            await db.query(query, values);
        }

        // 3. Atualizar Tags
        if (updates.tags) {
            await db.query(`
                DELETE FROM tag_task 
                WHERE task_id = $1 AND project_id = $2 AND user_id = $3
            `, [taskId, projectId, userId]);

            for (const tagName of updates.tags) {
                await db.query(`SELECT link_tag_task($1, $2, $3, $4, $5)`,
                    [tagName, taskId, oldListId, projectId, userId]);
            }
        }

        return { id: taskId, ...updates };
    }

    async deleteTask({ taskId, projectId, userId, currentColumn }) {
        const listId = await this.getListId(projectId, userId, currentColumn);

        const query = `
            DELETE FROM task 
            WHERE task_id = $1 AND user_id = $2 AND project_id = $3 AND list_id = $4
            RETURNING task_id
        `;
        const result = await db.query(query, [taskId, userId, projectId, listId]);

        if (result.rows.length === 0) throw new Error('Tarefa não encontrada');
        return result.rows[0];
    }
}

