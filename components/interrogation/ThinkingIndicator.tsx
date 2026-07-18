//created by kinjal
'use client'

// Three dots that pulse in sequence while a suspect's answer is being
// generated — stands in for the dialogue box until the real text arrives, so
// the transcript never looks frozen mid-question.
export function ThinkingIndicator() {
  return (
    <div className="thinking-indicator" data-testid="thinking-indicator" aria-live="polite">
      <span className="thinking-indicator__label">considering</span>
      <span className="thinking-indicator__dots" aria-hidden="true">
        <span className="thinking-indicator__dot" />
        <span className="thinking-indicator__dot" />
        <span className="thinking-indicator__dot" />
      </span>
    </div>
  )
}
