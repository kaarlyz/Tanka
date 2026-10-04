export type ActiveTab = "material" | "quiz" | "feynman" | "flashcards" | "summary" | "mistakes" | "cheatsheet";

export interface DocumentItem {
  id: string;
  title: string;
  created_at: number;
  preview?: string;
  content?: string;
  summary?: string;
}

export interface FlashcardItem {
  id: string;
  doc_id: string;
  front: string;
  back: string;
  difficulty: "new" | "again" | "hard" | "good" | "easy";
  review_count?: number;
}

export interface QuizStep {
  step: number;
  title: string;
  desc: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  formula?: string;
  steps?: QuizStep[];
  explanation?: string;
  pitfall?: string;
}

export interface MistakeItem {
  id: string;
  docId: string;
  docTitle?: string;
  question: string;
  options: string[];
  correctIndex: number;
  userAnswerIndex: number;
  formula?: string;
  steps?: QuizStep[];
  explanation?: string;
  pitfall?: string;
  resolved?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface FeynmanEvaluation {
  score: number;
  verdict: string;
  accuratePoints: string[];
  missedOrFlawedPoints: string[];
  perfectAnalogy: string;
  feedback: string;
}

export interface CheatsheetItem {
  name: string;
  formula: string;
  meaning: string;
  category?: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  created_at?: number;
}

export interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  ext: string;
  previewUrl?: string;
}

export interface EnrichSuggestion {
  title: string;
  focus: string;
  reason: string;
}
