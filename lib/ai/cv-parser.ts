/**
 * CV Parser using AI
 * Extracts structured data from CV text
 * Client-side only - uses browser APIs
 */

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

export interface ParsedCV {
  name: string
  email: string
  phone: string
  about: string
  skills: string[]
  experience: Array<{
    title: string
    company: string
    period: string
    description: string
  }>
  education: Array<{
    degree: string
    institution: string
    period: string
  }>
  languages: Array<{
    name: string
    level: string
  }>
  hobbies: string[]
  certifications: string[]
}

export interface UserInfo {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

export interface CVAnalysisState {
  status: 'idle' | 'extracting' | 'analyzing' | 'completed' | 'error'
  progress: number
  error?: string
  lastUpdated: number
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

export async function parseCVWithAI(
  cvText: string,
  baseURL: string,
  model: string,
  apiKey: string,
  userInfo?: UserInfo
): Promise<ParsedCV> {
  const { client, isAnthropic } = getAIClient(baseURL, apiKey)

  // Build user info section if available
  let userInfoSection = ''
  if (userInfo && (userInfo.firstName || userInfo.lastName || userInfo.email || userInfo.phone)) {
    const userInfoParts: string[] = []

    if (userInfo.firstName && userInfo.lastName) {
      userInfoParts.push(`Nom: ${userInfo.firstName} ${userInfo.lastName}`)
    } else if (userInfo.firstName) {
      userInfoParts.push(`Prénom: ${userInfo.firstName}`)
    } else if (userInfo.lastName) {
      userInfoParts.push(`Nom: ${userInfo.lastName}`)
    }

    if (userInfo.email) {
      userInfoParts.push(`Email: ${userInfo.email}`)
    }

    if (userInfo.phone) {
      userInfoParts.push(`Téléphone: ${userInfo.phone}`)
    }

    userInfoSection = `

INFORMATIONS FOURNIES PAR L'UTILISATEUR:
${userInfoParts.join('\n')}

INSTRUCTIONS POUR L'UTILISATION DES INFORMATIONS UTILISATEUR:
- Compare les informations du CV avec celles fournies par l'utilisateur
- Si les informations personnelles du CV correspondent à celles de l'utilisateur (même nom, email similaire), UTILISE EN PRIORITÉ les informations de l'utilisateur pour corriger d'éventuelles erreurs d'OCR ou d'extraction
- Si les informations personnelles du CV sont DIFFÉRENTES de celles de l'utilisateur (nom différent, email totalement différent), cela signifie probablement que l'utilisateur analyse le CV d'une autre personne. Dans ce cas, GARDE LES INFORMATIONS DU CV et ignore les informations utilisateur
- Utilise ton jugement pour déterminer si c'est le même profil ou non
- Exemples de cas où utiliser les infos utilisateur: email mal reconnu par OCR, format de téléphone différent, nom avec accents mal extraits
- Exemples de cas où garder les infos du CV: nom complètement différent, domaine email différent de celui du CV`
  }

  const prompt = `Analyse ce CV et extrait les informations suivantes au format JSON strict.

CV:
${cvText}${userInfoSection}

Réponds UNIQUEMENT avec un objet JSON au format suivant (sans texte avant ou après, juste le JSON):
{
  "name": "Prénom Nom complet",
  "email": "email@example.com",
  "phone": "+33612345678",
  "about": "Résumé professionnel ou description de profil",
  "skills": ["Compétence 1", "Compétence 2", "Compétence 3"],
  "experience": [
    {
      "title": "Titre du poste",
      "company": "Nom de l'entreprise",
      "period": "Jan 2020 - Déc 2022",
      "description": "Description des responsabilités"
    }
  ],
  "education": [
    {
      "degree": "Diplôme obtenu",
      "institution": "Nom de l'établissement",
      "period": "2015 - 2018"
    }
  ],
  "languages": [
    {
      "name": "Français",
      "level": "Natif"
    },
    {
      "name": "Anglais",
      "level": "Courant"
    }
  ],
  "hobbies": ["Loisir 1", "Loisir 2"],
  "certifications": ["Certification 1", "Certification 2"]
}

IMPORTANT:
- Si une information n'est pas trouvée, utilise une chaîne vide "" ou un tableau vide []
- Le JSON doit être valide et parseable
- Ne rajoute AUCUN texte avant ou après le JSON
- Tous les champs doivent être présents même si vides`

  try {
    const result = await generateText({
      model: isAnthropic ? client(model) : client.chat(model),
      prompt,
    })

    // Extract and parse JSON from response
    let parsedCV: ParsedCV
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedCV = JSON.parse(jsonMatch[0]) as ParsedCV
      } else {
        throw new Error('No JSON found in AI response')
      }
    } catch {
      console.error('Failed to parse AI response:', result.text)
      throw new Error('AI response could not be parsed as valid JSON')
    }

    // Validate that all required fields are present
    const defaultCV: ParsedCV = {
      name: '',
      email: '',
      phone: '',
      about: '',
      skills: [],
      experience: [],
      education: [],
      languages: [],
      hobbies: [],
      certifications: [],
    }

    // Merge with defaults to ensure all fields exist
    return { ...defaultCV, ...parsedCV }

  } catch (error) {
    console.error('Error parsing CV with AI:', error)
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to parse CV'
    )
  }
}

