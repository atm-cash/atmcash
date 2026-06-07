const REVOLUT_URL = 'https://www.revolut.com/en-DK/currency-converter/convert-dkk-to-thb-exchange-rate/?amount=1000';

function parseRateNumber(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/\s/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
  }
  return Number(cleaned.replace(',', '.')) || 0;
}

function parseRevolutRate(text) {
  const clean = String(text || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
  const patterns = [
    /(?:Vores\s+nuværende\s+kurs|Our\s+current\s+rate)[\s\S]{0,300}?1\s*(?:kr\.|kr|DKK)\s*[=|:]?\s*(?:฿|THB)?\s*([\d.,]+)/i,
    /(?:Vores\s+nuværende\s+kurs|Our\s+current\s+rate)[\s\S]{0,300}?(?:kr\.|kr|DKK)\s*\.?\s*1\s*[=|:]?\s*(?:฿|THB)?\s*([\d.,]+)/i,
    /1\s*(?:kr\.|kr|DKK)\s*[=|:]?\s*(?:฿|THB)?\s*([\d.,]+)[\s\S]{0,300}?(?:Ingen\s+gebyrer|Yderligere\s+gebyrer|No\s+fees|Additional\s+fees)/i,
    /(?:kr\.|kr|DKK)\s*\.?\s*1\s*[=|:]?\s*(?:฿|THB)?\s*([\d.,]+)[\s\S]{0,300}?(?:Ingen\s+gebyrer|Yderligere\s+gebyrer|No\s+fees|Additional\s+fees)/i
  ];
  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (!match) continue;
    const rate = parseRateNumber(match[1]);
    if (rate > 3 && rate < 7) return rate;
  }
  throw new Error('Revolut rate not found');
}

async function readRevolutText() {
  const realSources = [
    `https://r.jina.ai/${REVOLUT_URL}`,
    `https://r.jina.ai/https://www.revolut.com/en-DK/currency-converter/convert-dkk-to-thb-exchange-rate/?amount=10`,
    `https://r.jina.ai/https://www.revolut.com/currency-converter/convert-dkk-to-thb-exchange-rate/?amount=1000`,
    `https://s.jina.ai/${encodeURIComponent('site:revolut.com/en-DK/currency-converter/convert-dkk-to-thb-exchange-rate Our current rate kr. 1 THB DKK')}`,
    REVOLUT_URL
  ];
  let lastError;
  for (const source of realSources) {
    try {
      const res = await fetch(source, {
        headers: { 'user-agent': 'Mozilla/5.0 ATM Cash rate checker' },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text && text.length > 100) return text;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Revolut page unreadable');
}

export default async function handler(req, res) {
  try {
    const text = await readRevolutText();
    const rate = parseRevolutRate(text);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, rate, source: 'revolut-server-api' });
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
