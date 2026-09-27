# Jev Integration Plan for Scope Classification

This document outlines the plan to replace the existing lightweight LLM-based scope classification step with a TypeSafe Jev model for determining whether a user question is about the author's skills, knowledge, or work.

## 1. Minimal Jev Question Schema

We propose two questions for the Jev model:

### Question 1: `is_about_skills` (noul - yes/no probability)
- **Type**: `noul`
- **Instructions**: "Is this question asking about the author's own technical stack, skills, past projects, tools, or what they personally know/do?"
- **Criteria**:
  - **true**: The question is about the author's personal technical stack, skills, past projects, tools, or what they personally know/do (e.g., "What is your experience with React?", "Which projects did you build using Node.js?", "How do you approach debugging in Python?").
  - **false**: The question is not about the author's personal technical stack, skills, past projects, tools, or what they personally know/do. It might be about general knowledge, other people, opinions, or unrelated topics (e.g., "What is the capital of France?", "Explain quantum entanglement", "What do you think about climate change?").

### Question 2: `relevance_score` (score - optional)
- **Type**: `score`
- **Instructions**: "How relevant is the question to the author's skills, knowledge, or work?"
- **Criteria** (ordered from least to most relevant):
  - `["Unrelated", "Loosely related", "Directly about my skills/work"]`
  - **Unrelated**: The question has no connection to the author's skills, knowledge, or work.
  - **Loosely related**: The question is tangentially related (e.g., about a technology the author has used but not in depth, or about a general topic the author might have an opinion on).
  - **Directly about my skills/work**: The question is explicitly about the author's specific skills, projects, tools, or personal knowledge.

## 2. Example Jev Request Payload

```json
{
  "state": {
    "user_question": "What is your experience with React?",
    "about_me_summary": "I am a full-stack developer with 5 years of experience in React, Node.js, and PostgreSQL. I have built several production applications using these technologies, including an e-commerce platform and a real-time chat app."
  },
  "model": "jev-latest",
  "questions": {
    "is_about_skills": {
      "type": "noul",
      "instructions": "Is this question asking about the author's own technical stack, skills, past projects, tools, or what they personally know/do?",
      "criteria": {
        "true": "The question is about the author's personal technical stack, skills, past projects, tools, or what they personally know/do.",
        "false": "The question is not about the author's personal technical stack, skills, past projects, tools, or what they personally know/do. It might be about general knowledge, other people, or unrelated topics."
      }
    },
    "relevance_score": {
      "type": "score",
      "instructions": "How relevant is the question to the author's skills, knowledge, or work?",
      "criteria": ["Unrelated", "Loosely related", "Directly about my skills/work"]
    }
  }
}
```

> **Note**: The "about_me_summary" field in the state payload should ultimately be built dynamically from the app's actual knowledge base categories/tags (not hardcoded example text). This is a decision to finalize in the next implementation phase.

## 3. Decision Policy (Pseudocode)

```javascript
// Threshold for allowing RAG answer (defined as a named constant, not a magic number)
const SCOPE_CLASSIFICATION_THRESHOLD = 0.85;

// Assume we have a function to call the Jev model and get answers
async function getJevClassification(userQuestion, aboutMeSummary) {
  const requestPayload = {
    state: {
      user_question: userQuestion,
      about_me_summary: aboutMeSummary
    },
    model: "jev-latest",
    questions: {
      is_about_skills: {
        type: "noul",
        instructions: "Is this question asking about the author's own technical stack, skills, past projects, tools, or what they personally know/do?",
        criteria: {
          true: "The question is about the author's personal technical stack, skills, past projects, tools, or what they personally know/do.",
          false: "The question is not about the author's personal technical stack, skills, past projects, tools, or what they personally know/do. It might be about general knowledge, other people, or unrelated topics."
        }
      },
      relevance_score: {
        type: "score",
        instructions: "How relevant is the question to the author's skills, knowledge, or work?",
        criteria: ["Unrelated", "Loosely related", "Directly about my skills/work"]
      }
    }
  };

  // In practice, this would be an HTTP call to the Jev API
  const jevApiResponse = await callJevApi(requestPayload);
  return jevApiResponse.answers;
}

// Main decision function
async function handleUserQuestion(userQuestion, aboutMeSummary) {
  // jevResults is the answers object from the Jev response
  const jevResults = await getJevClassification(userQuestion, aboutMeSummary);
  
  // Extract the noul probability for the is_about_skills question
  const isAboutSkillsProbability = jevResults.is_about_skills.noul;
  
  // Decision policy: allow RAG answer only if probability meets or exceeds threshold
  if (isAboutSkillsProbability >= SCOPE_CLASSIFICATION_THRESHOLD) {
    // Proceed with RAG-based answer generation
    const ragAnswer = await generateRagAnswer(userQuestion);
    return ragAnswer;
  } else {
    // Block RAG and return existing fallback response
    return getFallbackResponse();
  }
}

// Helper functions (placeholders for existing implementations)
async function generateRagAnswer(question) {
  // Existing RAG logic to generate answer from knowledge base
}

function getFallbackResponse() {
  // Existing fallback response (e.g., "I can only answer questions about my skills and experience.")
}
```

## Notes
- The `is_about_skills` noul question returns a probability between 0 and 1, representing the model's confidence that the question is about the author's skills.
- The threshold of 0.85 is chosen to ensure high precision in allowing RAG answers, minimizing false positives.
- The `relevance_score` question is optional and can be used for additional filtering or logging if needed, but the primary decision is based on the noul question.
- This plan assumes the existing fallback mechanism and RAG answer generation remain unchanged; only the scope classification step is replaced.