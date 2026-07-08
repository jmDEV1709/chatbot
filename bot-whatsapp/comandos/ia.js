const OpenAI = require("openai");
const { groqApiKey, groqModel } = require("../config");

const client = new OpenAI({
    apiKey: groqApiKey,
    baseURL: "https://api.groq.com/openai/v1"
});

module.exports = async ({ args }) => {
    const prompt = args.join(" ").trim();

    if (!prompt) {
        return "Exemplo: ,ia explique o que é Node.js";
    }

    try {
        const response = await client.chat.completions.create({
            model: groqModel,
            messages: [
                {
                    role: "system",
                    content: "Responda em português brasileiro de forma clara e útil."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        return response.choices[0].message.content;

    } catch (error) {
        console.error(error);
        return "Erro ao consultar a IA.";
    }
};