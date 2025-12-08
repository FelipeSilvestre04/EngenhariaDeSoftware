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
    
    // Auxiliar para pegar o List_ID pelo nome (o banco já cria 'to-do', etc)
    async getListId(projectId, userId, listName) {
        const query = `
            SELECT "List_ID" FROM List 
            WHERE "Project_ID" = $1 AND "User_ID" = $2 AND "Name" = $3
        `;
        const result = await db.query(query, [projectId, userId, listName]);
        if (result.rows.length === 0) {
            // Fallback para 'to-do' se não achar
            const fallback = await db.query(`SELECT "List_ID" FROM List WHERE "Project_ID"=$1 AND "Name"='to-do'`, [projectId]);
            return fallback.rows[0]?.List_ID || 1;
        }
        return result.rows[0].List_ID;
    }

    async getTasksByProject(projectId, userId) {
        // Query complexa: Busca a Task E faz um array com os nomes das Tags (JOIN)
        const query = `
            SELECT 
                t."Task_ID" as id, 
                t."Project_ID" as "projectId", 
                t."Text" as title, 
                t."Description" as description,
                l."Name" as column,
                COALESCE(
                    array_agg(tg."Tag_Name") FILTER (WHERE tg."Tag_Name" IS NOT NULL), 
                    '{}'
                ) as tags
            FROM Task t
            JOIN List l ON t."List_ID" = l."List_ID" 
                AND t."Project_ID" = l."Project_ID" 
                AND t."User_ID" = l."User_ID"
            LEFT JOIN Tag_Task tt ON t."Task_ID" = tt."Task_ID" 
                AND t."Project_ID" = tt."Project_ID"
            LEFT JOIN Tag tg ON tt."Tag_ID" = tg."Tag_ID"
            WHERE t."Project_ID" = $1 AND t."User_ID" = $2
            GROUP BY t."Task_ID", l."List_ID", l."Name"
            ORDER BY l."List_ID", t."Task_ID" ASC
        `;
        
        const result = await db.query(query, [projectId, userId]);
        return result.rows;
    }

    async createTask({ userId, projectId, title, description, column = 'to-do', tags = [] }) {
        const listId = await this.getListId(projectId, userId, column);

        // 1. Criar a Task
        const insertTaskQuery = `
            INSERT INTO Task ("List_ID", "Project_ID", "User_ID", "Text", "Description")
            VALUES ($1, $2, $3, $4, $5)
            RETURNING "Task_ID" as id
        `;
        const taskResult = await db.query(insertTaskQuery, [listId, projectId, userId, title, description || '']);
        const newTaskId = taskResult.rows[0].id;

        // 2. Vincular Tags usando sua função Link_Tag_Task
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                // Link_Tag_Task(p_Tag_Name, p_Task_ID, p_List_ID, p_Project_ID, p_User_ID)
                await db.query(`SELECT Link_Tag_Task($1, $2, $3, $4, $5)`, 
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

        // 1. Mover de Coluna (TrocarTask)
        if (updates.column && updates.column !== currentColumn) {
            const newListId = await this.getListId(projectId, userId, updates.column);
            await db.query(`SELECT TrocarTask($1, $2, $3, $4, $5)`, 
                [oldListId, newListId, taskId, projectId, userId]);
            // Nota: TrocarTask altera o Task_ID. O front deve recarregar a lista.
            return { message: "Tarefa movida" };
        }

        // 2. Atualizar Dados (Titulo, Descrição)
        const fields = [];
        const values = [];
        let idx = 1;

        if (updates.title) { fields.push(`"Text" = $${idx++}`); values.push(updates.title); }
        if (updates.description) { fields.push(`"Description" = $${idx++}`); values.push(updates.description); }

        if (fields.length > 0) {
            values.push(taskId, userId, projectId, oldListId);
            const query = `
                UPDATE Task SET ${fields.join(', ')}
                WHERE "Task_ID" = $${idx++} AND "User_ID" = $${idx++} AND "Project_ID" = $${idx++} AND "List_ID" = $${idx++}
            `;
            await db.query(query, values);
        }

        // 3. Atualizar Tags (Sincronização)
        if (updates.tags) {
            // Primeiro removemos as associações antigas dessa tarefa para evitar duplicatas ou lixo
            // (Sua função Link_Tag_Task apenas adiciona, não remove)
            await db.query(`
                DELETE FROM Tag_Task 
                WHERE "Task_ID" = $1 AND "Project_ID" = $2 AND "User_ID" = $3
            `, [taskId, projectId, userId]);

            // Re-adiciona as tags enviadas usando sua função
            for (const tagName of updates.tags) {
                await db.query(`SELECT Link_Tag_Task($1, $2, $3, $4, $5)`, 
                    [tagName, taskId, oldListId, projectId, userId]);
            }
        }

        return { id: taskId, ...updates };
    }

    async deleteTask({ taskId, projectId, userId, currentColumn }) {
        const listId = await this.getListId(projectId, userId, currentColumn);
        
        // O ON DELETE CASCADE no banco deve limpar a tabela Tag_Task automaticamente
        const query = `
            DELETE FROM Task 
            WHERE "Task_ID" = $1 AND "User_ID" = $2 AND "Project_ID" = $3 AND "List_ID" = $4
            RETURNING "Task_ID"
        `;
        const result = await db.query(query, [taskId, userId, projectId, listId]);
        
        if (result.rows.length === 0) throw new Error('Tarefa não encontrada');
        return result.rows[0];
    }
}
