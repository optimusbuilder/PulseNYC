import dotenv from 'dotenv';
dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const CATEGORY_LABELS = {
  flooding: 'Flooding / Standing Water',
  power_outage: 'Power Outage',
  subway_unsafe: 'Subway Unsafe/Closed',
  altercation: 'Active Altercation',
  protest: 'Protest / Large Crowd',
  road_blocked: 'Road Blocked / Accident',
  infrastructure: 'Broken Infrastructure',
  harassment: 'Harassment on Transit',
  medical: 'Medical Emergency',
};

export async function generateBrief(alerts) {
  if (!ANTHROPIC_API_KEY) {
    return buildFallbackBrief(alerts);
  }

  const alertSummary = alerts.map(a => ({
    type: CATEGORY_LABELS[a.category] || a.category,
    status: a.status,
    source: a.source,
    reported: a.created_at,
    description: a.description || null,
  }));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: 'You are a concise city safety assistant. Given a list of active alerts near the user, write a single plain-language summary in 2-3 sentences. Be factual, not alarmist. Include the time context and number of alerts.',
        messages: [
          { role: 'user', content: JSON.stringify(alertSummary) },
        ],
      }),
    });

    const data = await response.json();
    return data.content?.[0]?.text || buildFallbackBrief(alerts);
  } catch (err) {
    console.error('AI brief generation failed:', err.message);
    return buildFallbackBrief(alerts);
  }
}

function buildFallbackBrief(alerts) {
  const confirmed = alerts.filter(a => a.status === 'confirmed' || a.status === 'auto');
  const total = alerts.length;
  const types = [...new Set(alerts.map(a => CATEGORY_LABELS[a.category] || a.category))];

  return `There ${total === 1 ? 'is' : 'are'} ${total} active alert${total !== 1 ? 's' : ''} in your area${confirmed.length > 0 ? ` (${confirmed.length} confirmed)` : ''}. Categories: ${types.join(', ')}.`;
}
