  import { NextResponse } from 'next/server'
  import { ChatGroq } from '@langchain/groq'
  import { StateGraph, END, START, Annotation } from '@langchain/langgraph'
  import { supabaseAdmin } from '@/lib/supabaseAdmin'

  // Define the data that flows through this workflow
  const GraphState = Annotation.Root({
    userId: Annotation(),
    spendingData: Annotation(),
    insights: Annotation(),
  })

  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'openai/gpt-oss-20b',
    temperature: 0.3,
  })

  // STEP 1 (Node): Fetch this month's spending, grouped by category
  async function fetchSpendingNode(state) {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('category, amount, type, date')
      .eq('user_id', state.userId)
      .eq('type', 'expense')
      .gte('date', currentMonth)

    if (error) throw new Error(error.message)

    const totals = {}
    data.forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + parseFloat(t.amount)
    })

    return { spendingData: totals }
  }

  // STEP 2 (Node): Send spending data to AI and get back insights
  async function generateInsightsNode(state) {
    const spendingText = Object.entries(state.spendingData)
      .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
      .join(', ')

    const prompt = `You are a friendly personal finance assistant.
  Here is a user's spending by category this month: ${spendingText || 'No spending recorded yet'}.

  Give 2 to 4 short, specific, personalized insights about their spending.
  - Point out the highest spending category
  - Mention if any category looks unusually high
  - Give one practical tip
  Keep each insight to one short sentence. Return them as a plain numbered list, nothing else.`

    const response = await model.invoke(prompt)

    return { insights: response.content.trim() }
  }

  // Build the graph: start -> fetchSpending -> generateInsights -> end
  const workflow = new StateGraph(GraphState)
    .addNode('fetchSpending', fetchSpendingNode)
    .addNode('generateInsights', generateInsightsNode)
    .addEdge(START, 'fetchSpending')
    .addEdge('fetchSpending', 'generateInsights')
    .addEdge('generateInsights', END)

  const app = workflow.compile()

  export async function POST(request) {
    try {
      const { userId } = await request.json()

      if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 })
      }

      const result = await app.invoke({ userId })

      return NextResponse.json({
        spendingData: result.spendingData,
        insights: result.insights,
      })
    } catch (error) {
      console.error('ANALYZE ERROR:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }