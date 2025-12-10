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

    // Retorna list_id pelo nome da coluna
    async getListId(projectId, userId, listName) {
        console.log(`🔍 getListId: projectId=${projectId}, userId=${userId}, listName=${listName}`);
        const query = `
            SELECT list_id FROM list 
            WHERE project_id = $1 AND user_id = $2 AND name = $3
        `;
        const result = await db.query(query, [projectId, userId, listName]);
        if (result.rows.length === 0) {
            console.log(`⚠️ Lista '${listName}' não encontrada, usando fallback`);
            // Fallback para 'to-do'
            const fallback = await db.query(`SELECT list_id FROM list WHERE project_id=$1 AND name='to-do'`, [projectId]);
            const listId = fallback.rows[0]?.list_id || 1;
            console.log(`🔍 Fallback list_id=${listId}`);
            return listId;
        }
        console.log(`🔍 Encontrado list_id=${result.rows[0].list_id}`);
        return result.rows[0].list_id;
    }

    async getTasksByProject(projectId, userId) {
        // Query com JOIN para incluir tags
        const query = `
            SELECT 
                t.task_id as id, 
                t.project_id as "projectId", 
                t.text as title, 
                t.description as description,
                l.name as column,
                COALESCE(
                    array_agg(tg.tag_name ORDER BY tg.tag_id) FILTER (WHERE tg.tag_name IS NOT NULL), 
                    '{}'
                ) as tags
            FROM task t
            JOIN list l ON t.list_id = l.list_id 
                AND t.project_id = l.project_id 
                AND t.user_id = l.user_id
            LEFT JOIN tag_task tt ON t.task_id = tt.task_id 
                AND t.project_id = tt.project_id
                AND t.list_id = tt.list_id
                AND t.user_id = tt.user_id
            LEFT JOIN tag tg ON tt.tag_id = tg.tag_id
            WHERE t.project_id = $1 AND t.user_id = $2
            GROUP BY t.task_id, t.project_id, t.text, t.description, l.list_id, l.name
            ORDER BY l.list_id, t.task_id ASC
        `;

        const result = await db.query(query, [projectId, userId]);

        // Debug
        console.log(`🏷️  [Tags Debug] Tasks retornadas para projeto ${projectId}:`);
        result.rows.forEach(task => {
            console.log(`   Task #${task.id} "${task.title}" - Tags: ${JSON.stringify(task.tags)}`);
        });

        return result.rows;
    }

    async createTask({ userId, projectId, title, description, column = 'to-do', tags = [] }) {
        const listId = await this.getListId(projectId, userId, column);
        console.log(`🏷️  [Tags Debug] Criando task com tags: ${JSON.stringify(tags)}`);

        // Criar Task
        const insertTaskQuery = `
            INSERT INTO task (list_id, project_id, user_id, text, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING task_id as id
        `;
        const taskResult = await db.query(insertTaskQuery, [listId, projectId, userId, title, description || '']);
        const newTaskId = taskResult.rows[0].id;
        console.log(`🏷️  [Tags Debug] Task criada com id=${newTaskId}`);

        // Vincular Tags
        if (tags && tags.length > 0) {
            console.log(`🏷️  [Tags Debug] Tentando vincular ${tags.length} tags...`);
            for (const tagName of tags) {
                try {
                    // Verifica se a tag existe
                    let selectTag = await db.query('SELECT tag_id FROM tag WHERE tag_name = $1', [tagName]);
                    let tagId;

                    if (selectTag.rows.length === 0) {
                        // Cria tag
                        const insertTagResult = await db.query(
                            'INSERT INTO tag (tag_name) VALUES ($1) RETURNING tag_id',
                            [tagName]
                        );
                        tagId = insertTagResult.rows[0].tag_id;
                        console.log(`🏷️  [Tags Debug] Tag '${tagName}' criada com tag_id=${tagId}`);
                    } else {
                        tagId = selectTag.rows[0].tag_id;
                        console.log(`🏷️  [Tags Debug] Tag '${tagName}' já existe com tag_id=${tagId}`);
                    }

                    if (tagId) {
                        // Verifica associação existente
                        const existsCheck = await db.query(`
                            SELECT 1 FROM tag_task 
                            WHERE tag_id = $1 AND task_id = $2 AND project_id = $3 AND list_id = $4
                        `, [tagId, newTaskId, projectId, listId]);

                        if (existsCheck.rows.length === 0) {
                            // Insere na tag_task
                            await db.query(`
                                INSERT INTO tag_task (tag_id, task_id, list_id, project_id, user_id)
                                VALUES ($1, $2, $3, $4, $5)
                            `, [tagId, newTaskId, listId, projectId, userId]);
                            console.log(`   ✅ Tag '${tagName}' vinculada com sucesso`);
                        } else {
                            console.log(`   ⚠️ Tag '${tagName}' já estava vinculada a esta task nesta lista`);
                        }
                    }
                } catch (err) {
                    console.error(`   ❌ Erro ao vincular tag '${tagName}':`, err.message);
                }
            }
        } else {
            console.log(`🏷️  [Tags Debug] Nenhuma tag para vincular`);
        }

        return {
            id: newTaskId,
            projectId, title, description, column, tags
        };
    }

    async updateTask({ taskId, projectId, userId, currentColumn }, updates) {
        const oldListId = await this.getListId(projectId, userId, currentColumn);
        console.log(`🔄 [TasksService] updateTask: taskId=${taskId}, oldListId=${oldListId}`);

        // Mover de Coluna - DELETE + INSERT (list_id faz parte da PK)
        if (updates.column && updates.column !== currentColumn) {
            const newListId = await this.getListId(projectId, userId, updates.column);
            console.log(`🔄 [TasksService] Movendo task de list_id=${oldListId} para list_id=${newListId}`);

            // Busca dados atuais
            const selectQuery = `
                SELECT text, description FROM task 
                WHERE task_id = $1 AND project_id = $2 AND user_id = $3 AND list_id = $4
            `;
            const current = await db.query(selectQuery, [taskId, projectId, userId, oldListId]);

            if (current.rows.length === 0) {
                throw new Error('Task não encontrada');
            }

            const { text, description } = current.rows[0];

            // Busca tags associadas antes de deletar
            const tagsQuery = await db.query(`
                SELECT tag_id FROM tag_task 
                WHERE task_id = $1 AND project_id = $2 AND user_id = $3 AND list_id = $4
            `, [taskId, projectId, userId, oldListId]);
            const tagIds = tagsQuery.rows.map(r => r.tag_id);
            console.log(`🏷️  [Tags Debug] Tags a preservar da task ${taskId} na list ${oldListId}: ${tagIds.length > 0 ? tagIds.join(', ') : 'nenhuma'}`);

            // Delete da lista antiga
            await db.query(`
                DELETE FROM task 
                WHERE task_id = $1 AND project_id = $2 AND user_id = $3 AND list_id = $4
            `, [taskId, projectId, userId, oldListId]);
            console.log(`🏷️  [Tags Debug] DELETE executado`);

            // Insert na nova lista
            let newTaskId;
            try {
                const insertResult = await db.query(`
                    INSERT INTO task (list_id, project_id, user_id, text, description)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING task_id
                `, [newListId, projectId, userId, text, description]);
                newTaskId = insertResult.rows[0].task_id;
                console.log(`🏷️  [Tags Debug] INSERT resultado - novo task_id=${newTaskId}`);
            } catch (insertErr) {
                console.error(`❌ [Tags Debug] ERRO no INSERT:`, insertErr.message);
                throw insertErr;
            }

            // Re-insere tags com o novo task_id
            for (const tagId of tagIds) {
                try {
                    console.log(`🏷️  [Tags Debug] Inserindo tag_task: tag_id=${tagId}, task_id=${newTaskId}, list_id=${newListId}`);
                    await db.query(`
                        INSERT INTO tag_task (tag_id, task_id, list_id, project_id, user_id)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [tagId, newTaskId, newListId, projectId, userId]);
                    console.log(`   ✅ Tag vinculada`);
                } catch (err) {
                    console.error(`   ❌ Erro ao re-inserir tag_id=${tagId}:`, err.message);
                }
            }

            console.log(`✅ Task movida de ${currentColumn} para ${updates.column} com ${tagIds.length} tags (novo id=${newTaskId})`);
            return { message: "Tarefa movida", newTaskId };
        }

        // Atualizar Dados
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

        // Atualizar Tags
        if (updates.tags) {
            // Remove associações antigas
            await db.query(`
                DELETE FROM tag_task 
                WHERE task_id = $1 AND project_id = $2 AND user_id = $3
            `, [taskId, projectId, userId]);

            // Re-adiciona tags
            for (const tagName of updates.tags) {
                await db.query(`SELECT link_tag_task($1, $2, $3, $4, $5)`,
                    [tagName, taskId, oldListId, projectId, userId]);
            }
        }

        return { id: taskId, ...updates };
    }

    async deleteTask({ taskId, projectId, userId, currentColumn }) {
        const listId = await this.getListId(projectId, userId, currentColumn);

        // CASCADE limpa tag_task
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
