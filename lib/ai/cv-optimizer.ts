import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import type { ParsedCV } from './cv-parser'
import { db } from '@/lib/db'
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_INSTRUCTION_LIGHT,
  DEFAULT_INSTRUCTION_NORMAL,
  DEFAULT_INSTRUCTION_AGGRESSIVE,
  DEFAULT_STRUCTURE_PROMPT
} from './default-prompts'

export type MatchMode = 'light' | 'normal' | 'aggressive'
export type Language = 'fr' | 'en'

export interface CVOptimizationResult {
  optimizedCV: ParsedCV
  jobTitle: string
  company: string
  matchScore: number
  changes: string[]
  suggestions: string[]
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

async function getPromptSettings(mode: MatchMode): Promise<{ systemPrompt: string; instructionPrompt: string }> {
  let systemPrompt = DEFAULT_SYSTEM_PROMPT
  let instructionPrompt = ''

  try {
    // Fetch system prompt
    const systemPromptSetting = await db.settings.get('prompt_system')
    if (systemPromptSetting?.value) {
      systemPrompt = systemPromptSetting.value as string
    }

    // Fetch instruction prompt based on mode
    const instructionKey = `prompt_instruction_${mode}`
    const instructionSetting = await db.settings.get(instructionKey)

    if (instructionSetting?.value) {
      instructionPrompt = instructionSetting.value as string
    } else {
      // Fallback to defaults
      switch (mode) {
        case 'light':
          instructionPrompt = DEFAULT_INSTRUCTION_LIGHT
          break
        case 'normal':
          instructionPrompt = DEFAULT_INSTRUCTION_NORMAL
          break
        case 'aggressive':
          instructionPrompt = DEFAULT_INSTRUCTION_AGGRESSIVE
          break
      }
    }
  } catch (error) {
    console.error('Error fetching prompt settings:', error)
    // Fallback to defaults if DB fails
    switch (mode) {
      case 'light':
        instructionPrompt = DEFAULT_INSTRUCTION_LIGHT
        break
      case 'normal':
        instructionPrompt = DEFAULT_INSTRUCTION_NORMAL
        break
      case 'aggressive':
        instructionPrompt = DEFAULT_INSTRUCTION_AGGRESSIVE
        break
    }
  }

  return { systemPrompt, instructionPrompt }
}

export async function optimizeCV(
  originalCV: ParsedCV | unknown,
  jobDescription: string,
  mode: MatchMode,
  language: Language,
  baseURL: string,
  model: string,
  apiKey: string
): Promise<CVOptimizationResult> {
  const { client, isAnthropic } = getAIClient(baseURL, apiKey)

  // Get prompts
  const { systemPrompt, instructionPrompt } = await getPromptSettings(mode)
  
  let retryCount = 3
  try {
    // Retry count is now stored in ai_config or separately, let's check 'retry_count' setting
    // It was decided to move it to onboarding form / AI config, but keeping the read from DB consistent with where we write it.
    // We will read it from 'ai_config' if possible or fallback to 'retry_count' setting key if we used that.
    // The previous code wrote to 'retry_count'. We'll stick to that for now or check ai_config if moved.
    // Actually, the user asked to put it in "configuration IA" (onboarding form).
    // So we should check where we save it. We will update OnboardingForm to save 'retry_count' setting.
    const retrySetting = await db.settings.get('retry_count')
    if (retrySetting?.value) {
      retryCount = Number(retrySetting.value)
    }
  } catch (e) {
    console.warn('Failed to load retry count', e)
  }

  // Convert the original CV to a readable format for the AI
  const cvText = JSON.stringify(originalCV, null, 2)
  const langText = language === 'fr' ? 'FRENCH' : 'ENGLISH'

  // Construct the full prompt
  const prompt = systemPrompt
    .replace('{jobDescription}', jobDescription)
    .replace('{cvText}', cvText)
    .replace('{instructions}', instructionPrompt)
    .replace('{structure}', DEFAULT_STRUCTURE_PROMPT)
    .replace(/{lang}/g, langText)

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${retryCount}...`)
      }

      const result = await generateText({
        model: isAnthropic ? client(model) : client.chat(model),
        prompt,
      })

      // Parse the AI response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const optimization = JSON.parse(jsonMatch[0]) as CVOptimizationResult

      // Validate the result
      if (!optimization.optimizedCV || !optimization.jobTitle) {
        throw new Error('Invalid optimization result: missing required fields')
      }

      // Ensure optimizedCV is a proper object
      if (typeof optimization.optimizedCV !== 'object') {
        throw new Error('Optimized CV must be a structured object')
      }

      return optimization

    } catch (error) {
      console.error(`Optimization attempt ${attempt + 1} failed:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // If it's the last attempt, don't wait
      if (attempt < retryCount) {
         // Optional: wait a bit before retrying?
         // await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  throw lastError || new Error('Failed to optimize CV after retries')
}
