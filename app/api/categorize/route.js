  import { NextResponse } from 'next/server'
  import { ChatGroq } from '@langchain/groq'
  import { StateGraph, END, START, Annotation } from '@langchain/langgraph'

  // Define the "shape" of data that flows through our graph
  const GraphState = Annotation.Root({
    description: Annotation(),
    category: Annotation(),
  })

  // The AI model we'll use (free via Groq)
  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
     model: 'openai/gpt-oss-20b',
    temperature: 0,
  })

  // The list of categories we want AI to choose from
  const CATEGORIES = [
    'Food', 'Rent', 'Transport', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Health', 'Salary', 'Groceries', 'Other'
  ]

  // This is our single LangGraph "node" — it takes the description and returns a category
  async function categorizeNode(state) {
    const prompt = `You are a financial categorization assistant.
  Given this transaction description: "${state.description}"
  Pick the single best matching category from this exact list: ${CATEGORIES.join(', ')}.
  Reply with ONLY the category name, nothing else.`

    const response = await model.invoke(prompt)
    const category = response.content.trim()

    return { category }
  }

  // Build the graph: one node, start -> categorize -> end
  const workflow = new StateGraph(GraphState)
    .addNode('categorize', categorizeNode)
    .addEdge(START, 'categorize')
    .addEdge('categorize', END)

  const app = workflow.compile()

  export async function POST(request) {
    try {
      const { description } = await request.json()

      if (!description) {
        return NextResponse.json({ error: 'Description is required' }, { status: 400 })
      }

      const result = await app.invoke({ description })

      return NextResponse.json({ category: result.category })
    } catch (error) {
      console.error('CATEGORIZE ERROR:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }