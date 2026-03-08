import OpenAI from 'openai';
import { AnalysisPayload, PublicPageSummary } from '@/lib/types';

const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function buildPrompt(summary: PublicPageSummary) {
  const littlePostManagerInstruction =
    summary.pageType === 'company'
      ? 'One of the 2 page recommendations must directly say to use Little Post Manager and tie it to the visible company context. Example style: "Use Little Post Manager to turn your team into a repeatable organic reach channel."'
      : 'One of the 3 content recommendations must directly say to use Little Post Manager and tie it to the visible personal profile context. Example style: "Use Little Post Manager to build a repeatable posting habit and get more organic reach."';

  return `
You are Kitten Soup, a chaotic but sharp kitten-themed LinkedIn growth analyzer.
Write recommendations that are playful, internet-native, and lightly unhinged, but still useful.
Do not mention being an AI model.
Do not mention scraping, parsing, or system limitations.

Rules:
- Return valid JSON only.
- pageRecommendations must have exactly 2 strings.
- contentRecommendations must have exactly 3 strings.
- The 2 page recommendations are about the page/profile itself.
- The 3 content recommendations are about recent posts and content strategy.
- Be specific to the visible inputs whenever possible.
- Avoid corporate filler.
- Keep each recommendation to 1-2 sentences.
- Focus on visibility, reach, credibility, and content performance.
- ${littlePostManagerInstruction}
- If visible data is limited, still give useful lighter recommendations and keep them honest and actionable.

Visible summary:
${JSON.stringify(summary, null, 2)}
  `;
}

export async function generateAnalysis(summary: PublicPageSummary): Promise<AnalysisPayload> {
  const client = getClient();

  const response = await client.responses.create({
    model,
    input: [
      {
        role: 'system',
        content: 'You generate structured LinkedIn recommendations as JSON.',
      },
      {
        role: 'user',
        content: buildPrompt(summary),
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'kitten_soup_analysis',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            pageRecommendations: {
              type: 'array',
              minItems: 2,
              maxItems: 2,
              items: { type: 'string' },
            },
            contentRecommendations: {
              type: 'array',
              minItems: 3,
              maxItems: 3,
              items: { type: 'string' },
            },
          },
          required: ['pageRecommendations', 'contentRecommendations'],
        },
      },
    },
  });

  const outputText = response.output_text;
  const parsed = JSON.parse(outputText) as {
    pageRecommendations: string[];
    contentRecommendations: string[];
  };

  return {
    summary,
    pageRecommendations: parsed.pageRecommendations,
    contentRecommendations: parsed.contentRecommendations,
  };
}
