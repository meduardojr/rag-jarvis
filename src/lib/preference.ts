import { sql } from './db';

// We'll use a simple scoring: each choice gets 1 point, and we break ties by most recent.
// For auto-pick, we'll require that the top option has at least 2x the score of the second and at least 3 total choices.

const AUTO_PICK_THRESHOLD_RATIO = 2.0; // top option must have at least 2x the score of the second
const MIN_SAMPLE_SIZE = 3; // minimum number of total choices in the category to consider auto-pick

export async function getPreferenceScores(category: string) {
  const rows = await sql`
    SELECT option_chosen, COUNT(*) as count, MAX(created_at) as last_used
    FROM preference_choices
    WHERE category = ${category}
    GROUP BY option_chosen
    ORDER BY count DESC, last_used DESC
  `;

  return rows.map((row) => ({
    option: row.option_chosen,
    score: row.count, // simple count-based score
    lastUsed: row.last_used,
  }));
}

export async function shouldAutoPick(category: string): Promise<{ shouldPick: boolean; topOption: string | null }> {
  const scores = await getPreferenceScores(category);
  if (scores.length === 0) {
    return { shouldPick: false, topOption: null };
  }

  if (scores.length < 2) {
    // Only one option, we can auto-pick if we have enough samples
    const totalChoices = await sql`
      SELECT COUNT(*) as total FROM preference_choices WHERE category = ${category}
    `;
    const total = Number(totalChoices[0].total);
    return { shouldPick: total >= MIN_SAMPLE_SIZE, topOption: scores[0].option };
  }

  const topOption = scores[0];
  const secondOption = scores[1];

  // Check if top option has at least AUTO_PICK_THRESHOLD_RATIO times the score of the second
  const ratio = topOption.score / secondOption.score;
  const totalChoices = await sql`
    SELECT COUNT(*) as total FROM preference_choices WHERE category = ${category}
  `;
  const total = Number(totalChoices[0].total);

  const shouldPick = ratio >= AUTO_PICK_THRESHOLD_RATIO && total >= MIN_SAMPLE_SIZE;

  return { shouldPick: shouldPick, topOption: topOption.option };
}

export async function recordPreference(category: string, optionChosen: string, contextQuery: string | null = null) {
  await sql`
    INSERT INTO preference_choices (category, option_chosen, context_query)
    VALUES (${category}, ${optionChosen}, ${contextQuery})
  `;
}