import {LLMModel} from "../models/LLMModel.js"
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ProjectsService } from "../../projects/projects.service.js";

// o serviço é o que vai ser usado pelo controller. ele executará o modelo 
// e irá usá-lo para entregar um serviço específico.

export class LLMService{
    constructor(apiKey, calendarService){
        this.model = new LLMModel(apiKey);
        this.calendarService = calendarService;
        this.projectService = new ProjectsService();
        this.tools = [];
    }

    // CORREÇÃO 1: Removido 'async'
    createModel(temperature, modelName){
        // CORREÇÃO 2: Removido 'await'
        this._createTools();
        this.model.initialize(modelName, temperature, this.tools);
    }

    // CORREÇÃO 3: Removido 'async'
    _createTools(){
        const getCalendarEventsTool = tool(
            async ({maxResults = 10}) => {
                try {
                    const events = await this.calendarService.listEvents(maxResults);

                    if (!events || events.length === 0) {
                        return "Nenhum evento encontrado no calendário.";
                    }

                    const formattedEvents = events.map((event, index) => {
                        // Os eventos já vêm processados com start e end como strings
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
                        
                        // Monta a informação do evento de forma estruturada
                        let eventInfo = `${index + 1}. **${event.summary || 'Sem título'}**\n   ${dateInfo}`;
                        
                        if (event.description && event.description.trim()) {
                            eventInfo += `\n   Descrição: ${event.description}`;
                        }
                        
                        if (event.location && event.location.trim()) {
                            eventInfo += `\n   Local: ${event.location}`;
                        }
                        
                        return eventInfo;
                    }).join('\n\n');

                    return `Encontrei ${events.length} evento(s) no calendário:\n\n${formattedEvents}`;
                } catch (error) {
                    return `Erro ao buscar eventos: ${error.message}`;
                }
            },
            {
                name: "get_calendar_events",
                description: "Busca eventos do calendário Google do usuário. Use esta ferramenta quando precisar verificar a agenda, compromissos ou eventos marcados. Retorna informações detalhadas incluindo datas, horários, descrições e locais.",
                schema: z.object({
                    maxResults: z.number().optional().default(10).describe("Número máximo de eventos a retornar")
                }),
            }
        );

        const createEventTool = tool(
            async ({summary, description, location, startDateTime, endDateTime}) => {
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

        const createProjectTool = tool(
            async ({projectName}) => {
                // Simula a criação de um projeto
                const newProject = await this.projectService.createProject(projectName);
                return `Projeto criado com sucesso: ID ${newProject.id}, Nome: ${newProject.title}`;
            },
            {
                name: "create_project",
                description: "Cria um novo projeto com o nome fornecido.",
                schema: z.object({
                    projectName: z.string().describe("Nome do projeto a ser criado")
                }),
            }
        );

        this.tools.push(getCalendarEventsTool, createEventTool, createProjectTool);
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
        } catch (error){
            console.error("Erro em processConsulta:", error);
            console.error("Stack trace:", error.stack);
            return {
                success: false,
                error: error.message
            }
        }
    }

    // aqui implementar os serviços que vao utilizar processConsulta.
    async checaAgenda(name, prompt, projectName){
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

    INFORMAÇÕES DE DATA E HORA ATUAL:
    - Data e hora completa: ${dateTimeInfo.dataCompleta}
    - Data ISO 8601: ${dateTimeInfo.dataISO}
    - Dia da semana: ${dateTimeInfo.diaSemana}

    PROJETO: ${projectName}

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