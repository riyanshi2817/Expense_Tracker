import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { EmptyState } from './Feedback'
const colors = ['#7c6cff', '#42d392', '#ffbf69', '#ff667a', '#55c2ef', '#d98af3', '#93c572', '#ffa88a']
const money = (value) => Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
export default function SpendingMix({ spendingMix = [] }) {
  const total = spendingMix.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  return <section className="rounded-card border border-border bg-surface-elevated p-6 shadow-card lg:p-7">
    <h2 className="font-display text-xl font-bold">Spending Mix</h2>
    <p className="mt-1 text-sm text-ink-secondary">This month's expenses by category</p>
    {!spendingMix.length || total <= 0 ? <EmptyState title="No expenses this month" to="/home#transactions" actionLabel="Add an expense">Your category breakdown will appear here.</EmptyState> : <>
      <div className="mt-5 h-64 w-full" role="img" aria-label="Spending by category; amounts and percentages are listed below">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart><Pie data={spendingMix} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={95} paddingAngle={2} isAnimationActive={false}>
            {spendingMix.map((item, index) => <Cell key={item.category} fill={colors[index % colors.length]} stroke="var(--chart-grid)" />)}
          </Pie><Tooltip formatter={(value) => money(value)} contentStyle={{ background: '#192338', border: '1px solid #25314a', borderRadius: 12, color: '#f7f8fc' }} /></PieChart>
        </ResponsiveContainer>
      </div>
      <p className="mb-4 text-center text-sm text-ink-secondary">Total spending: <strong className="text-ink">{money(total)}</strong></p>
      <ul className="space-y-3">{spendingMix.map((item, index) => <li key={item.category} className="flex items-start gap-3 text-sm">
        <span aria-hidden="true" className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} />
        <span className="min-w-0 flex-1 break-words">{item.category}</span>
        <span className="text-right font-semibold">{money(item.amount)}<span className="block text-xs font-normal text-ink-muted">{Number(item.percent).toFixed(2)}%</span></span>
      </li>)}</ul>
    </>}
  </section>
}
