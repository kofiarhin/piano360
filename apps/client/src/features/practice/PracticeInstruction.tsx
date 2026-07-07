import type { Exercise, PracticeStep } from "../../content";

type PracticeInstructionProps = {
  exercise: Exercise;
  step: PracticeStep;
  currentStepNumber: number;
};

export const PracticeInstruction = ({ exercise, step, currentStepNumber }: PracticeInstructionProps) => {
  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-ink/10" aria-labelledby="practice-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-clay">{exercise.category}</p>
          <h1 id="practice-title" className="mt-1 text-3xl font-black tracking-tight">
            {exercise.title}
          </h1>
        </div>
        <span className="rounded-full bg-paper px-3 py-1 text-sm font-bold">
          Step {currentStepNumber} of {exercise.steps.length}
        </span>
      </div>
      <div className="mt-5 h-2 rounded-full bg-paper" aria-hidden="true">
        <div
          className="h-2 rounded-full bg-clay"
          style={{ width: `${(currentStepNumber / exercise.steps.length) * 100}%` }}
        />
      </div>
      <p className="mt-5 text-2xl font-black leading-tight">{step.instruction}</p>
      <p className="mt-2 min-h-6 text-ink/70">{step.retryHint}</p>
    </section>
  );
};
