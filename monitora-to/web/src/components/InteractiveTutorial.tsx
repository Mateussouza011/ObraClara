import { useEffect, useMemo, useState } from 'react';
import './InteractiveTutorial.css';

export interface TutorialStep {
  title: string;
  message: string;
  target?: string;
}

interface InteractiveTutorialProps {
  steps: TutorialStep[];
  storageKey: string;
  restartSignal?: number;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

type TutorialPhase = 'hidden' | 'invite' | 'tour';

const GUIDE_IMAGE_SRC = '/tutorial-guide.png';
const SPOTLIGHT_PADDING = 8;

export function InteractiveTutorial({
  steps,
  storageKey,
  restartSignal = 0,
}: InteractiveTutorialProps) {
  const [phase, setPhase] = useState<TutorialPhase>('hidden');
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const activeStep = phase === 'tour' ? steps[currentStep] : null;
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    if (steps.length === 0) {
      return;
    }

    try {
      const savedChoice = localStorage.getItem(storageKey);
      if (!savedChoice) {
        setPhase('invite');
      }
    } catch {
      setPhase('invite');
    }
  }, [steps.length, storageKey]);

  useEffect(() => {
    if (restartSignal > 0 && steps.length > 0) {
      setCurrentStep(0);
      setPhase('tour');
    }
  }, [restartSignal, steps.length]);

  useEffect(() => {
    if (!activeStep?.target) {
      setTargetRect(null);
      return;
    }

    const target = document.querySelector<HTMLElement>(activeStep.target);
    if (!target) {
      setTargetRect(null);
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

    let animationFrame = 0;

    const updateTargetRect = () => {
      animationFrame = window.requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      });
    };

    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [activeStep]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && phase !== 'hidden') {
        closeTutorial('dismissed');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  const interactiveRect = useMemo(() => {
    if (!targetRect) {
      return null;
    }

    const top = Math.max(0, targetRect.top - SPOTLIGHT_PADDING);
    const left = Math.max(0, targetRect.left - SPOTLIGHT_PADDING);
    const right = Math.min(window.innerWidth, targetRect.left + targetRect.width + SPOTLIGHT_PADDING);
    const bottom = Math.min(window.innerHeight, targetRect.top + targetRect.height + SPOTLIGHT_PADDING);

    return {
      top,
      left,
      right,
      bottom,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    };
  }, [targetRect]);

  if (steps.length === 0 || phase === 'hidden') {
    return null;
  }

  function saveChoice(choice: 'completed' | 'dismissed') {
    try {
      localStorage.setItem(storageKey, choice);
    } catch {
      // The tutorial still works when storage is unavailable.
    }
  }

  function startTutorial() {
    setCurrentStep(0);
    setPhase('tour');
  }

  function closeTutorial(choice: 'completed' | 'dismissed') {
    saveChoice(choice);
    setCurrentStep(0);
    setPhase('hidden');
  }

  function goToNextStep() {
    if (isLastStep) {
      closeTutorial('completed');
      return;
    }

    setCurrentStep((step) => step + 1);
  }

  function goToPreviousStep() {
    setCurrentStep((step) => Math.max(0, step - 1));
  }

  if (phase === 'invite') {
    return (
      <div className="tutorial-overlay" role="presentation">
        <section
          className="tutorial-invite"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-invite-title"
          aria-describedby="tutorial-invite-description"
        >
          <img
            src={GUIDE_IMAGE_SRC}
            className="tutorial-character tutorial-character-large"
            alt="Personagem guia segurando uma lupa e um mapa"
          />
          <div className="tutorial-speech tutorial-speech-invite">
            <span className="tutorial-eyebrow">Guia interativo</span>
            <h2 id="tutorial-invite-title">Quer fazer um mini tutorial?</h2>
            <p id="tutorial-invite-description">
              Oi! Eu posso te mostrar rapidinho como encontrar obras, ajustar filtros e acessar os canais de denúncia.
            </p>
            <div className="tutorial-actions">
              <button
                type="button"
                className="tutorial-button tutorial-button-secondary"
                onClick={() => closeTutorial('dismissed')}
              >
                Agora não
              </button>
              <button
                type="button"
                className="tutorial-button tutorial-button-primary"
                onClick={startTutorial}
              >
                Começar tutorial
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!activeStep) {
    return null;
  }

  return (
    <div className="tutorial-stage" role="presentation">
      <button
        type="button"
        className="tutorial-skip-button"
        onClick={() => closeTutorial('dismissed')}
      >
        Pular
      </button>
      {interactiveRect ? (
        <>
          <div
            className="tutorial-blocker"
            aria-hidden="true"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: interactiveRect.top,
            }}
          />
          <div
            className="tutorial-blocker"
            aria-hidden="true"
            style={{
              top: interactiveRect.top,
              left: interactiveRect.right,
              right: 0,
              height: interactiveRect.height,
            }}
          />
          <div
            className="tutorial-blocker"
            aria-hidden="true"
            style={{
              top: interactiveRect.bottom,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <div
            className="tutorial-blocker"
            aria-hidden="true"
            style={{
              top: interactiveRect.top,
              left: 0,
              width: interactiveRect.left,
              height: interactiveRect.height,
            }}
          />
          <div
            className="tutorial-spotlight"
            style={{
              top: interactiveRect.top,
              left: interactiveRect.left,
              width: interactiveRect.width,
              height: interactiveRect.height,
            }}
          />
        </>
      ) : (
        <div className="tutorial-dim" />
      )}

      <section
        className="tutorial-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-step-title"
        aria-describedby="tutorial-step-message"
      >
        <div className="tutorial-card-body">
          <img
            src={GUIDE_IMAGE_SRC}
            className="tutorial-character"
            alt="Personagem guia segurando uma lupa e um mapa"
          />
          <div className="tutorial-speech">
            <span className="tutorial-eyebrow">
              Passo {currentStep + 1} de {steps.length}
            </span>
            <h2 id="tutorial-step-title">{activeStep.title}</h2>
            <p id="tutorial-step-message">{activeStep.message}</p>
          </div>
        </div>

        <div className="tutorial-progress" aria-hidden="true">
          {steps.map((step, index) => (
            <span
              key={step.title}
              className={index === currentStep ? 'active' : ''}
            />
          ))}
        </div>

        <div className="tutorial-controls">
          <div className="tutorial-controls-main">
            <button
              type="button"
              className="tutorial-button tutorial-button-secondary"
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
            >
              Voltar
            </button>
            <button
              type="button"
              className="tutorial-button tutorial-button-primary"
              onClick={goToNextStep}
            >
              {isLastStep ? 'Concluir' : 'Próximo'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
