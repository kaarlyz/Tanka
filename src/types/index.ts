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
  difficulty?: "new" | "again" | "hard" | "good" | "easy" | string;
  review_count?: number;
  level?: number;
  due_date?: number;
  created_at?: number;
}

export interface ChatAttachment {
  name: string;
  type: "image" | "document";
  url?: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  attachment?: ChatAttachment;
}

export interface QuizStep {
  step?: string | number;
  title?: string;
  desc?: string;
  explanation?: string;
  formula?: string;
}

export interface QuizQuestion {
  id?: number | string;
  question: string;
  options: string[];
  correctIndex: number;
  correct_index?: number;
  formula?: string;
  steps?: Array<string | QuizStep>;
  explanation?: string;
  pitfall?: string;
}

export interface FeynmanResult {
  score: number;
  verdict?: string;
  accuratePoints?: string[];
  missedOrFlawedPoints?: string[];
  perfectAnalogy?: string;
  feedback?: string;
  strengths?: string[];
  misconceptions?: string[];
  missingConcepts?: string[];
  simplifiedAnalogy?: string;
  suggestedDrill?: string;
}

export interface MistakeItem {
  id: string;
  doc_id?: string;
  docId?: string;
  doc_title?: string;
  docTitle?: string;
  question: string;
  options: string[];
  correct_index?: number;
  correctIndex?: number;
  user_answer_index?: number;
  userAnswerIndex?: number;
  formula?: string;
  steps?: Array<string | QuizStep>;
  explanation?: string;
  concept?: string;
  pitfall?: string;
  resolved: number;
  created_at?: number;
  createdAt?: number;
  updated_at?: number;
  updatedAt?: number;
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
  ext?: string;
  type?: string;
  previewUrl?: string;
  base64?: string;
}

export interface EnrichSuggestion {
  title: string;
  description?: string;
  recommendedFocus?: string;
  focus?: string;
  reason: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface TopicClarificationData {
  subject: string;
  formalTitle: string;
  questions: { id: string; question: string; choices: string[] }[];
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
}
