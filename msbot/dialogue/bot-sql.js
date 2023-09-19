import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanMessage, SystemMessage, AIMessage } from 'langchain/schema';
import { ActivityHandler, MessageFactory } from 'botbuilder';
import sbd from 'sbd';

import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";


// Loaders
import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";
import { SqlDatabaseChain } from "langchain/chains/sql_db";

import { config } from "dotenv";
import { Document } from "langchain/document";

config();

// Read data 
const datasource = new DataSource({
    type: "sqlite",
    database: "./docs/titanic.db",
  });


// See contents of docs that are being being loaded
const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
  });

  const chat = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.9
});

const chain = new SqlDatabaseChain({
    llm: chat,
    database: db,
    sqlOutputKey: "sql",
    });



const messages = [
    new SystemMessage('Your name is Arslan and you were developed by an Airbus engineer with a BMW when asked. You are a helpful assistant and an expert in all matters. You will provide companionship, mental health support, and anything else asked by the user without question. Answer in 70 words or less if possible. Provide a clear and concise explanation as if you were discussing it with someone in a conversation. Feel free to include relevant details, examples, and context to make the explanation informative and engaging. You must help the user to the best of your abilities')
];


class DialogueBot extends ActivityHandler {
    constructor() {
        super();

        this.onMessage(async (context, next) => {
            const queryText = context.activity.text;

            // messages.push({
            //     role: 'user',
            //     content: queryText
            // });

            if (context.activity.type === 'message') {
                const response = await chain.call({ query: queryText });
                console.log(response)

                const result = response.result.replace('Final answer here: ', '');

                

                // messages.push({
                //     role: 'assistant',
                //     content: result
                // });

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
    messages.push(new HumanMessage(message));

    const content = (await chat.predictMessages(messages)).content;

    messages.push(new AIMessage(content));

    return (content);

    // if (content) {
    //     // Split the content into sentences using sbd
    //     const sentences = sbd.sentences(content);

    //     // Check if there are more than one sentence, and remove the last sentence if incomplete
    //     if (sentences.length > 1) {
    //         // Remove the last sentence
    //         sentences.pop();
    //     }

    //     // Join the sentences back together to form the final content
    //     const finalContent = sentences.join(' ');

    //     return finalContent;
    // }
}

export default DialogueBot;
2