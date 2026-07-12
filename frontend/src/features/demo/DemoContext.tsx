import React, { createContext, useContext, useState, ReactNode } from 'react';

export const DEMO_STEPS = [
  { key: 'register-vehicle', label: 'Register a Vehicle', path: '/fleet' },
  { key: 'register-driver', label: 'Register a Driver', path: '/drivers' },
  { key: 'create-trip', label: 'Create a Trip (cargo within capacity)', path: '/trips' },
  { key: 'dispatch-trip', label: 'Dispatch the Trip', path: '/trips' },
  { key: 'complete-trip', label: 'Complete the Trip', path: '/trips' },
  { key: 'create-maintenance', label: 'Create a Maintenance Log', path: '/maintenance' },
  { key: 'view-reports', label: 'View Updated Reports', path: '/analytics' },
] as const;

export type DemoStepKey = typeof DEMO_STEPS[number]['key'];

interface DemoContextType {
  active: boolean;
  currentStepIndex: number; // -1 when inactive
  completedSteps: DemoStepKey[];
  start: () => void;
  exit: () => void;
  /** Advance only if the completed step is the current expected step (strict sequencing, Req 21.3). */
  completeStep: (key: DemoStepKey) => void;
  isComplete: boolean;
}

const DemoContext = createContext<DemoContextType>({} as DemoContextType);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<DemoStepKey[]>([]);

  const start = () => {
    setActive(true);
    setCurrentStepIndex(0);
    setCompletedSteps([]);
  };

  const exit = () => {
    setActive(false);
    setCurrentStepIndex(-1);
    setCompletedSteps([]);
  };

  const completeStep = (key: DemoStepKey) => {
    if (!active || currentStepIndex < 0) return;
    const expected = DEMO_STEPS[currentStepIndex]?.key;
    // Req 21.3 — only the exact next step in sequence advances the demo; anything else is ignored.
    if (key !== expected) return;

    const next = [...completedSteps, key];
    setCompletedSteps(next);
    if (currentStepIndex + 1 >= DEMO_STEPS.length) {
      setCurrentStepIndex(DEMO_STEPS.length); // past the end = complete
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const isComplete = completedSteps.length === DEMO_STEPS.length;

  return (
    <DemoContext.Provider value={{ active, currentStepIndex, completedSteps, start, exit, completeStep, isComplete }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
