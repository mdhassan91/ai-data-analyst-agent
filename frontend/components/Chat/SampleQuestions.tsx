const SAMPLE_QUESTIONS = [
  "What's the total revenue from delivered orders?",
  "Top 5 product categories by order count",
  "Which state has the most customers?",
  "Average review score by month",
];

export function SampleQuestions({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 px-2">
      {SAMPLE_QUESTIONS.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="rounded-pill border border-base-border bg-base-input px-4 py-2 text-xs text-white/70 transition-colors hover:border-accent-tealTo/60 hover:text-white"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
