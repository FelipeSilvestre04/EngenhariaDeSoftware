/*import { LLMModel } from "../models/LLMModel.js"
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

        // ========================================
        // GMAIL TOOLS
        // ========================================

        const listEmailsTool = tool(
            async ({ maxResults = 10 }) => {
                try {
                    const emails = await this.calendarService.listEmails(maxResults);

                    if (!emails || emails.length === 0) {
                        return "Nenhum email encontrado na caixa de entrada.";
                    }

                    const formattedEmails = emails.map((email, index) => {
                        return `${index + 1}. De: ${email.from}
   Assunto: ${email.subject}
   Data: ${email.date}
   Prévia: ${email.snippet}`;
                    }).join('\n\n');

                    return `Encontrei ${emails.length} email(s) na caixa de entrada:\n\n${formattedEmails}`;
                } catch (error) {
                    return `Erro ao listar emails: ${error.message}`;
                }
            },
            {
                name: "list_emails",
                description: "Lista os emails mais recentes da caixa de entrada do Gmail. Use quando o usuário quiser ver seus emails ou verificar mensagens recebidas.",
                schema: z.object({
                    maxResults: z.number().optional().default(10).describe("Número máximo de emails a retornar (padrão: 10)")
                }),
            }
        );

        const createEmailDraftTool = tool(
            async ({ to, subject, body }) => {
                try {
                    // Retorna no formato de comando que o ChatWindow detecta
                    return `/email ${to} | ${subject} | ${body}

Rascunho de email criado com sucesso!`;
                } catch (error) {
                    return `Erro ao criar rascunho de email: ${error.message}`;
                }
            },
            {
                name: "create_email_draft",
                description: "Cria rascunho de email. Use quando usuário pedir para criar/gerar/compor email.",
                schema: z.object({
                    to: z.string().describe("Email do destinatário"),
                    subject: z.string().describe("Assunto"),
                    body: z.string().describe("Corpo do email")
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
            deleteTaskTool,
            listEmailsTool,
            createEmailDraftTool
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

        const systemPrompt = `Você é um assistente que ajuda os usuários a gerenciar seus calendários e emails.

    DATA/HORA ATUAL: ${dateTimeInfo.dataCompleta}
    PROJETO: ${projectName}

    🚨 REGRA CRÍTICA PARA EMAILS 🚨
    
    Quando usuário pedir email, você DEVE começar sua resposta EXATAMENTE com o comando /email:
    
    FORMATO OBRIGATÓRIO:
    /email destinatario@exemplo.com | Assunto | Corpo
    
    EXEMPLOS CORRETOS:
    
    Usuário: "crie email para joao@teste.com sobre reunião"
    Você: /email joao@teste.com | Reunião | Olá João, gostaria de marcar uma reunião.
    
    Pronto! Criei o rascunho.
    
    Usuário: "mande email para maria@empresa.com dizendo olá"
    Você: /email maria@empresa.com | Olá | Olá Maria, tudo bem?
    
    Email criado!
    
    ⚠️ IMPORTANTE: A primeira linha da sua resposta DEVE ser o comando /email. Não descreva o que fez, EXECUTE o comando primeiro.
    
    OUTRAS INSTRUÇÕES:
    - Eventos: use ISO 8601 para datas
    - Use ferramentas disponíveis para calendário e projetos`;

        const userPrompt = prompt;
        return await this.processConsulta(systemPrompt, userPrompt, name, projectName);
    }

    // generateNaturalResponse now accepts name and optional projectName to scope the context
    async generateNaturalResponse(contextualPrompt, name = 'usuário', projectName = null) {
        const systemPrompt = `Você é um assistente pessoal prestativo e conciso. Responda à pergunta do usuário de forma direta, baseado apenas no contexto fornecido. Não use formatação Markdown.`;
        return await this.processConsulta(systemPrompt, contextualPrompt, name, projectName);
    }
}*/
import { LLMModel } from "../models/LLMModel.js"
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ProjectsService } from "../../projects/projects.service.js";
import { TasksService } from "../../tasks/tasks.service.js";

export class LLMService {
    constructor(apiKey, calendarService) {
        this.model = new LLMModel(apiKey);
        this.calendarService = calendarService;
        this.projectService = new ProjectsService();
        this.tasksService = new TasksService();
    }

    // Inicializa o modelo (chamado no Controller)
    createModel(temperature, modelName) {
        // Agora apenas inicializa a instância do modelo, sem tools fixas
        this.model.initialize(modelName, temperature, []);
    }

    // GERA AS TOOLS COM O CONTEXTO DO USUÁRIO (userId)
    createToolsForUser(userId) {

        // ========================================
        // 📅 CALENDAR TOOLS
        // ========================================
        const getCalendarEventsTool = tool(
            async ({ maxResults = 10, query }) => {
                try {
                    // Garante que o serviço use o usuário atual
                    await this.calendarService.initialize(userId);
                    const events = await this.calendarService.listEvents(maxResults, query);

                    if (!events || events.length === 0) {
                        return query
                            ? `Nenhum evento encontrado para a busca "${query}".`
                            : "Nenhum evento encontrado no calendário.";
                    }

                    const formattedEvents = events.map((event, index) => {
                        const startDateTime = event.start;
                        const endDateTime = event.end;
                        let dateInfo = 'Horário: Não especificado';

                        if (startDateTime) {
                            const startDate = new Date(startDateTime);
                            const endDate = endDateTime ? new Date(endDateTime) : null;
                            const hasTime = startDateTime.includes('T');

                            if (!hasTime) {
                                dateInfo = `Data: ${startDate.toLocaleDateString('pt-BR')} (dia inteiro)`;
                            } else {
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

                        let eventInfo = `${index + 1}. **${event.summary || 'Sem título'}**\n   ID: ${event.id}\n   ${dateInfo}`;
                        if (event.description) eventInfo += `\n   Descrição: ${event.description}`;
                        if (event.location) eventInfo += `\n   Local: ${event.location}`;
                        return eventInfo;
                    }).join('\n\n');

                    return `Encontrei ${events.length} evento(s):\n\n${formattedEvents}`;
                } catch (error) {
                    return `Erro ao buscar eventos: ${error.message}`;
                }
            },
            {
                name: "get_calendar_events",
                description: "Busca eventos do calendário Google. Filtre por 'query' para achar eventos específicos.",
                schema: z.object({
                    maxResults: z.number().optional().default(10),
                    query: z.string().optional().describe("Termo de busca (ex: 'Reunião')")
                }),
            }
        );

        const createEventTool = tool(
            async (args) => {
                try {
                    await this.calendarService.initialize(userId);
                    const event = await this.calendarService.createEvent(args);
                    return `Evento criado com sucesso: ${event.summary} em ${event.start.dateTime || event.start.date}`;
                } catch (error) {
                    return `Erro ao criar evento: ${error.message}`;
                }
            },
            {
                name: "create_calendar_event",
                description: "Cria novo evento no calendário.",
                schema: z.object({
                    summary: z.string().describe("Título do evento"),
                    description: z.string().optional(),
                    location: z.string().optional(),
                    startDateTime: z.string().describe("Início (ISO 8601)"),
                    endDateTime: z.string().describe("Fim (ISO 8601)")
                }),
            }
        );

        const cancelEventTool = tool(
            async ({ eventId }) => {
                try {
                    await this.calendarService.initialize(userId);
                    await this.calendarService.deleteEvent(eventId);
                    return `Evento cancelado com sucesso! ID: ${eventId}`;
                } catch (error) {
                    return `Erro ao cancelar evento: ${error.message}`;
                }
            },
            {
                name: "cancel_calendar_event",
                description: "Cancela um evento pelo ID. Liste os eventos antes para pegar o ID.",
                schema: z.object({
                    eventId: z.string().describe("ID do evento")
                }),
            }
        );

        const rescheduleEventTool = tool(
            async (args) => {
                try {
                    await this.calendarService.initialize(userId);
                    const { eventId, ...updates } = args;
                    const event = await this.calendarService.updateEvent(eventId, updates);
                    return `Evento reagendado: ${event.summary}`;
                } catch (error) {
                    return `Erro ao reagendar: ${error.message}`;
                }
            },
            {
                name: "reschedule_calendar_event",
                description: "Atualiza/Reagenda um evento existente.",
                schema: z.object({
                    eventId: z.string().describe("ID do evento"),
                    summary: z.string().optional(),
                    description: z.string().optional(),
                    location: z.string().optional(),
                    startDateTime: z.string().optional(),
                    endDateTime: z.string().optional()
                }),
            }
        );

        // ========================================
        // 🚀 PROJECT TOOLS (DATABASE)
        // ========================================
        const createProjectTool = tool(
            async ({ title, color }) => {
                try {
                    // INJEÇÃO DO USER ID
                    const newProject = await this.projectService.createProject(userId, title, color);
                    return `Projeto criado com sucesso! ID: ${newProject.id}, Nome: "${newProject.title}"`;
                } catch (error) {
                    return `Erro ao criar projeto: ${error.message}`;
                }
            },
            {
                name: "create_project",
                description: "Cria um novo projeto.",
                schema: z.object({
                    title: z.string().describe("Nome do projeto"),
                    color: z.string().optional().describe("Cor hex (ex: #FF5733)")
                }),
            }
        );

        const listProjectsTool = tool(
            async () => {
                try {
                    // INJEÇÃO DO USER ID
                    const projects = await this.projectService.getAllProjects(userId);
                    if (!projects || projects.length === 0) return "Nenhum projeto encontrado.";

                    const formatted = projects.map((p, i) =>
                        `${i + 1}. **${p.title}** (ID: ${p.id}) - Cor: ${p.color}`
                    ).join('\n');

                    return `Encontrei ${projects.length} projeto(s):\n\n${formatted}`;
                } catch (error) {
                    return `Erro ao listar projetos: ${error.message}`;
                }
            },
            {
                name: "list_projects",
                description: "Lista todos os projetos do usuário.",
                schema: z.object({}),
            }
        );

        const deleteProjectTool = tool(
            async ({ projectId }) => {
                try {
                    // INJEÇÃO DO USER ID
                    const deleted = await this.projectService.deleteProject(projectId, userId);
                    return `Projeto "${deleted.title}" (ID: ${deleted.id}) deletado com sucesso!`;
                } catch (error) {
                    return `Erro ao deletar projeto: ${error.message}`;
                }
            },
            {
                name: "delete_project",
                description: "Deleta um projeto pelo ID.",
                schema: z.object({
                    projectId: z.number().describe("ID do projeto")
                }),
            }
        );

        // ========================================
        // ✅ TASKS TOOLS (DATABASE)
        // ========================================
        const listTasksTool = tool(
            async ({ projectId }) => {
                try {
                    // INJEÇÃO DO USER ID
                    const tasks = await this.tasksService.getTasksByProject(projectId, userId);
                    if (!tasks || tasks.length === 0) return `Nenhuma tarefa no projeto ${projectId}.`;

                    const formatted = tasks.map((t, i) =>
                        `${i + 1}. **${t.title}** (ID: ${t.id})
   Status: ${t.column}
   Descrição: ${t.description || 'Sem descrição'}`
                    ).join('\n\n');

                    return `Tarefas do projeto ${projectId}:\n\n${formatted}`;
                } catch (error) {
                    return `Erro ao listar tarefas: ${error.message}`;
                }
            },
            {
                name: "list_tasks",
                description: "Lista tarefas de um projeto específico.",
                schema: z.object({
                    projectId: z.number().describe("ID do projeto")
                }),
            }
        );

        const createTaskTool = tool(
            async ({ projectId, title, description, column, tags }) => {
                try {
                    // INJEÇÃO DO USER ID
                    const newTask = await this.tasksService.createTask({
                        userId,
                        projectId,
                        title,
                        description,
                        column: column || 'to-do',
                        tags: tags || []
                    });
                    const tagsStr = tags && tags.length > 0 ? `, Tags: ${tags.join(', ')}` : '';
                    return `Tarefa criada! ID: ${newTask.id}, Título: "${newTask.title}", Coluna: ${newTask.column}${tagsStr}`;
                } catch (error) {
                    return `Erro ao criar tarefa: ${error.message}`;
                }
            },
            {
                name: "create_task",
                description: "Cria tarefa em um projeto. Use tags para categorizar. Colunas: 'to-do', 'in-progress', 'done'.",
                schema: z.object({
                    projectId: z.number().describe("ID do projeto onde criar a tarefa"),
                    title: z.string().describe("Título da tarefa"),
                    description: z.string().optional().describe("Descrição da tarefa"),
                    column: z.enum(['to-do', 'in-progress', 'done']).optional().describe("Coluna/status da tarefa"),
                    tags: z.array(z.string()).optional().describe("Lista de tags para categorizar a tarefa (ex: ['urgente', 'backend'])")
                }),
            }
        );

        const updateTaskTool = tool(
            async ({ taskId, projectId, currentColumn, ...updates }) => {
                try {
                    // INJEÇÃO DO USER ID + LÓGICA DE TROCA DE COLUNA
                    const updated = await this.tasksService.updateTask(
                        { taskId, projectId, userId, currentColumn },
                        updates
                    );
                    return `Tarefa atualizada com sucesso!`;
                } catch (error) {
                    return `Erro ao atualizar tarefa: ${error.message}`;
                }
            },
            {
                name: "update_task",
                description: "Atualiza tarefa. IMPORTANTE: Requer 'currentColumn' (onde ela está agora) e 'projectId' para funcionar.",
                schema: z.object({
                    taskId: z.number().describe("ID da tarefa"),
                    projectId: z.number().describe("ID do projeto da tarefa"),
                    currentColumn: z.string().describe("Nome da coluna ATUAL da tarefa (antes de mudar)"),
                    title: z.string().optional(),
                    description: z.string().optional(),
                    column: z.enum(['to-do', 'in-progress', 'done']).optional().describe("NOVA coluna (se for mover)")
                }),
            }
        );

        const deleteTaskTool = tool(
            async ({ taskId, projectId, currentColumn }) => {
                try {
                    // INJEÇÃO DO USER ID
                    await this.tasksService.deleteTask({
                        taskId, projectId, userId, currentColumn
                    });
                    return `Tarefa ${taskId} deletada com sucesso.`;
                } catch (error) {
                    return `Erro ao deletar tarefa: ${error.message}`;
                }
            },
            {
                name: "delete_task",
                description: "Deleta tarefa. Requer projectId e currentColumn para identificar no banco.",
                schema: z.object({
                    taskId: z.number(),
                    projectId: z.number(),
                    currentColumn: z.string().describe("Coluna onde a tarefa está")
                }),
            }
        );

        // ========================================
        // 📧 GMAIL TOOLS
        // ========================================
        const listEmailsTool = tool(
            async ({ maxResults = 10 }) => {
                try {
                    await this.calendarService.initialize(userId);
                    const emails = await this.calendarService.listEmails(maxResults);
                    if (!emails.length) return "Caixa de entrada vazia.";

                    return emails.map(e =>
                        `De: ${e.from}\nAssunto: ${e.subject}\nData: ${e.date}\nSnippet: ${e.snippet}`
                    ).join('\n\n');
                } catch (error) {
                    return `Erro ao ler emails: ${error.message}`;
                }
            },
            {
                name: "list_emails",
                description: "Lista últimos emails do Gmail.",
                schema: z.object({ maxResults: z.number().optional() })
            }
        );

        const createEmailDraftTool = tool(
            async ({ to, subject, body }) => {
                // Retorna JSON especial que o Controller intercepta para formatar bonito no front
                return `[EMAIL_DRAFT]
                {
                    "to": "${to}",
                    "subject": "${subject}",
                    "body": "${body.replace(/\n/g, '\\n')}"
                }
                [/EMAIL_DRAFT]`;
            },
            {
                name: "create_email_draft",
                description: "Gera rascunho de email.",
                schema: z.object({
                    to: z.string(),
                    subject: z.string(),
                    body: z.string()
                })
            }
        );

        // Retorna todas as ferramentas criadas para este usuário
        return [
            getCalendarEventsTool, createEventTool, cancelEventTool, rescheduleEventTool,
            createProjectTool, listProjectsTool, deleteProjectTool,
            listTasksTool, createTaskTool, updateTaskTool, deleteTaskTool,
            listEmailsTool, createEmailDraftTool
        ];
    }

    async processConsulta(systemPrompt, userPrompt, userName, projectName, tools) {
        try {
            // Passa as tools dinâmicas para o model
            const response = await this.model.queryWithTools(systemPrompt, userPrompt, userName, projectName, tools);

            return {
                success: true,
                content: response.content,
                steps: response.steps,
                totalToolCalls: response.totalToolCalls,
                metaData: { timeStamp: new Date().toISOString() }
            };
        } catch (error) {
            console.error("Erro em processConsulta:", error);
            return { success: false, error: error.message };
        }
    }

    // Método principal chamado pelo Controller
    async checaAgenda(userId, name, prompt, projectName) {
        const now = new Date();
        const dateTimeInfo = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' });

        const systemPrompt = `Você é a SecretarIA, uma assistente pessoal eficiente.
        
        DATA/HORA ATUAL: ${dateTimeInfo}
        USUÁRIO: ${name}
        PROJETO ATUAL: ${projectName || 'Nenhum'}

        DIRETRIZES:
        1. Use as ferramentas disponíveis para responder.
        2. Para tarefas/projetos, você AGORA TEM ACESSO AO BANCO DE DADOS. Use create/list/update/delete conforme pedido.
        3. Para mover tarefa no Kanban (ex: "passe a tarefa X para feito"), use 'update_task' mudando a coluna.
        4. Sempre responda de forma cordial e objetiva.
        `;

        // 1. Cria tools vinculadas ao userId
        const userTools = this.createToolsForUser(userId);

        // 2. Executa a consulta
        return await this.processConsulta(systemPrompt, prompt, name, projectName, userTools);
    }
}