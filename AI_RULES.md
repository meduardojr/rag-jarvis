# AI Development Rules

This document outlines the technology stack and specific library usage guidelines for this Next.js application. Adhering to these rules will help maintain consistency, improve collaboration, and ensure the AI assistant can effectively understand and modify the codebase.

## Tech Stack Overview

The application is built using the following core technologies:

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **UI Components**: Shadcn/UI - A collection of re-usable UI components built with Radix UI and Tailwind CSS.
*   **Styling**: Tailwind CSS - A utility-first CSS framework for rapid UI development.
*   **Icons**: Lucide React - A comprehensive library of simply beautiful SVG icons.
*   **Forms**: React Hook Form for managing form state and validation, typically with Zod for schema validation.
*   **State Management**: Primarily React Context API and built-in React hooks (`useState`, `useReducer`).
*   **Notifications/Toasts**: Sonner for displaying non-intrusive notifications.
*   **Charts**: Recharts for data visualization.
*   **Animation**: `tailwindcss-animate` and animation capabilities built into Radix UI components.

## Library Usage Guidelines

To ensure consistency and leverage the chosen stack effectively, please follow these rules:

1.  **UI Components**:
    *   **Primary Choice**: Always prioritize using components from the `src/components/ui/` directory (Shadcn/UI components).
    *   **Custom Components**: If a required component is not available in Shadcn/UI, create a new component in `src/components/` following Shadcn/UI's composition patterns (i.e., building on Radix UI primitives and styled with Tailwind CSS).
    *   **Avoid**: Introducing new, third-party UI component libraries without discussion.

2.  **Styling**:
    *   **Primary Choice**: Exclusively use Tailwind CSS utility classes for all styling.
    *   **Global Styles**: Reserve `src/app/globals.css` for base Tailwind directives, global CSS variable definitions, and minimal base styling. Avoid adding component-specific styles here.
    *   **CSS-in-JS**: Do not use CSS-in-JS libraries (e.g., Styled Components, Emotion).

3.  **Icons**:
    *   **Primary Choice**: Use icons from the `lucide-react` library.

4.  **Forms**:
    *   **Management**: Use `react-hook-form` for all form logic (state, validation, submission).
    *   **Validation**: Use `zod` for schema-based validation with `react-hook-form` via `@hookform/resolvers`.

5.  **State Management**:
    *   **Local State**: Use React's `useState` and `useReducer` hooks for component-level state.
    *   **Shared/Global State**: For state shared between multiple components, prefer React Context API.
    *   **Complex Global State**: If application state becomes significantly complex, discuss the potential introduction of a dedicated state management library (e.g., Zustand, Jotai) before implementing.

6.  **Routing**:
    *   Utilize the Next.js App Router (file-system based routing in the `src/app/` directory).

7.  **API Calls & Data Fetching**:
    *   **Client-Side**: Use the native `fetch` API or a simple wrapper around it.
    *   **Server-Side (Next.js)**: Leverage Next.js Route Handlers (in `src/app/api/`) or Server Actions for server-side logic and data fetching.

8.  **Animations**:
    *   Use `tailwindcss-animate` plugin and the animation utilities provided by Radix UI components.

9.  **Notifications/Toasts**:
    *   Use the `Sonner` component (from `src/components/ui/sonner.tsx`) for all toast notifications.

10. **Charts & Data Visualization**:
    *   Use `recharts` and its associated components (e.g., `src/components/ui/chart.tsx`) for displaying charts.

11. **Utility Functions**:
    *   General-purpose helper functions should be placed in `src/lib/utils.ts`.
    *   Ensure functions are well-typed and serve a clear, reusable purpose.

12. **Custom Hooks**:
    *   Custom React hooks should be placed in the `src/hooks/` directory (e.g., `src/hooks/use-mobile.tsx`).

13. **TypeScript**:
    *   Write all new code in TypeScript.
    *   Strive for strong typing and leverage TypeScript's features to improve code quality and maintainability. Avoid using `any` where possible.

## Code-Editing Discipline

1. **Minimal changes only**: Never rewrite an entire file when a targeted edit (search-and-replace, adding a few lines) will do. Full-file rewrites are the last resort, not the default.
2. **Read before writing**: Before editing any existing file, read its current actual content — do not assume or reconstruct what it contains from memory or a prior version of the conversation.
3. **Scope containment**: Only modify files and sections directly relevant to the current request. Do not refactor, "clean up," or touch unrelated code, even if it looks improvable.
4. **Database safety**: Never drop, rename, or alter existing tables/columns without explicit instruction. New columns must be nullable or have a default. Always show the exact SQL before running it.
5. **State isolation**: Each component/section that fetches its own data must manage its own loading and error state independently. Do not introduce shared/global loading or error state that affects multiple unrelated sections.
6. **Confirm before destructive actions**: Any action that deletes data, removes a file, or could break existing functionality requires explicit confirmation in the response before or as part of execution — clearly flag what could break.

## Component Size & Readability

1. **Extract sub-components, don't nest deeply.** If a component's JSX has more than ~3-4 levels of nested indentation, or the file is pushing past ~200-250 lines, break out logical chunks into their own sub-components (e.g. `KnowledgeEntryCard`, `TagList`, `ModelSelector`) rather than growing one file into an unreadable wall of tags and props.
2. **No 500-line files as a default.** A single component file should not be allowed to grow to 500+ lines. If a feature naturally requires that much logic/markup, split it into a parent component plus multiple focused sub-components, each in its own file, composed together.
3. **When splitting hurts performance, comment instead of skip.** If breaking something into a sub-component would meaningfully hurt loading/rendering performance (e.g. unnecessary re-renders, prop-drilling overhead, or genuinely tight coupling that can't be cleanly separated), it's acceptable to keep it as one file — but in that case, add a clear comment above each major section explaining what that section does, so the file is still scannable without needing sub-components. State explicitly in your response why you chose not to split it in this case.
4. **Prefer flat, readable JSX over deep nesting.** Extract repeated or deeply nested markup into named sub-components even if they're small and only used once — clarity takes priority over minimizing file count.
5. **Every new sub-component gets a one-line comment at the top** describing its purpose, so its role is obvious without reading its full implementation.

By following these guidelines, we can build a more robust, maintainable, and consistent application.
