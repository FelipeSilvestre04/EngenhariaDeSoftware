// configurações que serao consultadas

import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is required!');
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google Calendar credentials are required!')
}

if (!process.env.HFTOKEN) {
    throw new Error('HFTOKEN is required for embeddings!')
}

export const config = {
    server: {
        port: process.env.PORT || 3000,
    },
    llm: {
        apiKey: process.env.GROQ_API_KEY,
        defaultModel: 'moonshotai/kimi-k2-instruct-0905',
        defaultTemperature: 0.7,
        hfToken: process.env.HFTOKEN || '',
        // CORREÇÃO: Linha adicionada para o modelo de embeddings do HuggingFace
        modelHf: process.env.MODELHF || 'sentence-transformers/all-MiniLM-L6-v2'
    },
    googleCalendar: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // Tenta pegar da ENV, senão tenta construir com URL do Render, senão usa hardcoded da produção (como fallback de segurança para o usuário), e por ultimo localhost
        redirectUri: process.env.GOOGLE_REDIRECT_URI ||
            (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/auth/callback` : null) ||
            'https://engenhariadesoftware.onrender.com/auth/callback', // Fallback forçado conforme URL do usuário
        scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send'
        ]
    }
};