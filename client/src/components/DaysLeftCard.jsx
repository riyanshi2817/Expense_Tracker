export default function DaysLeftCard({ daysLeft = 0 }) {
  const days = Math.max(0, Number(daysLeft) || 0)
  return <section className="app-card metric-card">
    <h2>Days left</h2>
    <p>{days} <span>{days === 1 ? 'day' : 'days'}</span></p>
    <small>In this month</small>
  </section>
}
