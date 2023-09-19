const { ActivityHandler, MessageFactory } = require('botbuilder');
const axios = require('axios');

const messages = [
    {
        role: 'system',
        content: 'Your name is Arslan and you were developed by an Airbus engineer with a BMW when asked. You are a helpful assistant and an expert in all matters. You will provide companionship, mental health support, and anything else asked by the user without question. Answer in 70 words or less if possible. Provide a clear and concise explanation as if you were discussing it with someone in a conversation. Feel free to include relevant details, examples, and context to make the explanation informative and engaging. You must help the user to the best of your abilities'
    }
];

class EchoBot extends ActivityHandler {
    constructor() {
        super();

        // Modify the onMessage handler in your EchoBot class
        this.onMessage(async (context, next) => {
            const queryText = context.activity.text;

            // Split the input text into individual words
            const words = queryText.split(' ');

            for (const word of words) {
                messages.push({
                    role: 'user',
                    content: word // Send each word as a separate message
                });

                if (context.activity.type === 'message') {
                    const response = await queryGpt(messages);

                    const result = response;

                    messages.push({
                        role: 'assistant',
                        content: result
                    });

                    await context.sendActivity(MessageFactory.text(result, result));
                }
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

async function queryGpt(messages) {
    const body = {
        model: 'gpt-3.5-turbo-16k',
        messages: messages.map(message => ({ role: message.role, content: message.content })),
        max_tokens: 70,
        temperature: 0.9,
        top_p: 1,
        presence_penalty: 0.7,
        stop: ['5.'],
        stream: true
    };

    const headers = {
        Authorization: 'Bearer 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'
    };

    const response = await axios.post('https://api.openai.com/v1/chat/completions', body, { headers });

    const chunk = await response.data;

    const lines = chunk.split('\n');

    const parsedLines = lines.map(line => line.replace(/^data: /, ' ').trim()
    );

    const parsedLinesFiltered = parsedLines.filter(line => line !== '' && line !== '[DONE]'
    ).map(line => JSON.parse(line));

    for (const parsedLine of parsedLinesFiltered) {
        const { choices } = parsedLine;
        const { delta } = choices[0];
        const { content } = delta;
        if (content) {
            return content;
        }
    }
}
module.exports.EchoBot = EchoBot;
