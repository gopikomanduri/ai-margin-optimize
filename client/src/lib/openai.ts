import { apiRequest } from "@/lib/queryClient";

export async function analyzeSentiment(text: string): Promise<{
  rating: number;
  confidence: number;
}> {
  try {
    const response = await apiRequest('POST', '/api/analyze/sentiment', { text });
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to analyze sentiment: ${error.message}`);
  }
}

export async function generateTradingIdea(
  preferences: {
    riskLevel: string;
    strategy: string;
    horizon: string;
  }
): Promise<any> {
  try {
    const response = await apiRequest('POST', '/api/generate/trade-idea', { preferences });
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to generate trading idea: ${error.message}`);
  }
}

export async function explainConcept(concept: string): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/explain', { concept });
    const data = await response.json();
    return data.explanation;
  } catch (error) {
    throw new Error(`Failed to explain concept: ${error.message}`);
  }
}
