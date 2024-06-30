import { createAsyncThunk } from '@reduxjs/toolkit'
import { RootState } from '..'
import { textResponse } from '../../types/responses'

const model = "gemini-1.5-pro";

export const generateTextContent = createAsyncThunk(
  'user/generateTextContent',
  async ({ prompt }: { prompt: string }, thunkApi) => {
    const currentState = thunkApi.getState() as RootState
    const { API_KEY: apiKey, proxy, conversation } = currentState.user

    const conversationParts = conversation.data && conversation.data.length > 0
      ? conversation.data.slice(0, -1).map(entry => entry.message)
      : []

    const allParts = [...conversationParts, prompt]

    const data = await postGenerateContent(apiKey, allParts, model, proxy)

    const aiAnswerText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (aiAnswerText === undefined) {
      throw Error(data?.error?.message)
    }

    return aiAnswerText
  }
)

async function postGenerateContent(
  apiKey: string,
  allParts: string[],
  model: 'gemini-1.0-pro' | 'gemini-1.5-pro' | 'gemini-1.5-flash',
  proxy: string | undefined,
): Promise<textResponse> {
  const requestBody= {
    contents: [
      {
        parts: allParts.map(text => ({ text })),
      },
    ]
  }

  const response = await fetch(
    `${proxy ? proxy : ''}https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    },
  )

  return await response.json()
}
