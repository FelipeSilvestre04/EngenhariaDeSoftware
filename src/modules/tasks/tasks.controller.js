/*import { TasksService } from './tasks.service.js';

export class TasksController {
    constructor() {
        this.tasksService = new TasksService();
    }

    // GET /api/tasks?projectId=X - Lista tarefas de um projeto
    async getByProject(req, res) {
        try {
            const projectId = parseInt(req.query.projectId, 10);

            if (!projectId) {
                return res.status(400).json({ error: 'projectId é obrigatório' });
            }

            const tasks = this.tasksService.getTasksByProject(projectId);
            res.status(200).json(tasks);
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
            res.status(500).json({ error: 'Erro ao buscar tarefas' });
        }
    }

    // GET /api/tasks/:id - Busca tarefa por ID
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            const task = this.tasksService.getTaskById(id);

            if (!task) {
                return res.status(404).json({ error: 'Tarefa não encontrada' });
            }

            res.status(200).json(task);
        } catch (error) {
            console.error('Erro ao buscar tarefa:', error);
            res.status(500).json({ error: 'Erro ao buscar tarefa' });
        }
    }

    // POST /api/tasks - Cria nova tarefa
    async create(req, res) {
        try {
            const { projectId, title, description, column, tags } = req.body;

            if (!projectId || !title) {
                return res.status(400).json({
                    error: 'projectId e title são obrigatórios'
                });
            }

            const newTask = this.tasksService.createTask({
                projectId: parseInt(projectId, 10),
                title,
                description,
                column,
                tags
            });

            res.status(201).json(newTask);
        } catch (error) {
            console.error('Erro ao criar tarefa:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // PUT /api/tasks/:id - Atualiza tarefa
    async update(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            const updates = req.body;

            const updatedTask = this.tasksService.updateTask(id, updates);
            res.status(200).json(updatedTask);
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);

            if (error.message.includes('não encontrada')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(500).json({ error: error.message });
        }
    }

    // DELETE /api/tasks/:id - Deleta tarefa
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            const deletedTask = this.tasksService.deleteTask(id);

            res.status(200).json({
                message: 'Tarefa deletada com sucesso',
                task: deletedTask
            });
        } catch (error) {
            console.error('Erro ao deletar tarefa:', error);

            if (error.message.includes('não encontrada')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(500).json({ error: error.message });
        }
    }
}*/
import { TasksService } from './tasks.service.js';

export class TasksController {
    constructor() {
        this.tasksService = new TasksService();
    }

    async getByProject(req, res) {
        try {
            const projectId = parseInt(req.query.projectId);
            const tasks = await this.tasksService.getTasksByProject(projectId, req.userId);
            res.status(200).json(tasks);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async create(req, res) {
        try {
            const { projectId, title, description, column, tags } = req.body;
            // Passamos as tags (array de strings) para o serviço
            const task = await this.tasksService.createTask({
                userId: req.userId,
                projectId: parseInt(projectId),
                title,
                description,
                column,
                tags // Array ['Tag1', 'Tag2']
            });
            res.status(201).json(task);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const taskId = parseInt(req.params.id);
            // Frontend precisa enviar currentColumn e projectId para acharmos a task
            const { projectId, currentColumn, ...updates } = req.body;

            await this.tasksService.updateTask(
                { taskId, projectId: parseInt(projectId), userId: req.userId, currentColumn },
                updates
            );
            res.status(200).json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const taskId = parseInt(req.params.id);
            const { projectId, currentColumn } = req.query;

            await this.tasksService.deleteTask({
                taskId,
                userId: req.userId,
                projectId: parseInt(projectId),
                currentColumn
            });
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}