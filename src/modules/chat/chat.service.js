import { db } from '../../shared/database/index.js';
import { ProjectsService } from '../projects/projects.service.js';

export class ChatService {
    constructor() {
        this.projectsService = new ProjectsService();
    }

    async getHistory(userId, projectId = null) {
        let targetProjectId = projectId;

        // SE LÓGICA DO CHAT GERAL:
        // Se não veio projectId, assumimos que é o Chat Geral e buscamos o Projeto Fantasma
        if (!targetProjectId) {
            targetProjectId = await this.projectsService.getIdByName(userId, 'Projeto Fantasma');
            
            if (!targetProjectId) {
                // Se o usuário acabou de ser criado e o trigger falhou, ou algo assim
                return []; 
            }
        }

        const query = `
            SELECT message, sent_date
            FROM chat 
            WHERE project_id = $1 AND user_id = $2
            ORDER BY sent_date ASC, chat_id ASC
        `;
        
        const result = await db.query(query, [targetProjectId, userId]);
        
        // Formata para o padrão que o React espera
        return result.rows.map(row => {
            let sender = 'ai';
            let text = row.message;

            // Remove os prefixos que salvamos no LLMModel
            if (text.startsWith('User: ')) {
                sender = 'user';
                text = text.substring(6); // Remove "User: "
            } else if (text.startsWith('AI: ')) {
                sender = 'ai';
                text = text.substring(4); // Remove "AI: "
            }

            return {
                id: Math.random().toString(36), // ID temporário para lista do React
                text: text,
                sender: sender,
                timestamp: row.sent_date
            };
        });
    }
}