export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = globalThis.process?.env?.OPENAI_API_KEY

  if (!apiKey) {
    response.status(503).json({ error: 'Server AI is not configured.' })
    return
  }

  const { question, context } = request.body ?? {}

  if (!question) {
    response.status(400).json({ error: 'Missing concierge question.' })
    return
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'You are a concise AR tour guide concierge. Use the supplied local context only. Give practical answers for sightseeing, tickets, food, safety, transport, and timing in 3 short paragraphs or less.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Question: ${question}\n\nContext:\n${JSON.stringify(context ?? {}, null, 2)}`,
              },
            ],
          },
        ],
      }),
    })

    const data = await upstream.json()
    response.status(upstream.status).json(data)
  } catch (error) {
    response.status(500).json({
      error: error.message || 'Concierge request failed.',
    })
  }
}
