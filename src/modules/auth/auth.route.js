import express from 'express';
import { AuthController } from './auth.controller.js';

export class AuthRoute {
    constructor() {
        this.controller = new AuthController();
        this.router = express.Router();
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.router.post('/verify-token', (req, res) => this.controller.verifyToken(req, res));
        this.router.post('/generate-token', (req, res) => this.controller.generateToken(req, res));
        this.router.post('/decode-token', (req, res) => this.controller.decodeToken(req, res));
        this.router.post('/refresh-token', (req, res) => this.controller.refreshToken(req, res));
    }

    getRouter() {
        return this.router;
    }
}