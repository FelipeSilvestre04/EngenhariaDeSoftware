// src/modules/email/email.routes.js
import express from 'express';

export class EmailRoutes {
    constructor(calendarService) {
        this.calendarService = calendarService;
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.post('/send', async (req, res) => {
            try {
                console.log('📧 [EmailRoutes] Recebendo requisição de envio de email');

                const { to, subject, body } = req.body;

                // Validação básica
                if (!to || !subject || !body) {
                    return res.status(400).json({
                        success: false,
                        error: 'Campos obrigatórios: to, subject, body'
                    });
                }

                // Validação de email (regex simples)
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(to)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Endereço de email inválido'
                    });
                }

                console.log(`📤 [EmailRoutes] Enviando email para: ${to}`);

                // Delega para o CalendarService (que tem acesso ao Gmail API)
                const result = await this.calendarService.sendEmail({ to, subject, body });

                console.log('✅ [EmailRoutes] Email enviado com sucesso!');

                res.json({
                    success: true,
                    message: 'Email enviado com sucesso!',
                    data: result
                });
            } catch (error) {
                console.error('❌ [EmailRoutes] Erro ao enviar email:', error);
                res.status(500).json({
                    success: false,
                    error: error.message || 'Erro ao enviar email'
                });
            }
        });
    }

    getRouter() {
        return this.router;
    }
}
