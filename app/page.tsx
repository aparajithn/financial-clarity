import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, TrendingUp, DollarSign, Users, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-xl">Financial Clarity</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Your accountant files your taxes.
            <br />
            <span className="text-blue-600">We explain what your numbers mean.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Finally understand your business's financial health — in plain English, not accounting jargon. 
            Connect QuickBooks or Xero and get instant insights.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Connect QuickBooks in 60 seconds <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gray-50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            You have an accountant. Your books are up to date. But you still don't know:
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">?</div>
              <p className="text-lg text-gray-700">Can I afford to hire?</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">?</div>
              <p className="text-lg text-gray-700">Should I raise prices?</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">?</div>
              <p className="text-lg text-gray-700">How long until I run out of cash?</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">?</div>
              <p className="text-lg text-gray-700">Where am I spending too much?</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Plain-English financial insights in seconds
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6">
            <DollarSign className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Cash Runway</h3>
            <p className="text-gray-600">
              "You have 8 months of cash at current spending. Last quarter you had 10 months. Here's what changed."
            </p>
          </Card>
          <Card className="p-6">
            <Users className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Hiring Impact</h3>
            <p className="text-gray-600">
              "If you hire that $60k/year employee, your runway drops from 8 months to 5 months."
            </p>
          </Card>
          <Card className="p-6">
            <Zap className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Plain English</h3>
            <p className="text-gray-600">
              No jargon, no confusing reports. Just clear answers to your real business questions.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Stop guessing. Start knowing.
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Connect your accounting software and get instant financial clarity.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Financial Clarity</span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2026 Financial Clarity. Plain-English financial insights for small businesses.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
