/**
 * Xero API Integration
 * OAuth 2.0 flow and data fetching for Xero Accounting
 */

interface XeroConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface XeroTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface FinancialData {
  cashBalance: number
  monthlyRevenue: number
  monthlyExpenses: number
  profitLoss: any
  balanceSheet: any
}

export class XeroClient {
  private config: XeroConfig
  private baseUrl = 'https://api.xero.com/api.xro/2.0'
  private authUrl = 'https://login.xero.com/identity/connect/authorize'
  private tokenUrl = 'https://identity.xero.com/connect/token'

  constructor() {
    this.config = {
      clientId: process.env.XERO_CLIENT_ID!,
      clientSecret: process.env.XERO_CLIENT_SECRET!,
      redirectUri: process.env.XERO_REDIRECT_URI!,
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'offline_access accounting.transactions.read accounting.reports.read accounting.settings.read',
      state,
    })

    return `${this.authUrl}?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<XeroTokens> {
    const response = await fetch(this.tokenUrl, {
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

    return response.json()
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<XeroTokens> {
    const response = await fetch(this.tokenUrl, {
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

    return response.json()
  }

  /**
   * Get tenant connections (organizations)
   */
  async getTenants(accessToken: string) {
    const response = await fetch('https://api.xero.com/connections', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get tenants: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Fetch profit and loss report
   */
  async getProfitAndLoss(
    accessToken: string,
    tenantId: string,
    fromDate: string,
    toDate: string
  ) {
    const params = new URLSearchParams({
      fromDate,
      toDate,
    })

    const response = await fetch(
      `${this.baseUrl}/Reports/ProfitAndLoss?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'xero-tenant-id': tenantId,
          'Content-Type': 'application/json',
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
  async getBalanceSheet(accessToken: string, tenantId: string, asOfDate: string) {
    const params = new URLSearchParams({
      date: asOfDate,
    })

    const response = await fetch(
      `${this.baseUrl}/Reports/BalanceSheet?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'xero-tenant-id': tenantId,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch balance sheet: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Fetch bank accounts
   */
  async getBankAccounts(accessToken: string, tenantId: string) {
    const response = await fetch(
      `${this.baseUrl}/Accounts?where=Type=="BANK"`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'xero-tenant-id': tenantId,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch bank accounts: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get comprehensive financial data
   */
  async getFinancialData(
    accessToken: string,
    tenantId: string
  ): Promise<FinancialData> {
    const today = new Date()
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    const formatDate = (date: Date) => date.toISOString().split('T')[0]

    // Fetch reports
    const [profitLoss, balanceSheet, bankAccounts] = await Promise.all([
      this.getProfitAndLoss(
        accessToken,
        tenantId,
        formatDate(startOfLastMonth),
        formatDate(endOfLastMonth)
      ),
      this.getBalanceSheet(accessToken, tenantId, formatDate(today)),
      this.getBankAccounts(accessToken, tenantId),
    ])

    // Extract metrics from Xero reports
    const extractMetric = (report: any, sectionName: string): number => {
      try {
        const reports = report.Reports || []
        if (reports.length === 0) return 0

        const rows = reports[0].Rows || []
        for (const section of rows) {
          if (section.Title === sectionName && section.Rows) {
            let total = 0
            for (const row of section.Rows) {
              if (row.Cells && row.Cells.length > 1) {
                total += parseFloat(row.Cells[1].Value || '0')
              }
            }
            return total
          }
        }
        return 0
      } catch (error) {
        return 0
      }
    }

    // Calculate total cash from bank accounts
    const totalCash = bankAccounts.Accounts?.reduce(
      (sum: number, account: any) => sum + (parseFloat(account.BankAccountBalance) || 0),
      0
    ) || 0

    return {
      cashBalance: totalCash,
      monthlyRevenue: extractMetric(profitLoss, 'Revenue'),
      monthlyExpenses: extractMetric(profitLoss, 'Expenses'),
      profitLoss: profitLoss,
      balanceSheet: balanceSheet,
    }
  }
}
