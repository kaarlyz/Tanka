import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { ActiveTab, QuizQuestion } from "./types";
import { normalizeDiagramsInMarkdown } from "./components/common/DiagramRenderer";

// Layout & Modals
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { TanyaNaraPanel } from "./components/modals/TanyaNaraPanel";
import { FormulaDrawer } from "./components/modals/FormulaDrawer";
import { TopicModal } from "./components/modals/TopicModal";
import { EnrichModal } from "./components/modals/EnrichModal";
import { StagingUploadModal } from "./components/modals/StagingUploadModal";
import { YouTubeModal } from "./components/modals/YouTubeModal";
import { TimerAlarmModal } from "./components/modals/TimerAlarmModal";

// Tabs
import { HomeHubTab } from "./components/tabs/HomeHubTab";
import { MaterialTab } from "./components/tabs/MaterialTab";
import { QuizTab } from "./components/tabs/QuizTab";
import { MistakesTab } from "./components/tabs/MistakesTab";
import { FeynmanTab } from "./components/tabs/FeynmanTab";
import { FlashcardsTab } from "./components/tabs/FlashcardsTab";
import { SummaryTab } from "./components/tabs/SummaryTab";
import { ChatTab } from "./components/tabs/ChatTab";

// Domain Hooks
import { useAppRoute } from "./hooks/useAppRoute";
import { useAuth } from "./hooks/useAuth";
import { AuthModal } from "./components/modals/AuthModal";
import { ProfileModal } from "./components/modals/ProfileModal";
import { RoomModal } from "./components/modals/RoomModal";
import { useDocuments } from "./hooks/useDocuments";
import { useQuiz } from "./hooks/useQuiz";
import { useMistakes } from "./hooks/useMistakes";
import { useStudyTimer } from "./hooks/useStudyTimer";
import { useAudioSpeech } from "./hooks/useAudioSpeech";
import { useClipboardAndDownload } from "./hooks/useClipboardAndDownload";
import { useChat } from "./hooks/useChat";
import { useFormulas } from "./hooks/useFormulas";
import { useTopicGenerator } from "./hooks/useTopicGenerator";
import { useDocumentEnrich } from "./hooks/useDocumentEnrich";
import { useYouTubeModal } from "./hooks/useYouTubeModal";
import { useUploadStaging } from "./hooks/useUploadStaging";
import { useFlashcards } from "./hooks/useFlashcards";
import { useFeynman } from "./hooks/useFeynman";
import { useSummary } from "./hooks/useSummary";

export default function App() {
  // 1. Toast Notification
  const [statusNotice, setStatusNotice] = useState("");
  const showNotice = useCallback((text: string) => {
    setStatusNotice(text);
    setTimeout(() => setStatusNotice(""), 3500);
  }, []);

  // 2. Clean URL Routing (Native Path Routing, Zero Hash)
  const { activeTab, setActiveTab } = useAppRoute("home");

  // 2.5 User Account Authentication
  const {
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    authUsername,
    setAuthUsername,
    authPassword,
    setAuthPassword,
    authName,
    setAuthName,
    isAuthLoading,
    authError,
    setAuthError,
    handleRegister,
    handleLogin,
    handleLogout,
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileModalTab,
    setProfileModalTab,
    updateProfile,
    quickRegisterGuest,
    recordActivity
  } = useAuth(showNotice);

  // 2.6 Multiplayer Room Modal
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [activeRoomSession, setActiveRoomSession] = useState<{ roomId: string; title: string; quizCount: number } | null>(null);
  const [roomModalInitialView, setRoomModalInitialView] = useState<"hub" | "lobby" | "playing" | "result">("hub");
  const [roomModalRoomId, setRoomModalRoomId] = useState<string | null>(null);

  // Auto-detect ?room= or ?join= in URL for shared links
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get("room") || urlParams.get("join");
      if (roomParam) {
        const cleanCode = roomParam.trim().toUpperCase();
        setRoomModalRoomId(cleanCode);
        setRoomModalInitialView("lobby");
        setIsRoomModalOpen(true);
        showNotice(`Tautan undangan room ${cleanCode} terdeteksi!`);
      }
    } catch (e) {
      console.warn("Parse room URL param error:", e);
    }
  }, [showNotice]);

  // 3. UI State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const [homeSubjectFilter, setHomeSubjectFilter] = useState("Semua");
  const [materialCreationTab, setMaterialCreationTab] = useState<"upload" | "topic" | "manual">("upload");
  const [quizType, setQuizType] = useState<any>("beginner");

  // 4. File and Camera Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 5. Domain Hook: Documents
  const {
    documents,
    activeDocId,
    setActiveDocId,
    activeDocTitle,
    setActiveDocTitle,
    activeDocContent,
    setActiveDocContent,
    activeDocSummary,
    setActiveDocSummary,
    models,
    selectedModel,
    setSelectedModel,
    isDetectingTitle,
    fetchDocuments,
    loadDocument,
    handleDeleteDocument,
    handleDeleteAllDocuments,
    docSearchQuery,
    setDocSearchQuery,
    handleSaveDocument: baseSaveDocument,
    handleAutoDetectTitle
  } = useDocuments({
    showNotice,
    setActiveTab,
    onDocumentLoaded: () => setShowRawText(false)
  });

  // 6. Domain Hook: Mistakes Bank
  const {
    mistakes,
    setMistakes,
    isDrillingMistakes,
    setIsDrillingMistakes,
    mistakeFilterScope,
    setMistakeFilterScope,
    activeDocMistakes,
    displayedMistakes,
    recordMistake,
    resolveMistake,
    deleteMistake,
    handleClearMistakes
  } = useMistakes({ activeDocId, activeDocTitle, showNotice, currentUser });

  // Callback when exam finishes (submits score to active multiplayer room if any)
  const handleRoomExamComplete = useCallback(async (result: { finalScore: number; correctCount: number; totalQuestions: number }) => {
    const effectiveUser = currentUser || (() => {
      try {
        const raw = localStorage.getItem("tanka_user_account");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    if (activeRoomSession && effectiveUser) {
      try {
        const res = await fetch(`/api/rooms/${activeRoomSession.roomId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: effectiveUser.id,
            score: result.finalScore,
            correctAnswers: result.correctCount,
            totalAnswered: result.totalQuestions
          })
        });
        if (res.ok) {
          setRoomModalInitialView("result");
          setRoomModalRoomId(activeRoomSession.roomId);
          setIsRoomModalOpen(true);
          showNotice(`Skor ${result.finalScore} terkirim ke Room ${activeRoomSession.roomId}! Peringkat diperbarui.`);
        }
      } catch (err) {
        console.error("Submit room score failed:", err);
      }
    }
  }, [activeRoomSession, currentUser, showNotice]);

  // 7. Domain Hook: Quiz & Interactive Drills
  const {
    quizQuestions,
    setQuizQuestions,
    quizQuestionCount,
    setQuizQuestionCount,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    selectedOption,
    setSelectedOption,
    isAnswerSubmitted,
    setIsAnswerSubmitted,
    score,
    setScore,
    userAnswers,
    setUserAnswers,
    isQuizCompleted,
    setIsQuizCompleted,
    isGeneratingQuiz,
    solutionStep,
    setSolutionStep,
    quizMode,
    setQuizMode,
    examTimeLeft,
    setExamTimeLeft,
    isExamTimerRunning,
    setIsExamTimerRunning,
    examFlagged,
    examSubmitted,
    setExamSubmitted,
    examDurationSeconds,
    setExamDurationSeconds,
    isQuizChatOpen,
    setIsQuizChatOpen,
    quizChatMessages,
    quizChatInput,
    setQuizChatInput,
    isQuizChatSending,
    handleSendQuizQuestionChat,
    handleGenerateQuiz,
    handleSelectQuizOption,
    handlePrevQuizQuestion,
    handleNextQuizQuestion,
    toggleFlagQuestion,
    handleExamSubmit,
    resetQuizState
  } = useQuiz({
    activeDocId,
    selectedModel,
    quizType,
    showNotice,
    recordMistake,
    activeDocContent,
    onExamComplete: handleRoomExamComplete
  });

  // Handler to launch multiplayer challenge directly into Quiz / Tryout tab
  const handleStartRoomExam = useCallback((room: any, questions: any[]) => {
    const formatted: QuizQuestion[] = (questions || []).map((q: any, idx: number) => {
      let correctIdx = 0;
      if (typeof q.correctIndex === "number") correctIdx = q.correctIndex;
      else if (typeof q.correct_index === "number") correctIdx = q.correct_index;
      else if (typeof q.answer === "string" && ["A", "B", "C", "D", "E"].includes(q.answer.trim().toUpperCase())) {
        correctIdx = ["A", "B", "C", "D", "E"].indexOf(q.answer.trim().toUpperCase());
      }
      return {
        id: q.id || idx + 1,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correctIndex: correctIdx,
        correct_index: correctIdx,
        explanation: q.explanation || ""
      };
    });

    setQuizQuestions(formatted);
    setQuizQuestionCount(formatted.length);
    setQuizMode("exam");
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setIsQuizCompleted(false);
    setExamSubmitted(false);
    const durationSec = Math.max(180, formatted.length * 60);
    setExamDurationSeconds(durationSec);
    setExamTimeLeft(durationSec);
    setIsExamTimerRunning(true);
    setActiveRoomSession({ roomId: room.id, title: room.title, quizCount: formatted.length });
    setActiveTab("quiz");
    setIsRoomModalOpen(false);
    showNotice(`⚔️ Room ${room.id} dimulai! Tryout serentak ${formatted.length} soal berjalan.`);
  }, [setQuizQuestions, setQuizQuestionCount, setQuizMode, setCurrentQuestionIndex, setUserAnswers, setSelectedOption, setIsAnswerSubmitted, setIsQuizCompleted, setExamSubmitted, setExamDurationSeconds, setExamTimeLeft, setIsExamTimerRunning, setActiveTab, showNotice]);

  // Handler to close multiplayer room modal and cleanly reset session & URL params
  const handleCloseRoomModal = useCallback(() => {
    setIsRoomModalOpen(false);
    setRoomModalRoomId(null);
    setRoomModalInitialView("hub");
    try {
      if (window.location.search.includes("room=") || window.location.search.includes("join=")) {
        const url = new URL(window.location.href);
        url.searchParams.delete("room");
        url.searchParams.delete("join");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    } catch {}
  }, []);

  // Handler to open multiplayer room directly to Hub (create or join new room)
  const handleOpenRoomHub = useCallback(() => {
    setRoomModalRoomId(null);
    setRoomModalInitialView("hub");
    setIsRoomModalOpen(true);
  }, []);

  // 8. Domain Hook: Flashcards
  const {
    flashcards,
    setFlashcards,
    currentCardIndex,
    setCurrentCardIndex,
    isFlipped,
    setIsFlipped,
    isGeneratingCards,
    handleGenerateFlashcards,
    handleReviewCard
  } = useFlashcards({ activeDocId, selectedModel, showNotice });

  // 9. Domain Hook: Feynman Technique
  const {
    feynmanTopic,
    setFeynmanTopic,
    feynmanExplanation,
    setFeynmanExplanation,
    isEvaluatingFeynman,
    feynmanResult,
    isRecordingFeynman,
    isTranscribing,
    feynmanRecordingSeconds,
    handleEvaluateFeynman,
    handleToggleFeynmanRecording
  } = useFeynman({ activeDocTitle, selectedModel, showNotice });

  // 10. Domain Hook: AI Summary
  const {
    isGeneratingSummary,
    summaryStyle,
    setSummaryStyle,
    handleGenerateSummary
  } = useSummary({ activeDocId, selectedModel, setActiveDocSummary, showNotice });

  // 11. Domain Hook: Formulas Cheatsheet
  const {
    isFormulaDrawerOpen,
    setIsFormulaDrawerOpen,
    formulas,
    setFormulas,
    isLoadingFormulas,
    setIsLoadingFormulas,
    formulaFilter,
    setFormulaFilter,
    fetchOrExtractFormulas
  } = useFormulas({ activeDocId, selectedModel, showNotice }) as any;

  // 12. Domain Hook: Topic Generator Modal
  const {
    isTopicModalOpen,
    setIsTopicModalOpen,
    topicInput,
    setTopicInput,
    topicStep,
    setTopicStep,
    topicClarificationData,
    topicAnswers,
    setTopicAnswers,
    isClarifyingTopic,
    isGeneratingTopic,
    handleStartTopicClarify,
    handleGenerateTopicDocument
  } = useTopicGenerator({
    selectedModel,
    fetchDocuments,
    loadDocument,
    setActiveTab,
    showNotice
  });

  // 13. Domain Hook: Document Enrichment
  const {
    isEnriching,
    isEnrichModalOpen,
    setIsEnrichModalOpen,
    enrichFocus,
    setEnrichFocus,
    enrichSuggestions,
    isLoadingSuggestions,
    selectedEnrichTitles,
    setSelectedEnrichTitles,
    handleEnrichDocument
  } = useDocumentEnrich({
    activeDocId,
    activeDocTitle,
    activeDocContent,
    selectedModel,
    setActiveDocContent,
    fetchDocuments,
    showNotice
  });

  // 14. Domain Hook: WhatsApp/Telegram-style Upload & Staging Tray
  const {
    stagedFiles,
    isStagingModalOpen,
    setIsStagingModalOpen,
    stagedDocTitle,
    setStagedDocTitle,
    stagedGoal,
    setStagedGoal,
    stagedCustomInstruction,
    setStagedCustomInstruction,
    isUploading,
    uploadError,
    isDragging,
    setIsDragging,
    handleStageFiles,
    handleRemoveStagedFile,
    handleCancelStaging,
    handleConfirmStagedUpload
  } = useUploadStaging({
    selectedModel,
    fetchDocuments,
    loadDocument,
    setActiveTab,
    setQuizQuestions,
    setCurrentQuestionIndex,
    setUserAnswers,
    setExamSubmitted,
    showNotice
  });

  // 14b. Domain Hook: YouTube Video Material Ingestion
  const {
    isYouTubeModalOpen,
    setIsYouTubeModalOpen,
    ytUrl,
    setYtUrl,
    ytGoal,
    setYtGoal,
    ytInstruction,
    setYtInstruction,
    isCheckingUrl,
    isGeneratingYt,
    ytInfo,
    ytError,
    setYtError,
    handleCheckUrl,
    handleGenerateDocument: handleGenerateYtDocument,
    handleReset: handleResetYt
  } = useYouTubeModal({
    selectedModel,
    fetchDocuments,
    loadDocument,
    setActiveTab,
    showNotice
  });

  // 15. Domain Hook: Chat Tutor (Tanya Nara)
  const {
    messages,
    setMessages,
    chatInput,
    setChatInput,
    isChatSending,
    chatEndRef,
    stagedAttachment,
    handleAttachFile,
    handleClearAttachment,
    handleSendMessage,
    handleClearChat,
    isFreeMode,
    setIsFreeMode,
    effectiveDocId
  } = useChat({ activeDocId, selectedModel, showNotice, currentUser });

  // 16. Domain Hook: Study Timer & Pomodoro
  const {
    timerDurationMinutes,
    setTimerDurationMinutes,
    timerSeconds,
    setTimerSeconds,
    timerMode,
    setTimerMode,
    isTimerRunning,
    setIsTimerRunning,
    completedSessions,
    isTimerSettingsOpen,
    setIsTimerSettingsOpen,
    isAlarmActive,
    setIsAlarmActive,
    customMinutesInput,
    setCustomMinutesInput,
    applyTimerDuration
  } = useStudyTimer(showNotice);

  // Auto record activity on quiz completion
  useEffect(() => {
    if (isQuizCompleted && quizQuestions.length > 0) {
      let correct = 0;
      quizQuestions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correctIndex) correct++;
      });
      recordActivity({
        activityType: "quiz",
        quizScore: score,
        correctAnswers: correct,
        docId: activeDocId || "global"
      });
    }
  }, [isQuizCompleted]);

  // Auto record study activity on pomodoro timer completion
  useEffect(() => {
    if (isAlarmActive && timerMode === "focus") {
      recordActivity({
        activityType: "pomodoro",
        minutes: timerDurationMinutes,
        docId: activeDocId || "global"
      });
    }
  }, [isAlarmActive]);

  // 17. Domain Hook: Speech Audio & Clipboard
  const { isSpeaking, toggleSpeech } = useAudioSpeech(showNotice);
  const { copiedId, copyToClipboard, downloadAsMarkdown } = useClipboardAndDownload(showNotice);

  // Handlers for App Navigation & Saving
  const handleCreateNewDoc = useCallback(() => {
    setActiveDocId(null);
    setActiveDocTitle("");
    setActiveDocContent("");
    setActiveDocSummary("");
    setFlashcards([]);
    setQuizQuestions([]);
    setMessages([]);
    setShowRawText(true);
    setActiveTab("material");
    setIsMobileDrawerOpen(false);
  }, [setActiveDocId, setActiveDocTitle, setActiveDocContent, setActiveDocSummary, setFlashcards, setQuizQuestions, setMessages, setActiveTab]);

  const handleSaveDocument = useCallback(async () => {
    await baseSaveDocument(activeDocTitle, activeDocContent, () => {
      setShowRawText(false);
    });
  }, [baseSaveDocument, activeDocTitle, activeDocContent]);

  const startMistakeDrill = useCallback(() => {
    const targetList = mistakeFilterScope === "current" && activeDocId ? activeDocMistakes : mistakes;
    if (targetList.length === 0) return;
    const questions: QuizQuestion[] = targetList.map((m, idx) => ({
      id: idx + 1,
      question: m.question,
      options: m.options,
      correctIndex: m.correctIndex,
      formula: m.formula,
      steps: m.steps,
      explanation: m.explanation || "",
      pitfall: m.pitfall || ""
    }));
    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserAnswers({});
    setScore(0);
    setIsQuizCompleted(false);
    setQuizMode("study");
    setIsDrillingMistakes(true);
    setActiveTab("quiz");
    showNotice(`Memulai Drill Ulang ${questions.length} Soal ${mistakeFilterScope === "current" && activeDocId ? "pada modul ini" : "lintas modul"}!`);
  }, [
    mistakeFilterScope,
    activeDocId,
    activeDocMistakes,
    mistakes,
    setQuizQuestions,
    setCurrentQuestionIndex,
    setSelectedOption,
    setIsAnswerSubmitted,
    setUserAnswers,
    setScore,
    setIsQuizCompleted,
    setQuizMode,
    setIsDrillingMistakes,
    setActiveTab,
    showNotice
  ]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleStageFiles(e.dataTransfer.files);
    }
  }, [setIsDragging, handleStageFiles]);

  // Content normalization & word counts
  const wordCount = useMemo(() => (activeDocContent ? activeDocContent.trim().split(/\s+/).length : 0), [activeDocContent]);
  const formattedContent = useMemo(() => (activeDocContent ? normalizeDiagramsInMarkdown(activeDocContent) : ""), [activeDocContent]);
  const formattedSummary = useMemo(() => {
    if (!activeDocSummary) return "";
    return normalizeDiagramsInMarkdown(activeDocSummary.replace(/\$\\rightarrow\$/g, "→"));
  }, [activeDocSummary]);

  const timerMins = Math.floor(timerSeconds / 60);
  const timerSecs = timerSeconds % 60;
  const timerDisplay = `${timerMins.toString().padStart(2, "0")}:${timerSecs.toString().padStart(2, "0")}`;
  const activeDoc = useMemo(() => documents.find((d) => d.id === activeDocId), [documents, activeDocId]);

  return (
    <div className="app-shell" style={{ display: "flex", height: "100vh", backgroundColor: "#eef1eb", color: "#17201d", overflow: "hidden" }}>
      {/* Toast Notification */}
      {statusNotice && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            left: 24,
            zIndex: 9999,
            backgroundColor: "#18221f",
            color: "#c8f064",
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #34413c",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)"
          }}
        >
          <CheckCircle2 size={16} />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Timer Alarm Modal */}
      <TimerAlarmModal
        isAlarmActive={isAlarmActive}
        setIsAlarmActive={setIsAlarmActive}
        timerMode={timerMode}
        setTimerMode={setTimerMode}
        timerDurationMinutes={timerDurationMinutes}
        setTimerSeconds={setTimerSeconds}
        setIsTimerRunning={setIsTimerRunning}
        showNotice={showNotice}
      />

      {/* User Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        setMode={setAuthMode}
        username={authUsername}
        setUsername={setAuthUsername}
        password={authPassword}
        setPassword={setAuthPassword}
        name={authName}
        setName={setAuthName}
        isLoading={isAuthLoading}
        error={authError}
        setError={setAuthError}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* User Profile, Weekly Target, & Leaderboard Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        activeTab={profileModalTab}
        setActiveTab={setProfileModalTab}
        onUpdateProfile={updateProfile}
        onLogout={handleLogout}
        onOpenRoomModal={handleOpenRoomHub}
      />

      {/* Multiplayer Study Room & Challenge Modal */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={handleCloseRoomModal}
        currentUser={currentUser}
        activeDocId={activeDocId}
        activeDocTitle={activeDocTitle}
        documents={documents}
        showNotice={showNotice}
        onOpenAuthModal={() => {
          setAuthMode("register");
          setAuthError("");
          setIsAuthModalOpen(true);
        }}
        onStartRoomExam={handleStartRoomExam}
        initialRoomId={roomModalRoomId}
        initialViewState={roomModalInitialView}
        onQuickRegisterGuest={quickRegisterGuest}
      />

      {/* Backdrop overlay for mobile drawer */}
      {isMobileDrawerOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar */}
      <Sidebar
        isMobileDrawerOpen={isMobileDrawerOpen}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsAiPanelOpen={setIsAiPanelOpen}
        handleCreateNewDoc={handleCreateNewDoc}
        setIsTopicModalOpen={setIsTopicModalOpen}
        setIsYouTubeModalOpen={setIsYouTubeModalOpen}
        setTopicStep={setTopicStep}
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        handleStageFiles={handleStageFiles}
        documents={documents}
        activeDocId={activeDocId}
        loadDocument={loadDocument}
        quizQuestions={quizQuestions}
        activeDocMistakes={activeDocMistakes}
        mistakes={mistakes}
        flashcards={flashcards}
        isUploading={isUploading}
        setIsStagingModalOpen={setIsStagingModalOpen}
        currentUser={currentUser}
        onOpenAuthModal={() => {
          setAuthMode("register");
          setAuthError("");
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        handleDeleteDocument={(id, e) => handleDeleteDocument(id, e, () => {
          setFlashcards([]);
          setQuizQuestions([]);
        })}
        handleDeleteAllDocuments={() => handleDeleteAllDocuments(() => {
          setFlashcards([]);
          setQuizQuestions([]);
        })}
        docSearchQuery={docSearchQuery}
        setDocSearchQuery={setDocSearchQuery}
        onOpenProfileModal={(tab) => {
          if (tab) setProfileModalTab(tab);
          setIsProfileModalOpen(true);
        }}
        onOpenRoomModal={handleOpenRoomHub}
      />

      {/* Main View Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", maxHeight: "100vh", overflow: "hidden", minWidth: 0 }}>
        <TopBar
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
          activeTab={activeTab}
          activeDocTitle={activeDocTitle}
          activeDocContent={activeDocContent}
          timerMode={timerMode}
          timerSeconds={timerSeconds}
          setTimerSeconds={setTimerSeconds}
          timerDurationMinutes={timerDurationMinutes}
          setTimerDurationMinutes={setTimerDurationMinutes}
          isTimerRunning={isTimerRunning}
          setIsTimerRunning={setIsTimerRunning}
          applyTimerDuration={applyTimerDuration}
          isTimerSettingsOpen={isTimerSettingsOpen}
          setIsTimerSettingsOpen={setIsTimerSettingsOpen}
          customMinutesInput={customMinutesInput}
          setCustomMinutesInput={setCustomMinutesInput}
          playAlarmSound={() => {}}
          fetchOrExtractFormulas={fetchOrExtractFormulas}
          activeDocFormulas={formulas}
          setIsFormulaDrawerOpen={setIsFormulaDrawerOpen}
          isAiPanelOpen={isAiPanelOpen}
          setIsAiPanelOpen={setIsAiPanelOpen}
          models={models}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          currentUser={currentUser}
          onOpenAuthModal={() => {
            setAuthMode("register");
            setAuthError("");
            setIsAuthModalOpen(true);
          }}
          onLogout={handleLogout}
          onOpenProfileModal={() => {
            setProfileModalTab("profile");
            setIsProfileModalOpen(true);
          }}
        />

        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
          <section className="main-scroll-section" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            {activeTab !== "home" && (
              <div className="mode-tabs" role="tablist" aria-label="Mode belajar" style={{ flexShrink: 0 }}>
                {[
                  { id: "material", label: "Materi", count: "01" },
                  { id: "summary", label: "Rangkuman", count: "AI" },
                  { id: "flashcards", label: "Flashcard 3D", count: String((flashcards || []).length).padStart(2, "0") },
                  { id: "quiz", label: "Latihan Soal", count: String((quizQuestions || []).length).padStart(2, "0") },
                  { id: "feynman", label: "Uji Feynman", count: "01" },
                  { id: "mistakes", label: "Bank Salah", count: String((activeDocId ? (activeDocMistakes || []).length : (mistakes || []).length)).padStart(2, "0") },
                ].map((item) => (
                  <button
                    className={activeTab === item.id ? "active" : ""}
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    role="tab"
                  >
                    <span>{item.label}</span>
                    <small>{item.count}</small>
                  </button>
                ))}
              </div>
            )}

            <div className="content-scroll" style={{ flex: 1, minHeight: 0, padding: "16px 20px" }}>
              <div style={{ maxWidth: activeTab === "material" ? 1440 : 1080, margin: "0 auto", width: "100%", transition: "max-width 0.2s ease" }}>
                {activeTab === "home" && (
                <HomeHubTab
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  documents={documents}
                  activeDocId={activeDocId}
                  activeDocTitle={activeDocTitle}
                  activeDocContent={activeDocContent}
                  loadDocument={loadDocument}
                  handleDeleteDocument={(id, e) => handleDeleteDocument(id, e)}
                  handleDeleteAllDocuments={() => handleDeleteAllDocuments(() => {
                    setFlashcards([]);
                    setQuizQuestions([]);
                  })}
                  homeSearchQuery={homeSearchQuery}
                  setHomeSearchQuery={setHomeSearchQuery}
                  homeSubjectFilter={homeSubjectFilter}
                  setHomeSubjectFilter={setHomeSubjectFilter}
                  fileInputRef={fileInputRef}
                  cameraInputRef={cameraInputRef}
                  currentUser={currentUser}
                  setIsTopicModalOpen={setIsTopicModalOpen}
                  setIsYouTubeModalOpen={setIsYouTubeModalOpen}
                  setIsStagingModalOpen={setIsStagingModalOpen}
                  handleStageFiles={handleStageFiles}
                  quizQuestions={quizQuestions}
                  flashcards={flashcards}
                  mistakes={mistakes}
                  handleGenerateQuiz={handleGenerateQuiz}
                  setTopicInput={setTopicInput}
                  handleStartTopicClarify={handleStartTopicClarify}
                />
              )}

              {activeTab === "material" && (
                <MaterialTab
                  documents={documents}
                  loadDocument={loadDocument}
                  activeDocId={activeDocId}
                  activeDocTitle={activeDocTitle}
                  setActiveDocTitle={setActiveDocTitle}
                  activeDocContent={activeDocContent}
                  setActiveDocContent={setActiveDocContent}
                  activeDocSummary={activeDocSummary}
                  formattedContent={formattedContent}
                  wordCount={wordCount}
                  flashcards={flashcards}
                  quizQuestions={quizQuestions}
                  isDetectingTitle={isDetectingTitle}
                  handleAutoDetectTitle={handleAutoDetectTitle}
                  fileInputRef={fileInputRef}
                  setIsEnrichModalOpen={setIsEnrichModalOpen}
                  copyToClipboard={copyToClipboard}
                  copiedId={copiedId}
                  handleSaveDocument={handleSaveDocument}
                  setActiveTab={setActiveTab}
                  materialCreationTab={materialCreationTab}
                  setMaterialCreationTab={setMaterialCreationTab}
                  cameraInputRef={cameraInputRef}
                  handleGenerateSummary={handleGenerateSummary}
                  isUploading={isUploading}
                  uploadError={uploadError}
                  topicInput={topicInput}
                  setTopicInput={setTopicInput}
                  setIsTopicModalOpen={setIsTopicModalOpen}
                  setIsYouTubeModalOpen={setIsYouTubeModalOpen}
                  handleStartTopicClarify={handleStartTopicClarify}
                  isEnriching={isEnriching}
                  showRawText={showRawText}
                  setShowRawText={setShowRawText}
                  isDragging={isDragging}
                  setIsDragging={setIsDragging}
                  handleDrop={handleDrop}
                  handleGenerateQuiz={handleGenerateQuiz}
                  handleGenerateFlashcards={handleGenerateFlashcards}
                />
              )}

              {activeTab === "quiz" && (
                <QuizTab
                  quizQuestions={quizQuestions}
                  currentQuestionIndex={currentQuestionIndex}
                  setCurrentQuestionIndex={setCurrentQuestionIndex}
                  quizQuestionCount={quizQuestionCount}
                  setQuizQuestionCount={setQuizQuestionCount}
                  quizMode={quizMode}
                  setQuizMode={setQuizMode}
                  quizType={quizType}
                  setQuizType={setQuizType}
                  isDrillingMistakes={isDrillingMistakes}
                  userAnswers={userAnswers}
                  selectedOption={selectedOption}
                  setSelectedOption={setSelectedOption}
                  isAnswerSubmitted={isAnswerSubmitted}
                  isQuizCompleted={isQuizCompleted}
                  score={score}
                  solutionStep={solutionStep}
                  setSolutionStep={setSolutionStep}
                  examTimeLeft={examTimeLeft}
                  setExamTimeLeft={setExamTimeLeft}
                  examDurationSeconds={examDurationSeconds}
                  setExamDurationSeconds={setExamDurationSeconds}
                  isExamTimerRunning={isExamTimerRunning}
                  setIsExamTimerRunning={setIsExamTimerRunning}
                  examFlagged={examFlagged}
                  toggleFlagQuestion={toggleFlagQuestion}
                  examSubmitted={examSubmitted}
                  setExamSubmitted={setExamSubmitted}
                  isGeneratingQuiz={isGeneratingQuiz}
                  handleGenerateQuiz={handleGenerateQuiz}
                  handleSelectQuizOption={handleSelectQuizOption}
                  handlePrevQuizQuestion={handlePrevQuizQuestion}
                  handleNextQuizQuestion={handleNextQuizQuestion}
                  handleExamSubmit={handleExamSubmit}
                  resetQuizState={resetQuizState}
                  activeDocId={activeDocId}
                  activeDocTitle={activeDocTitle}
                  isQuizChatOpen={isQuizChatOpen}
                  setIsQuizChatOpen={setIsQuizChatOpen}
                  quizChatMessages={quizChatMessages}
                  quizChatInput={quizChatInput}
                  setQuizChatInput={setQuizChatInput}
                  isQuizChatSending={isQuizChatSending}
                  handleSendQuizQuestionChat={handleSendQuizQuestionChat}
                  setActiveTab={setActiveTab}
                  setMistakeFilterScope={setMistakeFilterScope}
                  activeDocMistakes={activeDocMistakes}
                  mistakes={mistakes}
                  selectedModel={selectedModel}
                  setQuizQuestions={setQuizQuestions}
                  activeRoomSession={activeRoomSession}
                  onOpenRoomLeaderboard={() => {
                    setRoomModalInitialView("result");
                    if (activeRoomSession) setRoomModalRoomId(activeRoomSession.roomId);
                    setIsRoomModalOpen(true);
                  }}
                />
              )}

              {activeTab === "mistakes" && (
                <MistakesTab
                  mistakes={mistakes}
                  displayedMistakes={displayedMistakes}
                  activeDocMistakes={activeDocMistakes}
                  activeDocId={activeDocId}
                  activeDocTitle={activeDocTitle}
                  mistakeFilterScope={mistakeFilterScope}
                  setMistakeFilterScope={setMistakeFilterScope}
                  resolveMistake={resolveMistake}
                  deleteMistake={deleteMistake}
                  handleClearMistakes={handleClearMistakes}
                  startMistakeDrill={startMistakeDrill}
                  loadDocument={loadDocument}
                  setActiveTab={setActiveTab}
                  setQuizQuestions={setQuizQuestions}
                  setUserAnswers={setUserAnswers}
                  setIsAnswerSubmitted={setIsAnswerSubmitted}
                />
              )}

              {activeTab === "feynman" && (
                <FeynmanTab
                  feynmanTopic={feynmanTopic}
                  setFeynmanTopic={setFeynmanTopic}
                  feynmanExplanation={feynmanExplanation}
                  setFeynmanExplanation={setFeynmanExplanation}
                  isEvaluatingFeynman={isEvaluatingFeynman}
                  feynmanResult={feynmanResult}
                  handleEvaluateFeynman={handleEvaluateFeynman}
                  isRecordingFeynman={isRecordingFeynman}
                  isTranscribing={isTranscribing}
                  feynmanRecordingSeconds={feynmanRecordingSeconds}
                  handleToggleFeynmanRecording={handleToggleFeynmanRecording}
                />
              )}

              {activeTab === "flashcards" && (
                <FlashcardsTab
                  flashcards={flashcards}
                  currentCardIndex={currentCardIndex}
                  setCurrentCardIndex={setCurrentCardIndex}
                  isFlipped={isFlipped}
                  setIsFlipped={setIsFlipped}
                  handleGenerateFlashcards={handleGenerateFlashcards}
                  handleReviewCard={handleReviewCard}
                  isGeneratingCards={isGeneratingCards}
                />
              )}

              {activeTab === "summary" && (
                <SummaryTab
                  activeDoc={activeDoc}
                  activeDocTitle={activeDocTitle}
                  activeDocSummary={activeDocSummary}
                  formattedSummary={formattedSummary}
                  summaryStyle={summaryStyle}
                  setSummaryStyle={setSummaryStyle}
                  isGeneratingSummary={isGeneratingSummary}
                  handleGenerateSummary={handleGenerateSummary}
                  isSpeaking={isSpeaking}
                  toggleSpeech={toggleSpeech}
                  downloadAsMarkdown={downloadAsMarkdown}
                  copyToClipboard={copyToClipboard}
                  copiedId={copiedId}
                  quizQuestions={quizQuestions}
                  flashcards={flashcards}
                  activeDocId={activeDocId}
                  selectedModel={selectedModel}
                  setActiveDocSummary={setActiveDocSummary}
                />
              )}

              {activeTab === "chat" && (
                <ChatTab
                  activeDocTitle={activeDocTitle}
                  selectedModel={selectedModel}
                  messages={messages}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  handleSendMessage={handleSendMessage}
                  isChatSending={isChatSending}
                  stagedAttachment={stagedAttachment}
                  handleAttachFile={handleAttachFile}
                  handleClearAttachment={handleClearAttachment}
                  handleClearChat={handleClearChat}
                />
              )}
              </div>
            </div>

            {activeTab !== "home" && (
              <footer className="learning-footer" style={{ flexShrink: 0 }}>
                <div className="progress-label">
                  <span>Progres modul</span>
                  <strong>{quizQuestions.length > 0 ? (isQuizCompleted ? 100 : Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)) : 64}%</strong>
                </div>
                <div className="footer-progress">
                  <i style={{ width: `${quizQuestions.length > 0 ? (isQuizCompleted ? 100 : Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)) : 64}%` }} />
                </div>
                <div className="footer-steps">
                  <span className={activeTab === "material" ? "done" : ""}>Materi</span>
                  <span className={activeTab === "flashcards" ? "done" : ""}>Flashcard</span>
                  <span className={activeTab === "quiz" ? "done" : ""}>Latihan</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "material") setActiveTab("flashcards");
                    else if (activeTab === "flashcards") setActiveTab("quiz");
                    else if (activeTab === "quiz") setActiveTab("feynman");
                    else setActiveTab("material");
                  }}
                >
                  {activeTab === "material"
                    ? "Lanjut ke flashcard"
                    : activeTab === "flashcards"
                    ? "Lanjut ke latihan soal"
                    : activeTab === "quiz"
                    ? "Lanjut ke uji feynman"
                    : "Kembali ke materi"}
                  <span>→</span>
                </button>
              </footer>
            )}
          </section>

          {/* Right Column: Tanya Nara AI Panel */}
          <TanyaNaraPanel
            activeTab={activeTab}
            isAiPanelOpen={isAiPanelOpen}
            setIsAiPanelOpen={setIsAiPanelOpen}
            activeDocTitle={activeDocTitle}
            messages={messages}
            setMessages={setMessages}
            isChatSending={isChatSending}
            chatEndRef={chatEndRef}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendMessage={handleSendMessage}
            stagedAttachment={stagedAttachment}
            handleAttachFile={handleAttachFile}
            handleClearAttachment={handleClearAttachment}
            handleClearChat={handleClearChat}
            isFreeMode={isFreeMode}
            setIsFreeMode={setIsFreeMode}
            effectiveDocId={effectiveDocId}
          />
        </div>
      </div>

      {/* Formula Cheatsheet Drawer */}
      <FormulaDrawer
        isFormulaDrawerOpen={isFormulaDrawerOpen}
        setIsFormulaDrawerOpen={setIsFormulaDrawerOpen}
        activeDocTitle={activeDocTitle}
        activeDocId={activeDocId}
        selectedModel={selectedModel}
        formulas={formulas}
        setFormulas={setFormulas}
        isLoadingFormulas={isLoadingFormulas}
        setIsLoadingFormulas={setIsLoadingFormulas}
        formulaFilter={formulaFilter}
        setFormulaFilter={setFormulaFilter}
        fetchOrExtractFormulas={fetchOrExtractFormulas}
        downloadAsMarkdown={downloadAsMarkdown}
      />

      {/* AI Topic Discovery & Generator Modal */}
      <TopicModal
        isTopicModalOpen={isTopicModalOpen}
        setIsTopicModalOpen={setIsTopicModalOpen}
        topicStep={topicStep}
        setTopicStep={setTopicStep}
        topicInput={topicInput}
        setTopicInput={setTopicInput}
        isClarifyingTopic={isClarifyingTopic}
        isGeneratingTopic={isGeneratingTopic}
        topicClarificationData={topicClarificationData}
        topicAnswers={topicAnswers}
        setTopicAnswers={setTopicAnswers}
        handleStartTopicClarify={handleStartTopicClarify}
        handleGenerateTopicDocument={handleGenerateTopicDocument}
      />

      {/* AI Web Research & Enrichment Modal */}
      <EnrichModal
        isEnrichModalOpen={isEnrichModalOpen}
        setIsEnrichModalOpen={setIsEnrichModalOpen}
        activeDocTitle={activeDocTitle}
        isEnriching={isEnriching}
        enrichSuggestions={enrichSuggestions}
        isLoadingSuggestions={isLoadingSuggestions}
        selectedEnrichTitles={selectedEnrichTitles}
        setSelectedEnrichTitles={setSelectedEnrichTitles}
        enrichFocus={enrichFocus}
        setEnrichFocus={setEnrichFocus}
        handleEnrichDocument={handleEnrichDocument}
      />

      {/* Upload & Photo Staging Tray */}
      <StagingUploadModal
        isStagingModalOpen={isStagingModalOpen}
        setIsStagingModalOpen={setIsStagingModalOpen}
        stagedFiles={stagedFiles}
        isUploading={isUploading}
        uploadError={uploadError}
        stagedDocTitle={stagedDocTitle}
        setStagedDocTitle={setStagedDocTitle}
        stagedGoal={stagedGoal}
        setStagedGoal={setStagedGoal}
        stagedCustomInstruction={stagedCustomInstruction}
        setStagedCustomInstruction={setStagedCustomInstruction}
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        handleStageFiles={handleStageFiles}
        handleCancelStaging={handleCancelStaging}
        handleRemoveStagedFile={handleRemoveStagedFile}
        handleConfirmStagedUpload={handleConfirmStagedUpload}
      />

      {/* YouTube Video Learning Ingestion Modal */}
      <YouTubeModal
        isYouTubeModalOpen={isYouTubeModalOpen}
        setIsYouTubeModalOpen={setIsYouTubeModalOpen}
        ytUrl={ytUrl}
        setYtUrl={setYtUrl}
        ytGoal={ytGoal}
        setYtGoal={setYtGoal}
        ytInstruction={ytInstruction}
        setYtInstruction={setYtInstruction}
        isCheckingUrl={isCheckingUrl}
        isGeneratingYt={isGeneratingYt}
        ytInfo={ytInfo}
        ytError={ytError}
        setYtError={setYtError}
        handleCheckUrl={handleCheckUrl}
        handleGenerateDocument={handleGenerateYtDocument}
        handleReset={handleResetYt}
      />

      {/* Mobile Bottom Navigation Bar (With integrated Tanya Nara center button, no floating FAB overlay) */}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        isAiPanelOpen={isAiPanelOpen}
        setIsAiPanelOpen={setIsAiPanelOpen}
        mistakes={mistakes}
      />
    </div>
  );
}
