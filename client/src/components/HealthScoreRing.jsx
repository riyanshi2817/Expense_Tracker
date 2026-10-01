function HealthScoreRing({ score = 0 }) {
  const normalizedScore = Math.min(Math.max(Number(score) || 0, 0), 100)
  const tone = normalizedScore < 40 ? 'is-low' : normalizedScore <= 70 ? 'is-mid' : 'is-high'
  const label = normalizedScore < 40 ? 'Needs attention' : normalizedScore <= 70 ? 'Building momentum' : 'Looking healthy'

  return <section className="app-card health-panel">
    <div className="panel-heading"><div><p className="page-eyebrow">Your progress</p><h2 className="app-card-title">Financial health</h2></div><span className="health-score">{Math.round(normalizedScore)}<small>/ 100</small></span></div>
    <div className={`health-track ${tone}`} role="progressbar" aria-label="Financial health score" aria-valuenow={Math.round(normalizedScore)} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${normalizedScore}%` }} /></div>
    <div className="health-foot"><strong>{label}</strong><span>Based on your spending and commitments</span></div>
  </section>
}

export default HealthScoreRing
