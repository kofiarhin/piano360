import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";

import { exercises } from "../../content";
import { useProgressContext } from "../../app/ProgressProvider";
import { VirtualPiano } from "../piano/VirtualPiano";
import { FingerGuide } from "./FingerGuide";
import { PracticeControls } from "./PracticeControls";
import { PracticeInstruction } from "./PracticeInstruction";
import { PracticeSummary } from "./PracticeSummary";
import { usePracticeSession } from "./usePracticeSession";

export const PracticeRoute = () => {
  const { exerciseId } = useParams();
  const exercise = exercises.find((item) => item.id === exerciseId);

  if (!exercise) {
    return (
      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-ink/10" role="alert">
        <p className="text-sm font-bold uppercase tracking-wide text-clay">Exercise not found</p>
        <h1 className="mt-2 text-3xl font-black">This practice link is not available.</h1>
        <p className="mt-3 text-ink/70">Choose an available lesson or open free practice.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="rounded-md bg-ink px-4 py-2 font-bold text-white" to="/lessons">
            Back to lessons
          </Link>
          <Link className="rounded-md bg-paper px-4 py-2 font-bold text-ink ring-1 ring-ink/10" to="/practice/free">
            Free practice
          </Link>
        </div>
      </section>
    );
  }

  return <LoadedPracticeRoute exercise={exercise} />;
};

const LoadedPracticeRoute = ({ exercise }: { exercise: (typeof exercises)[number] }) => {
  const { markActiveExercise, recordCompletion } = useProgressContext();
  const { session, currentStep, summary, validateManually, restart } = usePracticeSession(exercise);
  const recordedSummaryRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    markActiveExercise(exercise.id);
  }, [exercise.id, markActiveExercise]);

  useEffect(() => {
    if (summary && recordedSummaryRef.current !== summary.completedAt) {
      recordedSummaryRef.current = summary.completedAt;
      recordCompletion(summary);
    }
  }, [recordCompletion, summary]);

  if (!currentStep) {
    return null;
  }

  if (session.status === "completed" && summary) {
    return (
      <div className="space-y-5">
        <VirtualPiano range={exercise.keyboardRange} targetNotes={currentStep.targetNotes} />
        <PracticeSummary summary={summary} />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <PracticeInstruction exercise={exercise} step={currentStep} currentStepNumber={session.currentStepIndex + 1} />
      <VirtualPiano range={exercise.keyboardRange} targetNotes={currentStep.targetNotes} className="order-first md:order-none" />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <FingerGuide step={currentStep} />
        <PracticeControls
          canSkip={currentStep.skippable}
          onCorrect={() => validateManually("correct")}
          onTryAgain={() => validateManually("incorrect")}
          onSkip={() => validateManually("skipped")}
          onRestart={restart}
        />
      </div>
    </div>
  );
};
