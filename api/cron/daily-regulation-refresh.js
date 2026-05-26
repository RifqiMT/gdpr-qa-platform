/**
 * Vercel Cron: regulation ETL refresh (02:00 UTC schedule in vercel.json).
 * Secured with CRON_SECRET — set in Vercel project Environment Variables.
 */
const { runRegulationScraperAndReloadContent } = require('../../server');

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const gdpr = await runRegulationScraperAndReloadContent('gdpr');
    const aiAct = await runRegulationScraperAndReloadContent('ai-act');
    const dataAct = await runRegulationScraperAndReloadContent('data-act');
    res.json({
      ok: true,
      job: 'daily-regulation-refresh',
      gdpr: {
        lastRefreshed: gdpr.meta?.lastRefreshed ?? null,
        lastChecked: gdpr.meta?.lastChecked ?? null
      },
      aiAct: {
        lastRefreshed: aiAct.meta?.lastRefreshed ?? null,
        lastChecked: aiAct.meta?.lastChecked ?? null
      },
      dataAct: {
        lastRefreshed: dataAct.meta?.lastRefreshed ?? null,
        lastChecked: dataAct.meta?.lastChecked ?? null
      }
    });
  } catch (e) {
    console.error('Cron regulation refresh failed:', e);
    res.status(500).json({
      ok: false,
      error: e && e.message ? e.message : String(e)
    });
  }
};
