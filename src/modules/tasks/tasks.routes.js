import express from 'express';
import { TasksController } from './tasks.controller.js';

const router = express.Router();
const controller = new TasksController();

// Rotas REST para tarefas
router.get('/', (req, res) => controller.getByProject(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.put('/:id', (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

export default router;
