export const PROMPT_TEMPLATES = {
  claude: `You are an expert AI assistant. Your task is to generate a detailed, ready-to-use prompt for the AI assistant Claude based on the user's specifications and their personal knowledge base.

User's specifications:
{user_query}

Relevant knowledge from the user's personal knowledge base:
{knowledge_context}

Target tool: Claude
Instructions:
1. Generate a prompt that is optimized for Claude, using XML tags where appropriate to structure the prompt.
2. Incorporate the relevant knowledge from the user's knowledge base to ensure the prompt reflects their preferences, stacks, conventions, and past decisions.
3. The prompt should be detailed, clear, and actionable.
4. Format the output as a plain text prompt that can be copied and pasted into Claude.

Generated prompt for Claude:`,
  
  bolt: `You are an expert AI assistant. Your task is to generate a concise, UI/component-focused prompt for the AI assistant Bolt (or v0) based on the user's specifications and their personal knowledge base.

User's specifications:
{user_query}

Relevant knowledge from the user's personal knowledge base:
{knowledge_context}

Target tool: Bolt/v0
Instructions:
1. Generate a prompt that is optimized for Bolt/v0, focusing on UI components, layout, and styling.
2. Incorporate the relevant knowledge from the user's knowledge base to ensure the prompt reflects their preferences.
3. The prompt should be concise and directly usable in Bolt/v0.
4. Format the output as a plain text prompt that can be copied and pasted into Bolt/v0.

Generated prompt for Bolt/v0:`,
  
  cursor: `You are an expert AI assistant. Your task is to generate a code-context focused prompt for the AI assistant Cursor (or GitHub Copilot) based on the user's specifications and their personal knowledge base.

User's specifications:
{user_query}

Relevant knowledge from the user's personal knowledge base:
{knowledge_context}

Target tool: Cursor/Copilot
Instructions:
1. Generate a prompt that is optimized for Cursor/Copilot, focusing on code context, file-specific instructions, and programming conventions.
2. Incorporate the relevant knowledge from the user's knowledge base to ensure the prompt reflects their preferences for code structure, patterns, and conventions.
3. The prompt should be detailed and useful for code generation.
4. Format the output as a plain text prompt that can be copied and pasted into Cursor or Copilot.

Generated prompt for Cursor/Copilot:`,
};

export function getTemplate(targetTool: string): string {
  // Normalize the target tool to match our template keys
  const tool = targetTool.toLowerCase().replace(/[\s\-]/g, '');
  if (tool.includes('claude')) return PROMPT_TEMPLATES.claude;
  if (tool.includes('bolt') || tool.includes('v0')) return PROMPT_TEMPLATES.bolt;
  if (tool.includes('cursor') || tool.includes('copilot')) return PROMPT_TEMPLATES.cursor;
  // Default to Claude template
  return PROMPT_TEMPLATES.claude;
}