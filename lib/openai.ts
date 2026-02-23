/**
 * OpenAI Integration for Plain-English Financial Insights
 * Uses GPT-4o to generate human-readable explanations of financial data
 */

import OpenAI from 'openai'

interface FinancialMetrics {
  cashBalance: number
  monthlyRevenue: number
  monthlyExpenses: number
  profitMargin?: number
  cashRunway?: number
  burnRate?: number
}

interface Insight {
  type: string
  title: string
  text: string
  data: any
}

export class InsightsGenerator {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
  }

  /**
   * Generate cash runway insight
   */
  async generateCashRunway(metrics: FinancialMetrics): Promise<Insight> {
    const netBurn = metrics.monthlyExpenses - metrics.monthlyRevenue
    const runwayMonths = netBurn > 0 ? Math.floor(metrics.cashBalance / netBurn) : 999

    const prompt = `You are a financial advisor explaining cash runway to a small business owner (non-VC-backed).

Financial data:
- Cash balance: $${metrics.cashBalance.toLocaleString()}
- Monthly revenue: $${metrics.monthlyRevenue.toLocaleString()}
- Monthly expenses: $${metrics.monthlyExpenses.toLocaleString()}
- Net monthly burn: $${netBurn.toLocaleString()}
- Calculated runway: ${runwayMonths === 999 ? 'infinite (profitable)' : `${runwayMonths} months`}

Generate a plain-English explanation (2-3 sentences) that:
1. States the runway in months (or "you're profitable" if infinite)
2. Explains what this means practically
3. Gives context (is this good/bad? should they worry?)

Use simple language. NO jargon like "burn rate" or "runway" without explaining it first.
Be direct and honest. This is their real business.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a financial advisor who explains complex financial concepts in plain English to small business owners.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    return {
      type: 'cash_runway',
      title: 'Cash Runway',
      text: response.choices[0].message.content || 'Unable to generate insight.',
      data: {
        cashBalance: metrics.cashBalance,
        monthlyRevenue: metrics.monthlyRevenue,
        monthlyExpenses: metrics.monthlyExpenses,
        netBurn,
        runwayMonths,
      },
    }
  }

  /**
   * Generate burn rate insight
   */
  async generateBurnRate(metrics: FinancialMetrics): Promise<Insight> {
    const netBurn = metrics.monthlyExpenses - metrics.monthlyRevenue

    const prompt = `You are a financial advisor explaining spending patterns to a small business owner.

Financial data:
- Monthly revenue: $${metrics.monthlyRevenue.toLocaleString()}
- Monthly expenses: $${metrics.monthlyExpenses.toLocaleString()}
- Net monthly burn: $${netBurn.toLocaleString()}

Generate a plain-English explanation (2-3 sentences) that:
1. States how much they're spending per month
2. Compares it to their revenue (spending more or less than they make?)
3. Identifies if this is sustainable or concerning

Use simple language. Avoid jargon. Be direct.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a financial advisor who explains complex financial concepts in plain English to small business owners.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    return {
      type: 'burn_rate',
      title: 'Monthly Spending',
      text: response.choices[0].message.content || 'Unable to generate insight.',
      data: {
        monthlyRevenue: metrics.monthlyRevenue,
        monthlyExpenses: metrics.monthlyExpenses,
        netBurn,
      },
    }
  }

  /**
   * Generate profit margin insight
   */
  async generateProfitMargin(metrics: FinancialMetrics): Promise<Insight> {
    const profitMargin = metrics.monthlyRevenue > 0
      ? ((metrics.monthlyRevenue - metrics.monthlyExpenses) / metrics.monthlyRevenue) * 100
      : 0

    const prompt = `You are a financial advisor explaining profit margins to a small business owner.

Financial data:
- Monthly revenue: $${metrics.monthlyRevenue.toLocaleString()}
- Monthly expenses: $${metrics.monthlyExpenses.toLocaleString()}
- Profit margin: ${profitMargin.toFixed(1)}%

Generate a plain-English explanation (2-3 sentences) that:
1. States the profit margin percentage
2. Explains what this means (how much of every dollar they keep)
3. Gives context (is this healthy? industry benchmarks if relevant)

Use simple language. Explain like talking to a friend, not an accountant.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a financial advisor who explains complex financial concepts in plain English to small business owners.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    return {
      type: 'profit_margin',
      title: 'Profit Margin',
      text: response.choices[0].message.content || 'Unable to generate insight.',
      data: {
        monthlyRevenue: metrics.monthlyRevenue,
        monthlyExpenses: metrics.monthlyExpenses,
        profitMargin,
      },
    }
  }

  /**
   * Generate hiring impact insight
   */
  async generateHiringImpact(
    metrics: FinancialMetrics,
    annualSalary: number
  ): Promise<Insight> {
    const monthlySalaryCost = annualSalary / 12
    const newMonthlyExpenses = metrics.monthlyExpenses + monthlySalaryCost
    const newNetBurn = newMonthlyExpenses - metrics.monthlyRevenue
    const currentNetBurn = metrics.monthlyExpenses - metrics.monthlyRevenue

    const currentRunway = currentNetBurn > 0 ? Math.floor(metrics.cashBalance / currentNetBurn) : 999
    const newRunway = newNetBurn > 0 ? Math.floor(metrics.cashBalance / newNetBurn) : 999

    const prompt = `You are a financial advisor helping a small business owner decide if they can afford to hire.

Current situation:
- Cash balance: $${metrics.cashBalance.toLocaleString()}
- Monthly revenue: $${metrics.monthlyRevenue.toLocaleString()}
- Monthly expenses: $${metrics.monthlyExpenses.toLocaleString()}
- Current runway: ${currentRunway === 999 ? 'infinite (profitable)' : `${currentRunway} months`}

Hiring scenario:
- Annual salary: $${annualSalary.toLocaleString()}
- Monthly cost: $${monthlySalaryCost.toLocaleString()}
- New monthly expenses: $${newMonthlyExpenses.toLocaleString()}
- New runway: ${newRunway === 999 ? 'infinite (still profitable)' : `${newRunway} months`}

Generate a plain-English recommendation (3-4 sentences) that:
1. States how the hire changes their runway
2. Explains the financial impact clearly
3. Gives honest advice (can they afford it? should they wait? is it safe?)

Be direct and practical. This is a real hiring decision.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a financial advisor who helps small business owners make practical hiring decisions.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    })

    return {
      type: 'hiring_impact',
      title: `Hiring Impact ($${annualSalary.toLocaleString()}/year)`,
      text: response.choices[0].message.content || 'Unable to generate insight.',
      data: {
        currentRunway,
        newRunway,
        annualSalary,
        monthlyCost: monthlySalaryCost,
        currentMonthlyExpenses: metrics.monthlyExpenses,
        newMonthlyExpenses,
      },
    }
  }

  /**
   * Generate custom insight from a question
   */
  async generateCustomInsight(
    metrics: FinancialMetrics,
    question: string
  ): Promise<Insight> {
    const prompt = `You are a financial advisor answering questions for a small business owner.

Their financial data:
- Cash balance: $${metrics.cashBalance.toLocaleString()}
- Monthly revenue: $${metrics.monthlyRevenue.toLocaleString()}
- Monthly expenses: $${metrics.monthlyExpenses.toLocaleString()}

Their question: "${question}"

Provide a clear, direct answer (3-4 sentences) using their actual numbers.
Be practical and honest. Use simple language.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful financial advisor who answers questions in plain English.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    })

    return {
      type: 'custom',
      title: question,
      text: response.choices[0].message.content || 'Unable to generate insight.',
      data: metrics,
    }
  }

  /**
   * Generate all standard insights
   */
  async generateAllInsights(metrics: FinancialMetrics): Promise<Insight[]> {
    return Promise.all([
      this.generateCashRunway(metrics),
      this.generateBurnRate(metrics),
      this.generateProfitMargin(metrics),
    ])
  }
}
