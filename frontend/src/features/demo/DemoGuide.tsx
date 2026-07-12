import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo, DEMO_STEPS } from './DemoContext';
import { CheckCircle2, Circle, X, Sparkles } from 'lucide-react';

/**
 * Floating guided-demo widget (Req 21.2–21.4). Shows the fixed step sequence,
 * highlights the current step, and is driven strictly in order by DemoContext.
 */
export default function DemoGuide() {
  const { active, currentStepIndex, completedSteps, exit, isComplete } = useDemo();
  const navigate = useNavigate();

  if (!active) return null;

  const currentStep = DEMO_STEPS[currentStepIndex];

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-xl border border-accent-primary/30 bg-[#12151c] shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-accent-primary/10">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles size={14} className="text-accent-primary" /> Guided Demo
        </div>
        <button onClick={exit} className="text-text-muted hover:text-white" title="Exit demo">
          <X size={14} />
        </button>
      </div>
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
        {isComplete ? (
          <div className="text-center py-4">
            <CheckCircle2 className="text-status-available mx-auto mb-2" size={28} />
            <div className="text-sm font-semibold text-white">Demo complete!</div>
            <div className="text-[0.75rem] text-text-muted mt-1">You completed every step in sequence.</div>
          </div>
        ) : (
          DEMO_STEPS.map((step, i) => {
            const done = completedSteps.includes(step.key);
            const isCurrent = i === currentStepIndex;
            return (
              <button
                key={step.key}
                onClick={() => isCurrent && navigate(step.path)}
                className={`w-full flex items-center gap-2 text-left rounded-lg px-2 py-1.5 transition-colors ${
                  isCurrent ? 'bg-accent-primary/10' : ''
                }`}
              >
                {done ? (
                  <CheckCircle2 size={16} className="text-status-available shrink-0" />
                ) : (
                  <Circle size={16} className={`shrink-0 ${isCurrent ? 'text-accent-primary' : 'text-text-muted'}`} />
                )}
                <span className={`text-[0.8rem] ${done ? 'text-text-muted line-through' : isCurrent ? 'text-white font-medium' : 'text-text-muted'}`}>
                  {step.label}
                </span>
              </button>
            );
          })
        )}
      </div>
      {!isComplete && currentStep && (
        <div className="px-4 py-2 border-t border-white/5 text-[0.7rem] text-text-muted">
          Next: navigate to <span className="text-white">{currentStep.label}</span>
        </div>
      )}
    </div>
  );
}
