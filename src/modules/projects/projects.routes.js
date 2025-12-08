import express from 'express';
import { ProjectsController } from './projects.controller.js';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware.js';
import { config } from '../../shared/config/index.js';

const router = express.Router();
const controller = new ProjectsController();
const authMiddleware = createAuthMiddleware(config);

// Rotas REST para projetos (protegidas por autenticação)
router.get('/', authMiddleware.authenticate(), (req, res) => controller.getAll(req, res));
router.get('/:id', authMiddleware.authenticate(), (req, res) => controller.getById(req, res));
router.post('/', authMiddleware.authenticate(), (req, res) => controller.create(req, res));
router.delete('/:id', authMiddleware.authenticate(), (req, res) => controller.delete(req, res));

export default router;

