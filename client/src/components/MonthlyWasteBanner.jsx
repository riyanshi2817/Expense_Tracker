export default function MonthlyWasteBanner({ monthlyWaste = 0 }) {
  const amount = Number(monthlyWaste) || 0
  return <section className="app-card metric-card">
    <h2>Potential savings</h2>
    <p>{amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</p>
    <small>{amount > 0 ? 'From unused subscriptions' : 'No unused subscriptions'}</small>
  </section>
}
