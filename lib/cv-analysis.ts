/**
 * CV Analysis utilities
 * Handles PDF extraction and AI parsing
 */

import { extractTextFromPDF, extractTextWithOCR } from './pdf'
import { parseCVWithAI, type UserInfo } from './ai/cv-parser'
import { validateCV } from './ai/cv-validator'
import { db, type CVAnalysisStatus, type ParsedCVData } from './db'

// Re-export UserInfo for convenience
export type { UserInfo } from './ai/cv-parser'

export async function analyzeCVFile(
  file: File,
  aiConfig: { baseURL: string; model: string; apiKey: string },
  onProgress?: (status: CVAnalysisStatus) => void,
  userInfo?: UserInfo
): Promise<ParsedCVData> {
  
  // Ensure we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('CV analysis can only be performed in the browser')
  }
  
  const updateStatus = async (status: Partial<CVAnalysisStatus>) => {
    const currentStatus: CVAnalysisStatus = {
      status: 'idle',
      progress: 0,
      lastUpdated: Date.now(),
      ...status,
    }
    
    // Save to IndexedDB
    await db.settings.put({
      key: 'cv_analysis_status',
      value: currentStatus,
    })
    
    // Notify callback
    onProgress?.(currentStatus)
  }

  try {
    // Step 1: Extract text from PDF
    await updateStatus({ status: 'extracting', progress: 10 })

    let extractedText = ''
    let usedOCR = false

    try {
      const extracted = await extractTextFromPDF(file)
      extractedText = extracted.text

      // If extracted text is insufficient, try OCR as fallback
      if (!extractedText || extractedText.length < 50) {
        console.warn('PDF text extraction returned minimal text, attempting OCR fallback...')
        await updateStatus({ status: 'extracting', progress: 15, error: 'Tentative d\'extraction OCR en cours...' })

        try {
          const ocrResult = await extractTextWithOCR(file)
          extractedText = ocrResult.text
          usedOCR = true

          // Check if OCR also failed to extract enough text
          if (!extractedText || extractedText.length < 50) {
            throw new Error('Le PDF ne contient pas assez de texte même après OCR. Veuillez vérifier que le document est lisible et contient du contenu textuel.')
          }

          console.info('OCR extraction successful, extracted', extractedText.length, 'characters')
        } catch (ocrError) {
          console.error('OCR extraction failed:', ocrError)
          throw new Error(
            ocrError instanceof Error
              ? `Échec de l'extraction OCR: ${ocrError.message}`
              : 'Le PDF ne contient pas assez de texte. Il s\'agit peut-être d\'un PDF scanné (image) de mauvaise qualité.'
          )
        }
      }
    } catch (error) {
      console.error('PDF extraction failed:', error)
      throw new Error(error instanceof Error ? error.message : 'Impossible d\'extraire le texte du PDF')
    }

    // Step 2: Validate that it's actually a CV
    await updateStatus({
      status: 'analyzing',
      progress: 30,
      ...(usedOCR && { error: 'Texte extrait via OCR (PDF scanné détecté)' })
    })
    
    const validation = await validateCV(
      extractedText,
      aiConfig.baseURL,
      aiConfig.model,
      aiConfig.apiKey
    )

    if (!validation.isCV || validation.confidence < 0.6) {
      throw new Error(
        `Ce document ne semble pas être un CV (confiance: ${Math.round(validation.confidence * 100)}%). ` +
        `Raison: ${validation.reason}. Veuillez uploader un CV valide.`
      )
    }

    // Step 3: Parse CV with AI
    await updateStatus({ status: 'analyzing', progress: 60 })

    const parsedCV = await parseCVWithAI(
      extractedText,
      aiConfig.baseURL,
      aiConfig.model,
      aiConfig.apiKey,
      userInfo
    )

    await updateStatus({ status: 'analyzing', progress: 80 })

    // Step 3: Save parsed data to IndexedDB
    await db.settings.put({
      key: 'cv_parsed_data',
      value: parsedCV,
    })

    await updateStatus({ 
      status: 'completed', 
      progress: 100,
      parsedData: parsedCV,
    })

    return parsedCV
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    await updateStatus({ 
      status: 'error', 
      progress: 0,
      error: errorMessage,
    })
    throw error
  }
}

export async function getCVAnalysisStatus(): Promise<CVAnalysisStatus | null> {
  const entry = await db.settings.get('cv_analysis_status')
  return entry?.value as CVAnalysisStatus | null
}

export async function getParsedCVData(): Promise<ParsedCVData | null> {
  const entry = await db.settings.get('cv_parsed_data')
  return entry?.value as ParsedCVData | null
}

