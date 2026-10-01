// Legacy keys remain readable so existing saved opt-outs are respected.
const resolveNotificationPrefs = (prefs = {}) => {
  const dueDateAlerts = prefs.dueDateAlerts ?? prefs.dueDateReminders ?? true;
  const unusualSpendingAlerts = prefs.unusualSpendingAlerts ?? prefs.anomalyAlerts ?? true;
  return { dueDateAlerts, unusualSpendingAlerts, weeklySummary: prefs.weeklySummary ?? true,
    dueDateReminders: dueDateAlerts, anomalyAlerts: unusualSpendingAlerts };
};
module.exports = { resolveNotificationPrefs };
