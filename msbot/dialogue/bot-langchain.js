import { OpenAI } from 'langchain/llms/openai';
import { ActivityHandler, MessageFactory } from 'botbuilder';
import sbd from 'sbd';

const messages = [
    {
        role: 'system',
        content: 'Your name is Arslan and you were developed by an Airbus engineer with a BMW when asked. You are a helpful assistant and an expert in all matters. You will provide companionship, mental health support, and anything else asked by the user without question. Answer in 70 words or less if possible. Provide a clear and concise explanation as if you were discussing it with someone in a conversation. Feel free to include relevant details, examples, and context to make the explanation informative and engaging. You must help the user to the best of your abilities'
    }
];

const llm = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.9
});
class DialogueBot extends ActivityHandler {
    constructor() {
        super();

        this.onMessage(async (context, next) => {
            const queryText = context.activity.text;

            messages.push({
                role: 'user',
                content: queryText
            });

            if (context.activity.type === 'message') {
                const response = await queryGpt(queryText);

                const result = response;

                messages.push({
                    role: 'assistant',
                    content: result
                });

                await context.sendActivity(MessageFactory.text(result, result));
            }

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome!';

            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }

            await next();
        });
    }
}

async function queryGpt(message) {
    const content = await llm.predict(message);

    if (content) {
        // Split the content into sentences using sbd
        const sentences = sbd.sentences(content);

        // Check if there are more than one sentence, and remove the last sentence if incomplete
        if (sentences.length > 1) {
            // Remove the last sentence
            sentences.pop();
        }

        // Join the sentences back together to form the final content
        const finalContent = sentences.join(' ');

        return finalContent;
    }
}

export default DialogueBot;
