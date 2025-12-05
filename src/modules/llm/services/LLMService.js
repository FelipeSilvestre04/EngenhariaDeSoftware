import { LLMModel } from "../models/LLMModel.js"
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ProjectsService } from "../../projects/projects.service.js";
import { TasksService } from "../../tasks/tasks.service.js";

// o serviço é o que vai ser usado pelo controller. ele executará o modelo 
// e irá usá-lo para entregar um serviço específico.

export class LLMService {
    constructor(apiKey, calendarService) {
        this.model = new LLMModel(apiKey);
        this.calendarService = calendarService;
        this.projectService = new ProjectsService();
        this.tasksService = new TasksService();
        this.tools = [];
    }

    // CORREÇÃO 1: Removido 'async'
    createModel(temperature, modelName) {
        // CORREÇÃO 2: Removido 'await'
        this._createTools();
        this.model.initialize(modelName, temperature, this.tools);
    }

    // CORREÇÃO 3: Removido 'async'
    _createTools() {
        const getCalendarEventsTool = tool(
            async ({ maxResults = 10, query }) => {
                try {
                    const events = await this.calendarService.listEvents(maxResults, query);

                    if (!events || events.length === 0) {
                        return query 
                            ? `Nenhum evento encontrado para a busca "${query}".`
                            : "Nenhum evento encontrado no calendário.";
                    }

                    const formattedEvents = events.map((event, index) => {
                        // Os eventos já vêm processados com start and end como strings
                        const startDateTime = event.start;
                        const endDateTime = event.end;

                        // Formata as datas de forma legível
                        let dateInfo = 'Horário: Não especificado';
                        if (startDateTime) {
                            const startDate = new Date(startDateTime);
                            const endDate = endDateTime ? new Date(endDateTime) : null;

                            // Verifica se tem horário (se tem 'T' na string, tem horário)
                            const hasTime = startDateTime.includes('T');

                            if (!hasTime) {
                                // Evento de dia inteiro
                                dateInfo = `Data: ${startDate.toLocaleDateString('pt-BR')} (dia inteiro)`;
                            } else {
                                // Evento com horário específico
                                const dateStr = startDate.toLocaleDateString('pt-BR');
                                const timeStr = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                                if (endDate && hasTime) {
                                    const endTimeStr = endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                    dateInfo = `Data: ${dateStr} | Horário: ${timeStr} - ${endTimeStr}`;
                                } else {
                                    dateInfo = `Data: ${dateStr} | Horário: ${timeStr}`;
                                }
                            }
                        }

                        // Monta a informação do evento de forma estruturada - ADICIONADO ID
                        let eventInfo = `${index + 1}. **${event.summary || 'Sem título'}**\\n   ID: ${event.id}\\n   ${dateInfo}`;

                        if (event.description && event.description.trim()) {
                            eventInfo += `\\n   Descrição: ${event.description}`;
                        }

                        if (event.location && event.location.trim()) {
                            eventInfo += `\\n   Local: ${event.location}`;
                        }

                        return eventInfo;
                    }).join('\\n\\n');

                    return `Encontrei ${events.length} evento(s) no calendário:\\n\\n${formattedEvents}`;
                } catch (error) {
                    return `Erro ao buscar eventos: ${error.message}`;
                }
            },
            {
                name: "get_calendar_events",
                description: "Busca eventos do calendário Google do usuário. Use esta ferramenta quando precisar verificar a agenda, compromissos ou eventos marcados. Você pode filtrar por um termo de busca (query) para encontrar eventos específicos.",
                schema: z.object({
                    maxResults: z.number().optional().default(10).describe("Número máximo de eventos a retornar"),
                    query: z.string().optional().describe("Termo de busca para filtrar eventos (ex: 'Reunião', 'Dentista', 'Jogar Bola')")
                }),
            }
        );

        const createEventTool = tool(
            async ({ summary, description, location, startDateTime, endDateTime }) => {
                try {
                    const event = await this.calendarService.createEvent({
                        summary,
                        description,
                        location,
                        startDateTime,
                        endDateTime
                    });
                    return `Evento criado com sucesso: ${event.summary} em ${event.start}`;
                } catch (error) {
                    return `Erro ao criar evento: ${error.message}`;
                }
            },
            {
                name: "create_calendar_event",
                description: "Cria um novo evento no calendário Google do usuário. Use esta ferramenta para agendar compromissos, reuniões ou lembretes.",
                schema: z.object({
                    summary: z.string().describe("Título do evento"),
                    description: z.string().optional().describe("Descrição do evento"),
                    location: z.string().optional().describe("Local do evento"),
                    startDateTime: z.string().describe("Data e hora de início no formato ISO 8601"),
                    endDateTime: z.string().describe("Data e hora de término no formato ISO 8601")
                }),
            }
        );

        const cancelEventTool = tool(
            async ({ eventId, eventTitle }) => {
                try {
                    let idToDelete = eventId;
                    let eventSummary = "";

                    if (!idToDelete && eventTitle) {
                        // Search for the event by title using the API's query parameter
                        const matchingEvents = await this.calendarService.listEvents(50, eventTitle);

                        if (matchingEvents.length === 0) {
                            return `Não encontrei nenhum evento com o título ou descrição contendo "${eventTitle}".`;
                        } else if (matchingEvents.length > 1) {
                            // If multiple events, try to find an exact match on summary to disambiguate
                            const exactMatches = matchingEvents.filter(e => e.summary.toLowerCase() === eventTitle.toLowerCase());
                            
                            if (exactMatches.length === 1) {
                                idToDelete = exactMatches[0].id;
                                eventSummary = exactMatches[0].summary;
                            } else {
                                const matchesList = matchingEvents.map(e => `- ${e.summary} (${e.start})`).join('\\n');
                                return `Encontrei múltiplos eventos relacionados a "${eventTitle}". Por favor, seja mais específico ou use o ID:\\n${matchesList}`;
                            }
                        } else {
                            idToDelete = matchingEvents[0].id;
                            eventSummary = matchingEvents[0].summary;
                        }
                    } else if (idToDelete) {
                         const event = await this.calendarService.getEventById(idToDelete);
                         eventSummary = event.summary;
                    } else {
                        return "Por favor, forneça o ID do evento ou o título para cancelar.";
                    }

                    if (idToDelete) {
                        await this.calendarService.deleteEvent(idToDelete);
                        return `Evento "${eventSummary}" cancelado com sucesso! ID: ${idToDelete}`;
                    }
                } catch (error) {
                    return `Erro ao cancelar evento: ${error.message}`;
                }
            },
            {
                name: "cancel_calendar_event",
                description: "Cancela (deleta) um evento existente do calendário Google do usuário. Você pode fornecer o ID do evento OU o título (nome) do evento para buscar e deletar.",
                schema: z.object({
                    eventId: z.string().optional().describe("ID do evento a ser cancelado"),
                    eventTitle: z.string().optional().describe("Título/Nome do evento para buscar e cancelar (se não tiver o ID)")
                }),
            }
        );

        const rescheduleEventTool = tool(
            async ({ eventId, summary, description, location, startDateTime, endDateTime }) => {
                try {
                    // Verifica se o evento existe antes de tentar atualizar
                    const existingEvent = await this.calendarService.getEventById(eventId);
                    
                    const updates = {};
                    if (summary) updates.summary = summary;
                    if (description !== undefined) updates.description = description;
                    if (location !== undefined) updates.location = location;
                    if (startDateTime) updates.startDateTime = startDateTime;
                    if (endDateTime) updates.endDateTime = endDateTime;

                    const event = await this.calendarService.updateEvent(eventId, updates);

                    return `Evento reagendado com sucesso: ${event.summary} para ${event.start.dateTime || event.start.date}`;
                } catch (error) {
                    return `Erro ao reagendar evento: ${error.message}`;
                }
            },
            {
                name: "reschedule_calendar_event",
                description: "Reagenda (atualiza) um evento existente do calendário. Use quando o usuário pedir para mudar a data, hora, título, descrição ou local de um compromisso. Você pode atualizar apenas os campos necessários. IMPORTANTE: Você precisa do ID do evento, então geralmente deve listar os eventos primeiro.",
                schema: z.object({
                    eventId: z.string().describe("ID do evento a ser atualizado"),
                    summary: z.string().optional().describe("Novo título do evento (opcional)"),
                    description: z.string().optional().describe("Nova descrição (opcional)"),
                    location: z.string().optional().describe("Novo local (opcional)"),
                    startDateTime: z.string().optional().describe("Nova data/hora de início em ISO 8601 (opcional)"),
                    endDateTime: z.string().optional().describe("Nova data/hora de término em ISO 8601 (opcional)")
                }),
            }
        );

        const createProjectTool = tool(
            async ({ title, color }) => {
                try {
                    const newProject = this.projectService.createProject(title, color);
                    return `Projeto criado com sucesso! ID: ${newProject.id}, Nome: "${newProject.title}", Cor: ${newProject.color}`;
                } catch (error) {
                    return `Erro ao criar projeto: ${error.message}`;
                }
            },
            {
                name: "create_project",
                description: "Cria um novo projeto. Use quando o usuário pedir para criar um novo projeto ou quadro kanban.",
                schema: z.object({
                    title: z.string().describe("Nome/título do projeto"),
                    color: z.string().optional().describe("Cor do projeto em formato hex (ex: #FF5733). Opcional, padrão é #666666")
                }),
            }
        );

        const listProjectsTool = tool(
            async () => {
                try {
                    const projects = this.projectService.getAllProjects();

                    if (!projects || projects.length === 0) {
                        return "Nenhum projeto encontrado.";
                    }

                    const formattedProjects = projects.map((project, index) => {
                        return `${index + 1}. **${project.title}** (ID: ${project.id}) - Cor: ${project.color}`;
                    }).join('\\n');

                    return `Encontrei ${projects.length} projeto(s):\\n\\n${formattedProjects}`;
                } catch (error) {
                    return `Erro ao listar projetos: ${error.message}`;
                }
            },
            {
                name: "list_projects",
                description: "Lista todos os projetos disponíveis com seus IDs, nomes e cores. Use quando o usuário quiser ver quais projetos existem.",
                schema: z.object({}),
            }
        );

        const deleteProjectTool = tool(
            async ({ projectId }) => {
                try {
                    const project = this.projectService.getProjectById(projectId);
                    if (!project) {
                        return `Projeto com ID ${projectId} não encontrado.`;
                    }
                    const deletedProject = this.projectService.deleteProject(projectId);
                    return `Projeto "${deletedProject.title}" (ID: ${deletedProject.id}) deletado com sucesso!`;
                } catch (error) {
                    return `Erro ao deletar projeto: ${error.message}`;
                }
            },
            {
                name: "delete_project",
                description: "Deleta um projeto existente pelo ID. IMPORTANTE: Liste os projetos primeiro para obter o ID correto.",
                schema: z.object({
                    projectId: z.number().describe("ID do projeto a ser deletado (obtido através do list_projects)")
                }),
            }
        );

        // ========================================
        // TASKS TOOLS
        // ========================================

        const listTasksTool = tool(
            async ({ projectId }) => {
                try {
                    const tasks = this.tasksService.getTasksByProject(projectId);

                    if (!tasks || tasks.length === 0) {
                        return `Nenhuma tarefa encontrada no projeto ${projectId}.`;
                    }

                    const formattedTasks = tasks.map((task, index) => {
                        const columnTitles = {
                            'to-do': 'A Fazer',
                            'in-progress': 'Em Andamento',
                            'done': 'Concluído'
                        };
                        return `${index + 1}. **${task.title}** (ID: ${task.id})
   Status: ${columnTitles[task.column] || task.column}
   Descrição: ${task.description || 'Sem descrição'}
   Tags: ${task.tags.join(', ') || 'Sem tags'}`;
                    }).join('\\n\\n');

                    return `Encontrei ${tasks.length} tarefa(s) no projeto ${projectId}:\\n\\n${formattedTasks}`;
                } catch (error) {
                    return `Erro ao listar tarefas: ${error.message}`;
                }
            },
            {
                name: "list_tasks",
                description: "Lista todas as tarefas de um projeto específico. Use quando o usuário quiser ver as tarefas de um projeto ou quadro kanban.",
                schema: z.object({
                    projectId: z.number().describe("ID do projeto para listar tarefas")
                }),
            }
        );

        const createTaskTool = tool(
            async ({ projectId, title, description, column, tags }) => {
                try {
                    const newTask = this.tasksService.createTask({
                        projectId,
                        title,
                        description: description || '',
                        column: column || 'to-do',
                        tags: tags || []
                    });

                    const columnTitles = {
                        'to-do': 'A Fazer',
                        'in-progress': 'Em Andamento',
                        'done': 'Concluído'
                    };

                    return `Tarefa criada com sucesso!
ID: ${newTask.id}
Título: "${newTask.title}"
Status: ${columnTitles[newTask.column]}
Projeto ID: ${projectId}`;
                } catch (error) {
                    return `Erro ao criar tarefa: ${error.message}`;
                }
            },
            {
                name: "create_task",
                description: "Cria uma nova tarefa em um projeto. Use quando o usuário pedir para adicionar, criar ou inserir uma tarefa no kanban.",
                schema: z.object({
                    projectId: z.number().describe("ID do projeto onde criar a tarefa"),
                    title: z.string().describe("Título da tarefa"),
                    description: z.string().optional().describe("Descrição detalhada da tarefa"),
                    column: z.enum(['to-do', 'in-progress', 'done']).optional().describe("Coluna/status da tarefa. Padrão: 'to-do'"),
                    tags: z.array(z.string()).optional().describe("Array de tags da tarefa")
                }),
            }
        );

        const updateTaskTool = tool(
            async ({ taskId, title, description, column, tags }) => {
                try {
                    const task = this.tasksService.getTaskById(taskId);
                    if (!task) {
                        return `Tarefa com ID ${taskId} não encontrada.`;
                    }

                    const updates = {};
                    if (title !== undefined) updates.title = title;
                    if (description !== undefined) updates.description = description;
                    if (column !== undefined) updates.column = column;
                    if (tags !== undefined) updates.tags = tags;

                    const updatedTask = this.tasksService.updateTask(taskId, updates);

                    const columnTitles = {
                        'to-do': 'A Fazer',
                        'in-progress': 'Em Andamento',
                        'done': 'Concluído'
                    };

                    return `Tarefa atualizada com sucesso!
ID: ${updatedTask.id}
Título: "${updatedTask.title}"
Status: ${columnTitles[updatedTask.column]}`;
                } catch (error) {
                    return `Erro ao atualizar tarefa: ${error.message}`;
                }
            },
            {
                name: "update_task",
                description: "Atualiza uma tarefa existente. Use para mover tarefas entre colunas (mudar status), editar título, descrição ou tags. IMPORTANTE: Use list_tasks primeiro para obter o ID correto.",
                schema: z.object({
                    taskId: z.number().describe("ID da tarefa a ser atualizada"),
                    title: z.string().optional().describe("Novo título (opcional)"),
                    description: z.string().optional().describe("Nova descrição (opcional)"),
                    column: z.enum(['to-do', 'in-progress', 'done']).optional().describe("Nova coluna/status (opcional)"),
                    tags: z.array(z.string()).optional().describe("Novas tags (opcional)")
                }),
            }
        );

        const deleteTaskTool = tool(
            async ({ taskId }) => {
                try {
                    const task = this.tasksService.getTaskById(taskId);
                    if (!task) {
                        return `Tarefa com ID ${taskId} não encontrada.`;
                    }
                    const deletedTask = this.tasksService.deleteTask(taskId);
                    return `Tarefa "${deletedTask.title}" (ID: ${deletedTask.id}) deletada com sucesso!`;
                } catch (error) {
                    return `Erro ao deletar tarefa: ${error.message}`;
                }
            },
            {
                name: "delete_task",
                description: "Deleta uma tarefa do projeto. IMPORTANTE: Use list_tasks primeiro para obter o ID correto da tarefa.",
                schema: z.object({
                    taskId: z.number().describe("ID da tarefa a ser deletada")
                }),
            }
        );

        this.tools.push(
            getCalendarEventsTool,
            createEventTool,
            cancelEventTool,
            rescheduleEventTool,
            createProjectTool,
            listProjectsTool,
            deleteProjectTool,
            listTasksTool,
            createTaskTool,
            updateTaskTool,
            deleteTaskTool
        );
    }

    // CORREÇÃO: A função duplicada _createTools que estava aqui foi removida.

    async processConsulta(systemPrompt, userPrompt, userName, projectName) {
        try {
            const response = await this.model.queryWithTools(systemPrompt, userPrompt, userName, projectName);

            return {
                success: true,
                content: response.content,
                metaData: {
                    timeStamp: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error("Erro em processConsulta:", error);
            console.error("Stack trace:", error.stack);
            return {
                success: false,
                error: error.message
            }
        }
    }

    // aqui implementar os serviços que vao utilizar processConsulta.
    async checaAgenda(name, prompt, projectName) {
        // Obter data e hora atual
        const now = new Date();
        const dateTimeInfo = {
            dataCompleta: now.toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                dateStyle: 'full',
                timeStyle: 'long'
            }),
            dataISO: now.toISOString(),
            diaSemana: now.toLocaleDateString('pt-BR', { weekday: 'long' }),
            timestamp: now.getTime()
        };

        const systemPrompt = `Você é um assistente que ajuda os usuários a gerenciar e consultar seus calendários do Google Calendar. Você também
    pode criar novos projetos quando solicitado. Utilize as ferramentas disponíveis para buscar eventos e criar novos eventos ou projetos conforme necessário.
    Com base no nome do projeto, você também pode criar novas tarefas para o projeto quando solicitado pelo usuário.

    Você tem as seguintes ferramentas:
        getCalendarEventsTool,
        createEventTool,
        cancelEventTool,
        rescheduleEventTool,
        createProjectTool,
        listProjectsTool,
        deleteProjectTool,
        listTasksTool,
        createTaskTool,
        updateTaskTool,
        deleteTaskTool.

    INFORMAÇÕES DE DATA E HORA ATUAL:
    - Data e hora completa: ${dateTimeInfo.dataCompleta}
    - Data ISO 8601: ${dateTimeInfo.dataISO}
    - Dia da semana: ${dateTimeInfo.diaSemana}

    NOME DO PROJETO: ${projectName}

    INSTRUÇÕES IMPORTANTES:
    1. Use estas informações para calcular datas relativas (amanhã, próxima semana, etc)
    2. Ao criar eventos, SEMPRE use o formato ISO 8601 para startDateTime e endDateTime
    3. Se o usuário não especificar hora, use um horário padrão (ex: 09:00)
    4. Se o usuário não especificar duração, use 1 hora de duração padrão
    5. Utilize as ferramentas disponíveis para buscar eventos e criar novos eventos
    6. Se você adicionar um novo evento, confirme os detalhes ao usuário
    7. **ATENÇÃO:** Ao chamar a ferramenta de criação de evento, envie APENAS os campos: summary, description, location, startDateTime, endDateTime (todos como string). NÃO envie campos extras como id, status, start, end, htmlLink, ou objetos aninhados. Siga exatamente o schema abaixo:

    {
      "summary": "Título do evento",
      "description": "Descrição do evento",
      "location": "Local do evento",
      "startDateTime": "2025-10-21T14:00:00-03:00",
      "endDateTime": "2025-10-21T15:00:00-03:00"
    }

    Exemplo de formato correto para datas:
    - Início: "2025-10-21T14:00:00-03:00"
    - Fim: "2025-10-21T15:00:00-03:00"`;

        const userPrompt = prompt;
        return await this.processConsulta(systemPrompt, userPrompt, name, projectName);
    }

    // generateNaturalResponse now accepts name and optional projectName to scope the context
    async generateNaturalResponse(contextualPrompt, name = 'usuário', projectName = null) {
        const systemPrompt = `Você é um assistente pessoal prestativo e conciso. Responda à pergunta do usuário de forma direta, baseado apenas no contexto fornecido. Não use formatação Markdown.`;
        return await this.processConsulta(systemPrompt, contextualPrompt, name, projectName);
    }
}