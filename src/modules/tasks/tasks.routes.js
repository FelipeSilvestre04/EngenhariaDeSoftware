import express from 'express';
import { TasksController } from './tasks.controller.js';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware.js';
import { config } from '../../shared/config/index.js';

const router = express.Router();
const controller = new TasksController();
const authMiddleware = createAuthMiddleware(config);

// Rotas REST para tarefas (protegidas por autenticação)
router.get('/', authMiddleware.authenticate(), (req, res) => controller.getByProject(req, res));
router.post('/', authMiddleware.authenticate(), (req, res) => controller.create(req, res));
router.put('/:id', authMiddleware.authenticate(), (req, res) => controller.update(req, res));
router.delete('/:id', authMiddleware.authenticate(), (req, res) => controller.delete(req, res));

export default router;

