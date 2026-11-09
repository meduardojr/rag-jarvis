# Jev Integration Plan for Scope Classification

This document outlines the plan to replace the existing lightweight LLM-based scope classification step with a TypeSafe Jev model for determining whether a user question is about the author's technical work.

## 1. Minimal Jev Question Schema

We propose one question for the Jev model:

### Question 1: `is_relevant_topic` (noul - yes/no probability)
- **Type**: `noul`
- **Question ID**: `is_relevant_topic`
- **Instructions**: "Is this question asking for advice, explanation, comparison, or help about software development, architecture, tooling, deployment, or the author's own technical skills, projects, and experience?"
- **Criteria**:
  - **true**: The question is about software development, architecture, tooling, deployment, or the author's own technical work and experience.
  - **false**: The question is unrelated to those, e.g. general trivia, small talk, politics, or other non-technical topics.

> **Note**: The `relevance_score` question has been removed. The primary decision is based solely on the `is_relevant_topic` noul question.

## 2. Example Jev Request Payload

```json
{
  "state": {
    "user_question": "What is your experience with React?",
    "about_me_summary": "I am a full-stack developer with 5 years of experience in React, Node.js, and PostgreSQL. I have built several production applications using these technologies, including an e-commerce platform and a real-time chat app."
  },
  "model": "jev-latest",
  "questions": {
    "is_relevant_topic": {
      "type": "noul",
      "instructions": "Is this question asking for advice, explanation, comparison, or help about software development, architecture, tooling, deployment, or the author's own technical skills, projects, and experience?",
      "criteria": {
        "true": "The question is about software development, architecture, tooling, deployment, or the author's own technical work and experience.",
        "false": "The question is unrelated to those, e.g. general trivia, small talk, politics, or other non-technical topics."
      }
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
      is_relevant_topic: {
        type: "noul",
        instructions: "Is this question asking for advice, explanation, comparison, or help about software development, architecture, tooling, deployment, or the author's own technical skills, projects, and experience?",
        criteria: {
          true: "The question is about software development, architecture, tooling, deployment, or the author's own technical work and experience.",
          false: "The question is unrelated to those, e.g. general trivia, small talk, politics, or other non-technical topics."
        }
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
  
  // Extract the noul probability for the is_relevant_topic question
  const isRelevantProbability = jevResults.is_relevant_topic.noul;
  
  // Decision policy: allow RAG answer only if probability meets or exceeds threshold
  if (isRelevantProbability >= SCOPE_CLASSIFICATION_THRESHOLD) {
    // Proceed with RAG answer generation
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
- The `is_relevant_topic` noul question returns a probability between 0 and 1, representing the model's confidence that the question is about the author's technical work.
- The threshold of 0.85 is chosen to ensure high precision in allowing RAG answers, minimizing false positives.
- The `relevance_score` question has been removed. The primary decision is based solely on the `is_relevant_topic` noul question.
- This plan assumes the existing fallback mechanism and RAG answer generation remain unchanged; only the scope classification step is replaced.