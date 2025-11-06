// configurações que serao consultadas

import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GROQ_API_KEY){
    throw new Error('GROQ_API_KEY is required!');
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET){
    throw new Error('Google Calendar credentials are required!')
}

export const config = {
    server: {
        port: process.env.PORT || 3000,
    },
    llm: {
        apiKey: process.env.GROQ_API_KEY,
        defaultModel: 'openai/gpt-oss-120b',
        defaultTemperature: 0.1,
        hfToken: process.env.hf_token || ''
    },
    googleCalendar: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${process.env.PORT || 3000}/calendar/oauth2callback`,
        scopes: ['https://www.googleapis.com/auth/calendar']
    }
};
