import { AIMessage } from '@langchain/core/messages'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import type { Message } from 'ai'
import { createOpenAIToolsAgent, AgentExecutor } from 'langchain/agents'
import { SqlToolkit } from 'langchain/agents/toolkits/sql'
import { SqlDatabase } from 'langchain/sql_db'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DataSource } from 'typeorm'
import { MODELS } from '@/utils/constants'

const parsePostgresConnectionString = (
  url: string,
): {
  host: string
  port: number
  username: string
  password: string
  database: string
} => {
  const regex = /^postgres:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/(.+)$/
  const match = url.match(regex)
  if (!match) {
    throw new Error('Invalid PostgreSQL connection string')
  }

  return {
    username: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10) || 5432,
    database: match[5],
  }
}

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json()
    const messages: Message[] = body.messages
    const databaseUrl: string = body.databaseUrl || process.env.DB_CONNECTION_URL

    const dialect = 'postgres'

    if (!messages?.length) {
      throw new Error('Messages are missing')
    }

    if (!databaseUrl) {
      return NextResponse.json({ error: 'No DB_CONNECTION_URL was provided' }, { status: 400 })
    }

    const userMessages = messages.filter((msg) => msg.role === 'user')
    const userQuestion = userMessages[userMessages.length - 1]?.content

    if (!userQuestion) {
      throw new Error('User question was empty')
    }

    const postgresConfig = parsePostgresConnectionString(databaseUrl)

    const datasource = new DataSource({
      type: dialect,
      host: postgresConfig.host,
      port: postgresConfig.port,
      username: postgresConfig.username,
      password: postgresConfig.password,
      database: postgresConfig.database,
      logging: false,
      synchronize: true,
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
    })

    const db = await SqlDatabase.fromDataSourceParams({ appDataSource: datasource })

    const llm = new ChatOpenAI({ modelName: MODELS.gpt4, temperature: 0 })

    const sqlToolKit = new SqlToolkit(db, llm)
    const tools = sqlToolKit.getTools()
    const SQL_PREFIX = `You are an agent designed to interact with a SQL database.
    Given an input question, create a syntactically correct {dialect} query to run, then look at the results of the query and return the answer.
    Unless the user specifies a specific number of examples they wish to obtain, always limit your query to at most {top_k} results using the LIMIT clause.
    You can order the results by a relevant column to return the most interesting examples in the database.
    Never query for all the columns from a specific table, only ask for a the few relevant columns given the question.
    You have access to tools for interacting with the database.
    Only use the below tools.
    Only use the information returned by the below tools to construct your final answer.
    You MUST double check your query before executing it. If you get an error while executing a query, rewrite the query and try again.
    
    DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.

    DOUBLE CHECK that you use the correct syntax for {dialect} and wrote the table and column names correctly.

    If the question does not seem related to the database, just return "I don't know" as the answer.`
    const SQL_SUFFIX = `Begin!
    
    Question: {input}
    Thought: I should look at the tables in the database to see what I can query.
    {agent_scratchpad}`
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SQL_PREFIX],
      HumanMessagePromptTemplate.fromTemplate('{input}'),
      new AIMessage(SQL_SUFFIX.replace('{agent_scratchpad}', '')),
      new MessagesPlaceholder('agent_scratchpad'),
    ])
    const newPrompt = await prompt.partial({
      dialect: dialect,
      top_k: '10',
    })
    const runnableAgent = await createOpenAIToolsAgent({
      llm,
      tools,
      prompt: newPrompt,
    })
    const agentExecutor = new AgentExecutor({
      agent: runnableAgent,
      tools,
    })

    const response = await agentExecutor.invoke({
      input: userQuestion,
    })

    return NextResponse.json(response.output)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const errMsg = e instanceof Error ? e.message : e.toString()
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
