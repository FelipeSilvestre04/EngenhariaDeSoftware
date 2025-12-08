// src/modules/llm/controllers/LLMController.js
import { LLMService } from "../services/LLMService.js";

export class LLMController {
    constructor(config, calendarService) {
        this.llmService = new LLMService(config.llm.apiKey, calendarService);
        this.llmService.createModel(config.llm.defaultTemperature, config.llm.defaultModel);
    }

    async handleConsulta(req, res) {
        try {
            console.log('🔵 [LLMController] Recebendo requisição...');

            // Usa dados do usuário autenticado pelo middleware
            const user = req.user || {};
            const userId = req.userId;

            // Pega o nome do usuário autenticado ou fallback para query param
            const url = new URL(req.url, `http://${req.headers.host}`);
            const name = user.name || url.searchParams.get('name') || 'usuário';
            const projectName = url.searchParams.get('project') || 'projeto';

            console.log(`👤 [LLMController] Usuário autenticado: ${name} (${userId})`);

            // O Express já parseou o body, então usamos req.body diretamente
            const prompt = req.body.prompt;
            console.log('📝 [LLMController] Prompt recebido:', prompt);

            if (!prompt) {
                throw new Error('Prompt não fornecido');
            }

            console.log('⏳ [LLMController] Processando com LLM...');
            const result = await this.llmService.checaAgenda(userId, name, prompt, projectName);
            console.log('✅ [LLMController] Resposta do LLM:', result);

            // Log detalhado para debug
            if (result.steps && result.steps.length > 0) {
                console.log(`🔧 [LLMController] Tools executadas (${result.totalToolCalls}):`);
                result.steps.forEach((step, idx) => {
                    console.log(`   ${idx + 1}. Tool: ${step.tool}, Args:`, step.args);
                });
            } else {
                console.log('⚠️ [LLMController] NENHUMA TOOL FOI EXECUTADA pela LLM');
            }

            // cria resposta http
            if (result.success) {
                console.log('📤 [LLMController] Enviando resposta de sucesso');

                let hasDraft = false;
                let draftData = null;
                let cleanedContent = result.content;

                // MÉTODO 1: Verificar se a tool create_email_draft foi executada (mais confiável)
                if (result.steps && result.steps.length > 0) {
                    const emailDraftStep = result.steps.find(step => step.tool === 'create_email_draft');
                    if (emailDraftStep && emailDraftStep.args) {
                        console.log('📧 [LLMController] Tool create_email_draft detectada nos steps!');
                        draftData = {
                            to: emailDraftStep.args.to,
                            subject: emailDraftStep.args.subject,
                            body: emailDraftStep.args.body
                        };
                        hasDraft = true;
                        console.log('✅ [LLMController] Dados do rascunho extraídos:', draftData);
                    }
                }

                // MÉTODO 2: Fallback - detectar formato /email no content
                if (!hasDraft && result.content && result.content.includes('/email')) {
                    console.log('📧 [LLMController] Detectando /email no content...');
                    const emailCommandRegex = /\/email\s+([^\s|]+)\s*\|\s*([^|]+)\s*\|\s*(.+)/s;
                    const match = result.content.match(emailCommandRegex);
                    if (match) {
                        draftData = {
                            to: match[1].trim(),
                            subject: match[2].trim(),
                            body: match[3].trim()
                        };
                        hasDraft = true;
                        console.log('✅ [LLMController] Dados extraídos do /email:', draftData);
                    }
                }

                console.log('📦 [LLMController] Enviando resposta - hasDraft:', hasDraft, 'draftData:', draftData);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    question: `${prompt}`,
                    answer: cleanedContent,
                    user: { name: name, userId: userId },
                    hasDraft: hasDraft,
                    draft: draftData
                }));
            } else {
                console.log('❌ [LLMController] Erro no processamento:', result.error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: result.error }));
            }

        } catch (error) {
            console.error("❌ [LLMController] Erro detalhado no handleQuery:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Desculpe, algo deu errado: ${error.message}` }));
        }
    }

}