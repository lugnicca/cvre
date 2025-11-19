import { NextRequest, NextResponse } from 'next/server'

// Modèles Anthropic prédéfinis (Anthropic n'a pas d'endpoint /models)
const ANTHROPIC_MODELS = [
  { id: 'claude-3-5-sonnet-20241022', created: 1729728000, owned_by: 'anthropic' },
  { id: 'claude-3-5-sonnet-20240620', created: 1718841600, owned_by: 'anthropic' },
  { id: 'claude-3-opus-20240229', created: 1709251200, owned_by: 'anthropic' },
  { id: 'claude-3-sonnet-20240229', created: 1709251200, owned_by: 'anthropic' },
  { id: 'claude-3-haiku-20240307', created: 1709856000, owned_by: 'anthropic' },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const apiKey = searchParams.get('apiKey')
    const baseURL = searchParams.get('baseURL') || 'https://api.openai.com/v1'

    console.log('GET /api/models - Request received:', {
      hasApiKey: !!apiKey,
      baseURL,
      apiKeyLength: apiKey?.length || 0,
    })

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Détecter le fournisseur basé sur l'URL
    const isAnthropic = baseURL.includes('anthropic.com')
    const isOpenRouter = baseURL.includes('openrouter.ai')
    
    console.log('Provider detection:', { isAnthropic, isOpenRouter, baseURL })

    // Anthropic n'a pas d'endpoint /models, retourner les modèles prédéfinis
    if (isAnthropic) {
      // Vérifier que la clé API est valide en testant avec un appel simple
      try {
        const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }],
          }),
        })

        if (!testResponse.ok) {
          const errorData = await testResponse.json().catch(() => ({}))
          const errorMessage = errorData.error?.message || errorData.error || 'Invalid API key'
          return NextResponse.json(
            { error: errorMessage },
            { status: testResponse.status }
          )
        }
      } catch (error) {
        console.error('Error validating Anthropic API key:', error)
        return NextResponse.json(
          { error: 'Failed to validate API key. Please check your connection.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ models: ANTHROPIC_MODELS })
    }

    // Pour tous les autres fournisseurs, utiliser l'endpoint baseURL/models
    // Normaliser l'URL pour éviter les doubles slashes
    const normalizedBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
    const modelsEndpoint = `${normalizedBaseURL}/models`
    
    console.log('Constructed endpoint:', {
      originalBaseURL: baseURL,
      normalizedBaseURL,
      modelsEndpoint,
    })
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
    
    // OpenRouter nécessite des headers supplémentaires
    if (isOpenRouter) {
      headers['HTTP-Referer'] = request.headers.get('referer') || 'https://cvre.app'
      headers['X-Title'] = 'CVre'
    }
    
    console.log('Fetching models from:', modelsEndpoint, 'with headers:', Object.keys(headers))
    
    let response
    try {
      response = await fetch(modelsEndpoint, {
        headers,
      })
    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Network error'
      return NextResponse.json(
        { error: `Failed to connect to API: ${errorMessage}` },
        { status: 500 }
      )
    }

    if (!response.ok) {
      let errorMessage = 'Failed to fetch models'
      try {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error?.message || errorData.error || errorMessage
          console.error('API Error:', {
            status: response.status,
            error: errorMessage,
            errorData,
            baseURL: modelsEndpoint,
          })
        } catch (parseError) {
          console.error('API Error (non-JSON):', {
            status: response.status,
            errorText: errorText.substring(0, 200),
            baseURL: modelsEndpoint,
          })
          errorMessage = `API returned status ${response.status}: ${errorText.substring(0, 100)}`
        }
      } catch (readError) {
        console.error('API Error (cannot read response):', {
          status: response.status,
          error: readError,
          baseURL: modelsEndpoint,
        })
        errorMessage = `API returned status ${response.status}`
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    // Lire le texte de la réponse d'abord pour pouvoir le logger en cas d'erreur
    const responseText = await response.text()
    console.log('Raw response text (first 500 chars):', responseText.substring(0, 500))
    
    let data
    try {
      data = JSON.parse(responseText)
      console.log('Parsed response data:', {
        keys: Object.keys(data),
        hasData: !!data.data,
        hasModels: !!data.models,
        dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
        modelsType: Array.isArray(data.models) ? 'array' : typeof data.models,
        dataLength: Array.isArray(data.data) ? data.data.length : 0,
        modelsLength: Array.isArray(data.models) ? data.models.length : 0,
        isArray: Array.isArray(data),
      })
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError)
      console.error('Response text:', responseText.substring(0, 1000))
      return NextResponse.json(
        { error: 'Invalid JSON response from API. Check server logs for details.' },
        { status: 500 }
      )
    }
    
    // Extract model IDs and sort them
    // OpenAI retourne { data: [...] }
    // OpenRouter peut retourner { data: [...] } ou directement un tableau
    // Certains endpoints peuvent retourner directement un tableau
    let modelsList: any[] = []
    
    if (Array.isArray(data)) {
      // Si la réponse est directement un tableau
      modelsList = data
      console.log('Response is directly an array')
    } else if (Array.isArray(data.data)) {
      // Format OpenAI standard: { data: [...] }
      modelsList = data.data
      console.log('Using data.data array')
    } else if (Array.isArray(data.models)) {
      // Format alternatif: { models: [...] }
      modelsList = data.models
      console.log('Using data.models array')
    } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      // Format possible: { data: { models: [...] } }
      if (Array.isArray(data.data.models)) {
        modelsList = data.data.models
        console.log('Using data.data.models array')
      }
    }
    
    if (modelsList.length === 0) {
      console.error('No models found in response. Full data structure:', JSON.stringify(data, null, 2))
      return NextResponse.json(
        { error: 'No models found in API response. Check server logs for details.' },
        { status: 500 }
      )
    }
    
    console.log(`Processing ${modelsList.length} models`)
    
    const models = modelsList
      .map((model: any, index: number) => {
        if (!model || typeof model !== 'object') {
          console.warn(`Invalid model object at index ${index}:`, model)
          return null
        }
        const modelId = model.id || model.name || `model-${index}`
        if (!modelId || modelId === 'unknown') {
          console.warn(`Model at index ${index} has no valid ID:`, model)
          return null
        }
        return {
          id: modelId,
          created: model.created || model.created_at || 0,
          owned_by: model.owned_by || model.organization || model.provider || 'unknown',
        }
      })
      .filter((model: any) => model !== null && model.id !== 'unknown')
      .sort((a: any, b: any) => {
        // Prioritize GPT models for OpenAI
        if (!isOpenRouter) {
          if (a.id.includes('gpt') && !b.id.includes('gpt')) return -1
          if (!a.id.includes('gpt') && b.id.includes('gpt')) return 1
        }
        return b.created - a.created
      })

    console.log(`Returning ${models.length} processed models`)
    if (models.length === 0) {
      return NextResponse.json(
        { error: 'No valid models found after processing. Check server logs for details.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ models })
  } catch (error) {
    console.error('Error fetching models:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, baseURL = 'https://api.openai.com/v1', model } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      )
    }

    // Test the connection by making a simple API call
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error?.message || 'Connection test failed' 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Connection successful' 
    })
  } catch (error) {
    console.error('Error testing connection:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

