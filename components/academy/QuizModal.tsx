'use client';

/**
 * QuizModal — full-screen quiz overlay.
 *
 * State machine:
 *   intro → question → answered → (next question | complete)
 *
 * Stardust is awarded server-side; this component only displays what the
 * API returns. Correct answers are available client-side for immediate
 * per-question feedback.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getLessonContent } from '@/lib/academy/content';
import type { LessonWithProgress } from '@/app/api/academy/lessons/route';

interface QuizResult {
  score:          number;
  total:          number;
  passed:         boolean;
  stardustEarned: number;
  results:        { correct: boolean; correctIndex: number; explanation: string }[];
}

interface QuizModalProps {
  lesson:  LessonWithProgress;
  onClose: (didComplete: boolean) => void;
}

type Phase = 'intro' | 'question' | 'answered' | 'submitting' | 'complete';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function QuizModal({ lesson, onClose }: QuizModalProps) {
  const content = getLessonContent(lesson.slug)!;
  const { questions } = content;

  const [phase,       setPhase]    = useState<Phase>('intro');
  const [currentQ,    setCurrentQ] = useState(0);
  const [selected,    setSelected] = useState<number | null>(null);
  const [answers,     setAnswers]  = useState<number[]>([]);
  const [result,      setResult]   = useState<QuizResult | null>(null);
  const [error,       setError]    = useState('');

  const question = questions[currentQ];
  const isLast   = currentQ === questions.length - 1;

  async function submitAnswers(finalAnswers: number[]) {
    setPhase('submitting');
    try {
      const res = await fetch('/api/academy/quiz', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ lessonId: lesson.id, answers: finalAnswers }),
      });
      const data = await res.json() as QuizResult;
      setResult(data);
      setPhase('complete');
    } catch {
      setError('Failed to submit — please try again.');
      setPhase('answered');
    }
  }

  function handleAnswer(idx: number) {
    if (phase !== 'question') return;
    setSelected(idx);
    setPhase('answered');
  }

  function handleNext() {
    const updated = [...answers, selected!];
    setAnswers(updated);

    if (isLast) {
      void submitAnswers(updated);
    } else {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setPhase('question');
    }
  }

  const isCorrect = selected !== null && selected === question?.correctIndex;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a14]">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <span className="text-xl">{lesson.emoji}</span>
          <div>
            <p className="text-white font-medium text-sm">{lesson.title}</p>
            <p className="text-white/35 text-xs">✦ {lesson.stardustReward} Stardust</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onClose(result?.passed ?? false)}
          className="text-white/30 hover:text-white/60 transition-colors text-lg px-2"
          aria-label="Close quiz"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ── Intro ──────────────────────────────────────────────────────── */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex flex-col items-center text-center gap-6 pt-8"
            >
              <span className="text-6xl">{lesson.emoji}</span>
              <div className="space-y-2">
                <h2 className="text-white text-2xl font-bold">{lesson.title}</h2>
                <p className="text-white/50 text-sm max-w-xs mx-auto leading-relaxed">{lesson.description}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/40">
                <span>{questions.length} questions</span>
                <span>·</span>
                <span>Pass 4 of 5 to earn</span>
                <span>·</span>
                <span className="text-amber-400">✦ {lesson.stardustReward}</span>
              </div>
              <button
                type="button"
                onClick={() => setPhase('question')}
                className="px-8 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors mt-2"
              >
                Start Quiz →
              </button>
            </motion.div>
          )}

          {/* ── Question ───────────────────────────────────────────────────── */}
          {(phase === 'question' || phase === 'answered') && (
            <motion.div
              key={`q-${currentQ}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/30">
                  <span>Question {currentQ + 1} of {questions.length}</span>
                  <span>{answers.length} answered</span>
                </div>
                <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/40 transition-all duration-300"
                    style={{ width: `${((currentQ) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question text */}
              <h3 className="text-white text-lg font-medium leading-snug">
                {question.question}
              </h3>

              {/* Options */}
              <ul className="space-y-3">
                {question.options.map((option, idx) => {
                  let style = 'border-white/12 bg-white/4 text-white/70 hover:border-white/25 hover:bg-white/8';

                  if (phase === 'answered') {
                    if (idx === question.correctIndex) {
                      style = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';
                    } else if (idx === selected && idx !== question.correctIndex) {
                      style = 'border-red-500/40 bg-red-500/8 text-red-400';
                    } else {
                      style = 'border-white/6 bg-white/2 text-white/30';
                    }
                  }

                  return (
                    <li key={idx}>
                      <button
                        type="button"
                        disabled={phase === 'answered'}
                        onClick={() => handleAnswer(idx)}
                        className={`
                          w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left
                          transition-all duration-150 disabled:cursor-default
                          ${style}
                        `}
                      >
                        <span className="font-mono text-xs w-5 shrink-0 opacity-50">
                          {OPTION_LABELS[idx]}
                        </span>
                        <span className="text-sm">{option}</span>

                        {/* Tick / cross icons */}
                        {phase === 'answered' && idx === question.correctIndex && (
                          <span className="ml-auto text-emerald-400">✓</span>
                        )}
                        {phase === 'answered' && idx === selected && idx !== question.correctIndex && (
                          <span className="ml-auto text-red-400">✗</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Explanation + Next */}
              {phase === 'answered' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed border ${
                    isCorrect
                      ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300/90'
                      : 'bg-amber-500/8 border-amber-500/20 text-amber-300/90'
                  }`}>
                    <span className="font-medium">{isCorrect ? '✓ Correct! ' : '✗ Not quite. '}</span>
                    {question.explanation}
                  </div>

                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
                  >
                    {isLast ? 'See Results →' : 'Next Question →'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Submitting ─────────────────────────────────────────────────── */}
          {phase === 'submitting' && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 pt-20"
            >
              <span className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white/40 text-sm">Calculating your score…</p>
            </motion.div>
          )}

          {/* ── Complete ───────────────────────────────────────────────────── */}
          {phase === 'complete' && result && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center gap-6 pt-8"
            >
              {/* Score ring */}
              <div className={`
                w-24 h-24 rounded-full border-4 flex items-center justify-center
                ${result.passed ? 'border-emerald-400 text-emerald-300' : 'border-amber-400 text-amber-300'}
              `}>
                <div>
                  <p className="text-3xl font-bold">{result.score}</p>
                  <p className="text-xs opacity-60">/ {result.total}</p>
                </div>
              </div>

              {result.passed ? (
                <>
                  <div className="space-y-1">
                    <h2 className="text-white text-2xl font-bold">
                      {result.score === result.total ? 'Perfect! ✦' : 'Well done!'}
                    </h2>
                    <p className="text-white/50 text-sm">You passed with {result.score}/{result.total} correct.</p>
                  </div>
                  {result.stardustEarned > 0 && (
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1,   opacity: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400/15 border border-amber-400/25"
                    >
                      <span className="text-2xl">✦</span>
                      <div className="text-left">
                        <p className="text-amber-300 text-xl font-bold">+{result.stardustEarned}</p>
                        <p className="text-amber-400/60 text-xs">Stardust earned</p>
                      </div>
                    </motion.div>
                  )}
                  {result.stardustEarned === 0 && (
                    <p className="text-white/30 text-sm">You already earned Stardust for this lesson.</p>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <h2 className="text-white text-2xl font-bold">Almost there!</h2>
                    <p className="text-white/50 text-sm">
                      You got {result.score}/{result.total}. Need {4 - result.score} more to pass.
                    </p>
                  </div>
                  <p className="text-white/30 text-sm max-w-xs">
                    Review the explanations and try again — no Stardust until you hit 4/5.
                  </p>
                </>
              )}

              {/* Per-question breakdown */}
              <div className="w-full space-y-2 pt-2">
                <p className="text-white/25 text-xs uppercase tracking-widest text-left">Breakdown</p>
                {result.results.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${r.correct ? 'text-emerald-400/70' : 'text-red-400/60'}`}>
                    <span>{r.correct ? '✓' : '✗'}</span>
                    <span className="text-white/40">Q{i + 1}</span>
                    {!r.correct && (
                      <span className="text-white/30 text-xs">
                        Correct: {questions[i].options[r.correctIndex]}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onClose(result.passed)}
                className="w-full py-3 rounded-xl border border-white/15 text-white/60 font-medium text-sm hover:border-white/30 hover:text-white/90 transition-colors"
              >
                ← Back to CosmoAcademy
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
