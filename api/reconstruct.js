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

  const { image, prompt } = request.body ?? {}

  if (!image || !prompt) {
    response.status(400).json({ error: 'Missing reconstruction input.' })
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
        model: 'gpt-4.1',
        tools: [{ type: 'image_generation' }],
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: prompt,
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
      error: error.message || 'Reconstruction request failed.',
    })
  }
}
