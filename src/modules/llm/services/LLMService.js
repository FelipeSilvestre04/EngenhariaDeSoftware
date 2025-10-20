import {LLMModel} from "../models/LLMModel.js"
import { z } from "zod";
import { tool } from "@langchain/core/tools";

// o serviço é o que vai ser usado pelo controller. ele executará o modelo 
// e irá usá-lo para entregar um serviço específico.

export class LLMService{
    constructor(apiKey, calendarService){
        this.model = new LLMModel(apiKey);
        this.calendarService = calendarService;
        this.tools = [];
    }

    async createModel(temperature, modelName){
        await this._createTools();
        this.model.initialize(modelName, temperature, this.tools);
    }

    async _createTools(){
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

        this.tools.push(getCalendarEventsTool, createEventTool);
    }


    async processConsulta(systemPrompt, userPrompt){
        try {
            const response = await this.model.queryWithTools(systemPrompt, userPrompt);
            
            return {
                success: true,
                content: response.content,
                metaData: {
                    timeStamp: new Date().toISOString()
                }
            };
        } catch (error){
            return {
                success: false,
                error: error.message
            }
        }
    }

    // aqui implementar os serviços que vao utilizar processConsulta.
    async checaAgenda(){
        const systemPrompt = "Faça a consulta na agenda do usuário e diga se está vazia, com tarefas ou lotada."
        const userPrompt = `Como está a agenda do usuário? Me de quais as próximas atividades e o horário de cada uma`
        return await this.processConsulta(systemPrompt, userPrompt);
    }

}