/**
 * Client-side AI analysis utilities
 * Uses the Vercel AI SDK to analyze job postings locally
 */

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

export interface JobAnalysisResult {
  isJobPosting: boolean
  confidence: number
  summary: string
}

export interface JobDetails {
  jobTitle: string
  company: string
  location?: string
  keywords: string[]
  tools: string[]
  requiredSkills: string[]
  preferredSkills: string[]
  profile: string
  missions: string[]
  contractType?: string
  salary?: string
  benefits?: string[]
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

export async function analyzeJobPosting(
  text: string,
  baseURL: string,
  model: string,
  apiKey: string
): Promise<JobAnalysisResult> {
  const { client, isAnthropic } = getAIClient(baseURL, apiKey)

  const prompt = `Analyse le texte suivant et détermine s'il s'agit d'une offre d'emploi.

Texte à analyser:
${text}

Réponds UNIQUEMENT avec un objet JSON au format suivant (pas de texte avant ou après):
{
  "isJobPosting": true ou false (true si c'est une offre d'emploi),
  "confidence": nombre entre 0 et 1 (ton niveau de confiance),
  "summary": "résumé COMPLET et BIEN FORMATÉ de l'offre. IMPORTANT: Si c'est une offre d'emploi, le résumé doit être structuré avec des sections claires et des listes à puces. Inclus TOUTES les informations importantes : titre du poste, entreprise, missions (avec • pour chaque mission), compétences requises (avec • pour chaque compétence), outils/technologies (avec • pour chaque outil), expérience demandée, type de contrat, localisation, avantages, etc. Utilise des sauts de ligne (\\n) pour séparer les sections. Si ce n'est pas une offre d'emploi, explique brièvement et de manière CONCISE (max 2 phrases) pourquoi le contenu ne semble pas être une offre d'emploi (ex: page de login, article de blog, page d'accueil, etc.)."
}`

  try {
    const result = await generateText({
      model: isAnthropic ? client(model) : client.chat(model),
      prompt,
    })

    // Try to parse the AI response
    let analysis: JobAnalysisResult
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]) as JobAnalysisResult
      } else {
        throw new Error('No JSON found in response')
      }
    } catch {
      // If parsing fails, try to infer from the text
      console.warn('Failed to parse AI response as JSON, attempting fallback')
      
      // Simple heuristic: if the text mentions job-related keywords
      const jobKeywords = ['poste', 'candidat', 'compétences', 'expérience', 'mission', 'responsabilités', 'job', 'position', 'skills', 'requirements']
      const hasJobKeywords = jobKeywords.some(keyword => 
        text.toLowerCase().includes(keyword)
      )
      
      analysis = {
        isJobPosting: hasJobKeywords,
        confidence: hasJobKeywords ? 0.7 : 0.3,
        summary: result.text,
      }
    }

    return analysis
  } catch (error) {
    console.error('Error analyzing job posting:', error)
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to analyze job posting'
    )
  }
}

export async function analyzeJobDetails(
  text: string,
  baseURL: string,
  model: string,
  apiKey: string
): Promise<JobDetails> {
  const { client, isAnthropic } = getAIClient(baseURL, apiKey)

  const prompt = `Analyse en détail cette offre d'emploi et extrais toutes les informations structurées.

OFFRE D'EMPLOI:
${text}

Réponds UNIQUEMENT avec un objet JSON au format suivant (pas de texte avant ou après):
{
  "jobTitle": "titre exact du poste (MAX 35 caractères, raccourcis si nécessaire)",
  "company": "nom de l'entreprise (MAX 35 caractères, raccourcis si nécessaire, ou 'Non spécifié' si absent)",
  "location": "ville/région (ou null si absent)",
  "keywords": ["liste", "de", "mots-clés", "importants", "de", "l'offre"],
  "tools": ["outil 1", "outil 2", "technologie 1"] (tous les outils, technologies, langages, frameworks mentionnés),
  "requiredSkills": ["compétence obligatoire 1", "compétence obligatoire 2"] (compétences indispensables/requises),
  "preferredSkills": ["compétence appréciée 1", "compétence appréciée 2"] (compétences souhaitées/appréciées, ou array vide si absent),
  "profile": "description du profil recherché en quelques lignes",
  "missions": ["mission 1", "mission 2", "mission 3"] (responsabilités/missions du poste),
  "contractType": "CDI/CDD/Stage/Freelance/etc" (ou null si absent),
  "salary": "fourchette de salaire si mentionnée" (ou null si absent),
  "benefits": ["avantage 1", "avantage 2"] (avantages mentionnés, ou array vide si absent)
}

IMPORTANT:
- Extrais le maximum d'informations possibles
- Si une information n'est pas présente, utilise null pour les strings ou [] pour les arrays
- Pour les keywords, extrais les mots-clés les plus importants (secteur, domaine, technologies principales)
- Pour les tools, liste TOUS les outils/technologies/langages mentionnés
- LIMITE STRICTE: jobTitle et company ne doivent JAMAIS dépasser 35 caractères. Abrège intelligemment si nécessaire (ex: "Développeur Full Stack" au lieu de "Développeur Full Stack Senior avec expertise Cloud")`

  try {
    const result = await generateText({
      model: isAnthropic ? client(model) : client.chat(model),
      prompt,
    })

    // Try to parse the AI response
    let details: JobDetails
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        details = JSON.parse(jsonMatch[0]) as JobDetails
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse job details:', parseError)
      // Fallback avec des valeurs par défaut
      details = {
        jobTitle: 'Non spécifié',
        company: 'Non spécifié',
        location: undefined,
        keywords: [],
        tools: [],
        requiredSkills: [],
        preferredSkills: [],
        profile: 'Profil non spécifié',
        missions: [],
        contractType: undefined,
        salary: undefined,
        benefits: [],
      }
    }

    // Ensure jobTitle and company don't exceed 35 characters
    if (details.jobTitle && details.jobTitle.length > 35) {
      details.jobTitle = details.jobTitle.substring(0, 32) + '...'
    }
    if (details.company && details.company.length > 35) {
      details.company = details.company.substring(0, 32) + '...'
    }

    return details
  } catch (error) {
    console.error('Error analyzing job details:', error)
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to analyze job details'
    )
  }
}
