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

  const { image } = request.body ?? {}

  if (!image) {
    response.status(400).json({ error: 'Missing image payload.' })
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
            role: 'user',
            content: [
              {
                type: 'input_text',
                text:
                  'You are an expert monument recognizer. Identify the monument in this image. Reply with JSON only using this shape: {"name":"","city":"","country":"","confidence":0,"summary":"","historical_period":"","architectural_style":"","best_match_reason":"","reconstruction_prompt":""}. If uncertain, still provide the most likely monument and lower confidence.',
              },
              {
                type: 'input_image',
                image_url: image,
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
      error: error.message || 'Recognition request failed.',
    })
  }
}
