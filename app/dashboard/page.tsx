'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { TrendingUp, LogOut, RefreshCw, DollarSign, TrendingDown, Percent, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Connection {
  id: string
  provider: 'quickbooks' | 'xero'
  connected_at: string
}

interface Insight {
  id: string
  insight_type: string
  insight_title: string
  insight_text: string
  data_snapshot: any
  generated_at: string
}

function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [customQuestion, setCustomQuestion] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchConnections()
    fetchInsights()

    // Show success message if just connected
    const connected = searchParams.get('connected')
    if (connected) {
      alert(`Successfully connected to ${connected}!`)
    }
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
      setLoading(false)
    }
  }

  const fetchConnections = async () => {
    const { data } = await supabase
      .from('connections')
      .select('*')
      .order('connected_at', { ascending: false })
    
    if (data) setConnections(data)
  }

  const fetchInsights = async () => {
    const { data } = await supabase
      .from('insights')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(10)
    
    if (data) setInsights(data)
  }

  const handleGenerateInsights = async () => {
    if (connections.length === 0) {
      alert('Please connect QuickBooks or Xero first')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightType: 'all' }),
      })

      if (response.ok) {
        await fetchInsights()
        alert('Insights generated successfully!')
      } else {
        alert('Failed to generate insights')
      }
    } catch (error) {
      alert('Error generating insights')
    } finally {
      setGenerating(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!customQuestion.trim()) return
    if (connections.length === 0) {
      alert('Please connect QuickBooks or Xero first')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insightType: 'custom',
          params: { question: customQuestion },
        }),
      })

      if (response.ok) {
        await fetchInsights()
        setCustomQuestion('')
        alert('Answer generated!')
      } else {
        alert('Failed to generate answer')
      }
    } catch (error) {
      alert('Error generating answer')
    } finally {
      setGenerating(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'cash_runway':
        return <DollarSign className="h-5 w-5" />
      case 'burn_rate':
        return <TrendingDown className="h-5 w-5" />
      case 'profit_margin':
        return <Percent className="h-5 w-5" />
      case 'hiring_impact':
        return <Users className="h-5 w-5" />
      default:
        return <TrendingUp className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-xl">Financial Clarity</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connections Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Connected Accounts</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {connections.length === 0 ? (
              <>
                <Card className="p-6">
                  <h3 className="font-semibold mb-2">QuickBooks</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect your QuickBooks account to get financial insights
                  </p>
                  <Link href="/api/quickbooks/authorize">
                    <Button>Connect QuickBooks</Button>
                  </Link>
                </Card>
                <Card className="p-6">
                  <h3 className="font-semibold mb-2">Xero</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect your Xero account to get financial insights
                  </p>
                  <Link href="/api/xero/authorize">
                    <Button>Connect Xero</Button>
                  </Link>
                </Card>
              </>
            ) : (
              connections.map((conn) => (
                <Card key={conn.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold capitalize">{conn.provider}</h3>
                      <p className="text-sm text-gray-600">
                        Connected {new Date(conn.connected_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Generate Insights */}
        {connections.length > 0 && (
          <div className="mb-8">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Generate Insights</h2>
              <div className="flex gap-4">
                <Button
                  onClick={handleGenerateInsights}
                  disabled={generating}
                  size="lg"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Financial Insights
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Ask a Question */}
        {connections.length > 0 && (
          <div className="mb-8">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Ask a Question</h2>
              <div className="flex gap-4">
                <Input
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="e.g., Can I afford to hire a $70k/year employee?"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAskQuestion()
                  }}
                />
                <Button onClick={handleAskQuestion} disabled={generating || !customQuestion.trim()}>
                  Ask
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Insights */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Insights</h2>
          {insights.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600">
                {connections.length === 0
                  ? 'Connect QuickBooks or Xero to generate insights'
                  : 'Click "Generate Financial Insights" to get started'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <Card key={insight.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {getInsightIcon(insight.insight_type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{insight.insight_title}</h3>
                      <p className="text-gray-700 leading-relaxed">{insight.insight_text}</p>
                      <p className="text-xs text-gray-500 mt-3">
                        Generated {new Date(insight.generated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
