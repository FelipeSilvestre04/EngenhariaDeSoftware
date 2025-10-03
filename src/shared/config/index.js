// configurações que serao consultadas

import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GROQ_API_KEY){
    throw new Error('GROQ_API_KEY is required!');
}

export const config = {
    server: {
        port: process.env.PORT || 3000,
    },
    llm: {
        apiKey: process.env.GROQ_API_KEY,
        defaultModel: 'openai/gpt-oss-120b',
        defaultTemperature: 0.3,
    },
};
