export class TasksService {
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
}
