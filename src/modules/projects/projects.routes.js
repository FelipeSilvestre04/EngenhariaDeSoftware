import express from 'express';
import { ProjectsController } from './projects.controller.js';

const router = express.Router();
const controller = new ProjectsController();

// Rotas REST para projetos
router.get('/', (req, res) => controller.getAll(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

export default router;
