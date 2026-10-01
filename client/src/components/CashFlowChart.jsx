import { EmptyState } from './Feedback'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0)

const formatMonth = (month) => {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(
    new Date(Date.UTC(year, monthNumber - 1, 1)),
  )
}

function CashFlowChart({ cashFlow = [] }) {
  return (
    <section className="rounded-card border border-border bg-surface-elevated p-6 shadow-card lg:p-7">
      <div>
        <h2 className="font-display text-xl font-bold">Cash flow</h2>
        <p className="mt-1 text-sm text-ink-secondary">Income versus expenses by month</p>
      </div>

      {cashFlow.length === 0 ? (
        <EmptyState title="No transactions yet" to="/home#transactions" actionLabel="Add your first transaction">Your income and expenses will appear here.</EmptyState>
      ) : (
        <div className="mt-6 h-72 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlow} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fill: 'var(--chart-text)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fill: 'var(--chart-text)' }}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Tooltip
                formatter={(value, name) => [formatCurrency(value), name]}
                labelFormatter={(month) => `Month: ${month}`}
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--foreground)',
                }}
                cursor={{ fill: 'var(--muted)' }}
              />
              <Legend wrapperStyle={{ color: 'var(--chart-text)', paddingTop: 12 }} />
              <Bar dataKey="income" name="Income" fill="var(--chart-success)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="var(--chart-danger)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

export default CashFlowChart
