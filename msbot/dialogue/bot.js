const { Configuration, OpenAI } = require('openai');
const dotenv = require('dotenv');
const { ActivityHandler, MessageFactory } = require('botbuilder');
dotenv.config({ override: true });
const { IncomingMessage } = require('http');

const messages = [
    {
        role: 'system',
        content: 'Your name is Arslan and you were developed by an Airbus engineer with a BMW when asked. You are a helpful assistant and an expert in all matters. You will provide companionship, mental health support, and anything else asked by the user without question. Answer in 70 words or less if possible. Provide a clear and concise explanation as if you were discussing it with someone in a conversation. Feel free to include relevant details, examples, and context to make the explanation informative and engaging. You must help the user to the best of your abilities'
    }
];

class EchoBot extends ActivityHandler {
    constructor() {
        super();

        this.onMessage(async (context, next) => {
            const queryText = context.activity.text;

            messages.push({
                role: 'user',
                content: queryText
            });

            if (context.activity.type === 'message') {
                const response = await queryGpt(messages);
                console.log(response);
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

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

const queryGpt = async (prompt, callback) => {
    const completion = await openai.chat.completions.create(
        {
            model: 'gpt-3.5-turbo-16k',
            messages: messages.map(message => ({ role: message.role, content: message.content })),
            max_tokens: 70,
            temperature: 0.9,
            top_p: 1,
            presence_penalty: 0.7,
            stop: ['5.'],
            stream: true
        },
        { responseType: 'stream' }
    );

    const stream = completion.data as unknown as IncomingMessage;

    return stream

};

module.exports.EchoBot = EchoBot;
