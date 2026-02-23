/**
 * QuickBooks API Integration
 * OAuth 2.0 flow and data fetching for QuickBooks Online
 */

interface QuickBooksConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment: 'sandbox' | 'production'
}

interface QuickBooksTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  x_refresh_token_expires_in: number
  realm_id: string
}

interface FinancialData {
  cashBalance: number
  monthlyRevenue: number
  monthlyExpenses: number
  profitLoss: any
  balanceSheet: any
}

export class QuickBooksClient {
  private config: QuickBooksConfig
  private baseUrl: string

  constructor() {
    this.config = {
      clientId: process.env.QUICKBOOKS_CLIENT_ID!,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
      redirectUri: process.env.QUICKBOOKS_REDIRECT_URI!,
      environment: (process.env.QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    }
    this.baseUrl =
      this.config.environment === 'sandbox'
        ? 'https://sandbox-quickbooks.api.intuit.com'
        : 'https://quickbooks.api.intuit.com'
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      state,
    })

    return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<QuickBooksTokens> {
    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get tokens: ${error}`)
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      x_refresh_token_expires_in: data.x_refresh_token_expires_in,
      realm_id: data.realmId,
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<QuickBooksTokens> {
    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to refresh token: ${error}`)
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      x_refresh_token_expires_in: data.x_refresh_token_expires_in,
      realm_id: '', // Not returned on refresh
    }
  }

  /**
   * Fetch company info
   */
  async getCompanyInfo(accessToken: string, realmId: string) {
    const response = await fetch(
      `${this.baseUrl}/v3/company/${realmId}/companyinfo/${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch company info: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Fetch profit and loss report
   */
  async getProfitAndLoss(
    accessToken: string,
    realmId: string,
    startDate: string,
    endDate: string
  ) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    })

    const response = await fetch(
      `${this.baseUrl}/v3/company/${realmId}/reports/ProfitAndLoss?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch P&L: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Fetch balance sheet
   */
  async getBalanceSheet(accessToken: string, realmId: string, asOfDate: string) {
    const params = new URLSearchParams({
      date: asOfDate,
    })

    const response = await fetch(
      `${this.baseUrl}/v3/company/${realmId}/reports/BalanceSheet?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch balance sheet: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get comprehensive financial data
   */
  async getFinancialData(
    accessToken: string,
    realmId: string
  ): Promise<FinancialData> {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    const formatDate = (date: Date) => date.toISOString().split('T')[0]

    // Fetch P&L for current month and last month
    const [currentPL, lastMonthPL, balanceSheet] = await Promise.all([
      this.getProfitAndLoss(
        accessToken,
        realmId,
        formatDate(startOfMonth),
        formatDate(today)
      ),
      this.getProfitAndLoss(
        accessToken,
        realmId,
        formatDate(startOfLastMonth),
        formatDate(endOfLastMonth)
      ),
      this.getBalanceSheet(accessToken, realmId, formatDate(today)),
    ])

    // Extract key metrics
    const extractMetric = (report: any, metricName: string): number => {
      try {
        const rows = report.Rows?.Row || []
        for (const row of rows) {
          if (row.ColData && row.Header?.ColData?.[0]?.value === metricName) {
            return parseFloat(row.ColData[1]?.value || '0')
          }
        }
        return 0
      } catch (error) {
        return 0
      }
    }

    const extractBalanceSheetMetric = (report: any, metricName: string): number => {
      try {
        const rows = report.Rows?.Row || []
        for (const section of rows) {
          if (section.Rows?.Row) {
            for (const row of section.Rows.Row) {
              if (row.ColData?.[0]?.value === metricName) {
                return parseFloat(row.ColData[1]?.value || '0')
              }
            }
          }
        }
        return 0
      } catch (error) {
        return 0
      }
    }

    return {
      cashBalance: extractBalanceSheetMetric(balanceSheet, 'Cash and cash equivalents'),
      monthlyRevenue: extractMetric(lastMonthPL, 'Total Income'),
      monthlyExpenses: extractMetric(lastMonthPL, 'Total Expenses'),
      profitLoss: lastMonthPL,
      balanceSheet: balanceSheet,
    }
  }
}
