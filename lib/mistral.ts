/**
 * Minimal Mistral chat helper shared by analytics routes.
 * Tries the configured model, then a fallback; returns null if the key is missing or every call fails.
 */
export async function mistralComplete(prompt: string, opts: { json?: boolean; maxTokens?: number } = {}): Promise<string | null> {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) return null

  const primary = process.env.MISTRAL_MODEL || 'ministral-8b-latest'
  const models = [primary, 'open-mistral-7b'].filter((m, i, arr) => arr.indexOf(m) === i)

  for (const model of models) {
    try {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: opts.maxTokens ?? 700,
          ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
        }),
      })
      if (!res.ok) {
        console.error(`Mistral (${model}) API error:`, await res.text())
        continue
      }
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
      const content = data.choices?.[0]?.message?.content?.trim()
      if (content) return content
    } catch (err) {
      console.error(`Mistral request error with model ${model}:`, err)
    }
  }
  return null
}

/** Removes markdown code fences and bold/italic/bullet markers that would show up as literal symbols. */
export function stripMarkdown(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}
