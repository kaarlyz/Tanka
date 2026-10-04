export interface DocumentItem {
  id: string;
  title: string;
  content_length?: number;
  created_at: number;
  flashcard_count?: number;
  is_exam_sheet?: boolean;
  question_count?: number;
}

export interface Flashcard {
  id: string;
  doc_id: string;
  front: string;
  back: string;
  level: number;
  due_date: number;
  created_at: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface QuizStep {
  step: string;
  explanation: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  formula?: string;
  steps?: string[] | QuizStep[];
  explanation?: string;
  pitfall?: string;
}

export interface FeynmanResult {
  score: number;
  strengths: string[];
  misconceptions: string[];
  missingConcepts: string[];
  simplifiedAnalogy: string;
  suggestedDrill: string;
}

export interface MistakeItem {
  id: string;
  doc_id: string;
  doc_title: string;
  question: string;
  options: string[];
  correct_index: number;
  user_answer_index: number;
  formula?: string;
  steps?: string[];
  explanation?: string;
  pitfall?: string;
  resolved: number;
  created_at: number;
  updated_at: number;
}

export interface FormulaItem {
  name: string;
  formula: string;
  explanation?: string;
  category?: string;
  meaning?: string;
}

export type ActiveTab =
  | "home"
  | "material"
  | "quiz"
  | "mistakes"
  | "feynman"
  | "flashcards"
  | "summary"
  | "chat";

export interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  base64?: string;
}

export interface EnrichSuggestion {
  title: string;
  description: string;
  recommendedFocus: string;
  reason: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}
