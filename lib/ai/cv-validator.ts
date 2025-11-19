/**
 * CV Validator using AI
 * Validates if a document is a CV/Resume
 */

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

export interface CVValidationResult {
  isCV: boolean
  confidence: number
  reason: string
}

function getAIClient(baseURL: string, apiKey: string) {
  const normalizedBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
  const isAnthropic = normalizedBaseURL.includes('anthropic.com')

  if (isAnthropic) {
    return {
      client: createAnthropic({
        apiKey,
        baseURL: normalizedBaseURL,
      }),
      isAnthropic: true,
    }
  }

  return {
    client: createOpenAI({
      apiKey,
      baseURL: normalizedBaseURL,
    }),
    isAnthropic: false,
  }
}

export async function validateCV(
  text: string,
  baseURL: string,
  model: string,
  apiKey: string
): Promise<CVValidationResult> {
  const { client, isAnthropic } = getAIClient(baseURL, apiKey)

  // Take only first 2000 characters for quick validation
  const textSample = text.substring(0, 2000)

  const prompt = `Analyse le texte suivant et détermine s'il s'agit d'un CV (curriculum vitae / résumé).

Texte à analyser:
${textSample}

Réponds UNIQUEMENT avec un objet JSON au format suivant (sans texte avant ou après):
{
  "isCV": true ou false,
  "confidence": nombre entre 0 et 1 (ton niveau de confiance),
  "reason": "explication courte de pourquoi c'est ou non un CV"
}

Un CV contient typiquement:
- Des informations personnelles (nom, email, téléphone)
- Des expériences professionnelles
- Des compétences / skills
- Une formation / éducation
- Potentiellement des langues, certifications, projets

Si le document est un contrat, une lettre de motivation, un rapport, une facture, ou tout autre type de document, réponds isCV: false.`

  try {
    const result = await generateText({
      model: isAnthropic ? client(model) : client.chat(model),
      prompt,
    })

    // Parse AI response
    let validation: CVValidationResult
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        validation = JSON.parse(jsonMatch[0]) as CVValidationResult
      } else {
        throw new Error('No JSON found in response')
      }
    } catch {
      console.error('Failed to parse AI validation response:', result.text)
      
      // Fallback: basic heuristic
      const cvKeywords = ['experience', 'expérience', 'compétences', 'skills', 'formation', 'education', 'cv', 'curriculum', 'resume']
      const hasKeywords = cvKeywords.some(keyword => 
        textSample.toLowerCase().includes(keyword)
      )
      
      validation = {
        isCV: hasKeywords,
        confidence: hasKeywords ? 0.6 : 0.4,
        reason: hasKeywords 
          ? 'Le document contient des mots-clés typiques d\'un CV'
          : 'Le document ne semble pas contenir d\'éléments typiques d\'un CV'
      }
    }

    return validation
  } catch (error) {
    console.error('Error validating CV:', error)
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to validate document'
    )
  }
}





