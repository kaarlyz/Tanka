import { useState, useRef } from "react";
import { ActiveTab, QuizQuestion } from "./types";

// Hooks
import { useDocuments } from "./hooks/useDocuments";
import { useStudyTimer } from "./hooks/useStudyTimer";
import { useStagedUpload } from "./hooks/useStagedUpload";
import { useEnrichWeb } from "./hooks/useEnrichWeb";
import { useStudyModules } from "./hooks/useStudyModules";

// Layout & Common Components
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { MobileDrawer } from "./components/layout/MobileDrawer";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { NoticeToast } from "./components/common/NoticeToast";
import { AudioAlarmModal } from "./components/common/AudioAlarmModal";

// Modals
import { StagingUploadModal } from "./components/modals/StagingUploadModal";
import { EnrichModal } from "./components/modals/EnrichModal";
import { RawTextModal } from "./components/modals/RawTextModal";
import { AiChatDrawer } from "./components/modals/AiChatDrawer";

// Study Mode Tabs
import { MaterialTab } from "./components/tabs/MaterialTab";
import { QuizTab } from "./components/tabs/QuizTab";
import { FeynmanTab } from "./components/tabs/FeynmanTab";
import { FlashcardsTab } from "./components/tabs/FlashcardsTab";
import { SummaryTab } from "./components/tabs/SummaryTab";
import { MistakesTab } from "./components/tabs/MistakesTab";
import { CheatsheetTab } from "./components/tabs/CheatsheetTab";

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("material");
  const [notice, setNotice] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isRawTextModalOpen, setIsRawTextModalOpen] = useState(false);
  const [rawTextTitle, setRawTextTitle] = useState("");
  const [rawTextContent, setRawTextContent] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // 1. Documents & Active Doc Hook
  const {
    documents,
    setDocuments,
    activeDocId,
    setActiveDocId,
    activeDoc,
    activeDocContent,
    setActiveDocContent,
    activeDocSummary,
    setActiveDocSummary,
    models,
    selectedModel,
    setSelectedModel,
    searchQuery,
    setSearchQuery,
    handleSaveDocContent,
    handleDeleteDocument,
    handleDetectTitle,
    handleTailorMaterial,
    handleCreateRawText
  } = useDocuments(showNotice);

  // 2. Focus Timer Hook
  const {
    timerSeconds,
    timerDuration,
    isTimerRunning,
    timerMode,
    isAlarmActive,
    isTimerSettingsOpen,
    setIsTimerSettingsOpen,
    setIsAlarmActive,
    handleToggleTimer,
    handleResetTimer,
    handleSelectPreset,
    handleStartBreak,
    handleStartFocus
  } = useStudyTimer(showNotice);

  // 3. Staged Upload Hook
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
    uploadProcessing,
    uploadStepIndex,
    uploadStepDetail,
    handleFileChange,
    handleRemoveStagedFile,
    handleProcessStagedFiles
  } = useStagedUpload(showNotice, (newDoc, isExamQuestions, questionCount) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
    setActiveDocId(newDoc.id);
    setActiveDocContent(newDoc.content);

    if (isExamQuestions) {
      showNotice(`📋 Terdeteksi ${questionCount || ""} Soal Kisi-Kisi! Materi & Latihan Kuis siap dipelajari.`);
      setActiveTab("quiz");
    } else {
      showNotice(`Materi \"${newDoc.title}\" berhasil dibuat!`);
      setActiveTab("material");
    }
  });

  // 4. Web Enrichment Hook
  const {
    isEnrichModalOpen,
    setIsEnrichModalOpen,
    enrichSuggestions,
    selectedEnrichTitles,
    enrichFocusText,
    setEnrichFocusText,
    isEnriching,
    isEnrichSuggestionsLoading,
    handleOpenEnrichModal,
    handleToggleSelectEnrich,
    handleApplyEnrichment
  } = useEnrichWeb(activeDocId, activeDocContent, setActiveDocContent, showNotice);

  // 5. Study Modules Hook (Quizzes, Cards, Feynman, Summary, Mistakes, Cheatsheet, Chat)
  const {
    quizzes,
    setQuizzes,
    isGeneratingQuiz,
    flashcards,
    isGeneratingCards,
    feynmanEval,
    isEvaluatingFeynman,
    cheatsheet,
    isGeneratingCheatsheet,
    mistakes,
    isGeneratingSummary,
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    isChatSending,
    handleGenerateQuiz,
    handleRecordMistake,
    handleResolveMistake,
    handleClearMistakes,
    handleGenerateCards,
    handleReviewCard,
    handleGenerateSummary,
    handleEvaluateFeynman,
    handleGenerateCheatsheet,
    handleSendChatMessage,
    handleClearChatHistory
  } = useStudyModules(
    activeDocId,
    activeDoc,
    selectedModel,
    showNotice,
    setActiveDocId,
    setDocuments,
    setActiveDocContent,
    setActiveDocSummary,
    activeDocSummary
  );

  return (
    <div className="tanka-layout">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        style={{ display: "none" }}
      />

      {/* Navbar */}
      <Navbar
        timerSeconds={timerSeconds}
        timerDuration={timerDuration}
        isTimerRunning={isTimerRunning}
        timerMode={timerMode}
        onToggleTimer={handleToggleTimer}
        onResetTimer={handleResetTimer}
        onSelectPreset={handleSelectPreset}
        isTimerSettingsOpen={isTimerSettingsOpen}
        setIsTimerSettingsOpen={setIsTimerSettingsOpen}
        activeTab={activeTab}
        activeDoc={activeDoc}
        models={models}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <div className="tanka-main">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          documents={documents}
          activeDocId={activeDocId}
          setActiveDocId={setActiveDocId}
          onDeleteDocument={handleDeleteDocument}
          onTriggerFileUpload={() => fileInputRef.current?.click()}
          onTriggerRawText={() => setIsRawTextModalOpen(true)}
          mistakeCount={mistakes.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Workspace Body */}
        <main className="tanka-workspace">
          <NoticeToast message={notice} onClose={() => setNotice(null)} />

          {activeTab === "material" && (
            <MaterialTab
              activeDocId={activeDocId}
              activeDocTitle={activeDoc?.title || "Materi Belajar"}
              activeDocContent={activeDocContent}
              onSaveContent={handleSaveDocContent}
              onTriggerEnrichWeb={handleOpenEnrichModal}
              onDetectTitle={handleDetectTitle}
              onTailorMaterial={handleTailorMaterial}
              quizCount={quizzes.length}
              flashcardCount={flashcards.length}
              setActiveTab={setActiveTab}
              showNotice={showNotice}
            />
          )}

          {activeTab === "quiz" && (
            <QuizTab
              quizzes={quizzes}
              activeDocId={activeDocId}
              activeDocTitle={activeDoc?.title || "Materi Belajar"}
              onGenerateQuiz={handleGenerateQuiz}
              isGeneratingQuiz={isGeneratingQuiz}
              onRecordMistake={handleRecordMistake}
              onAskAIAboutQuestion={(q, questionText) => {
                setIsChatOpen(true);
                handleSendChatMessage(`Tolong jelaskan soal ini:\n\n\"${questionText}\"\n\nPenjelasan: ${q.explanation || ""}`);
              }}
              showNotice={showNotice}
            />
          )}

          {activeTab === "feynman" && (
            <FeynmanTab
              activeDocId={activeDocId}
              activeDocTitle={activeDoc?.title || "Materi Belajar"}
              onEvaluate={handleEvaluateFeynman}
              isEvaluating={isEvaluatingFeynman}
              evaluationResult={feynmanEval}
              showNotice={showNotice}
            />
          )}

          {activeTab === "flashcards" && (
            <FlashcardsTab
              flashcards={flashcards}
              onGenerateCards={handleGenerateCards}
              isGeneratingCards={isGeneratingCards}
              onReviewCard={handleReviewCard}
              showNotice={showNotice}
            />
          )}

          {activeTab === "summary" && (
            <SummaryTab
              activeDocSummary={activeDocSummary}
              onGenerateSummary={handleGenerateSummary}
              isGeneratingSummary={isGeneratingSummary}
              showNotice={showNotice}
            />
          )}

          {activeTab === "mistakes" && (
            <MistakesTab
              mistakes={mistakes}
              activeDocId={activeDocId}
              activeDocTitle={activeDoc?.title || "Materi Belajar"}
              onResolveMistake={handleResolveMistake}
              onClearMistakes={handleClearMistakes}
              onStartDrill={(filtered) => {
                const drillQuizzes: QuizQuestion[] = filtered.map((m, idx) => ({
                  id: idx + 1,
                  question: m.question,
                  options: m.options,
                  correctIndex: m.correctIndex,
                  explanation: m.explanation,
                  pitfall: m.pitfall
                }));
                setQuizzes(drillQuizzes);
                setActiveTab("quiz");
                showNotice(`Memulai drill khusus ${drillQuizzes.length} soal yang pernah keliru!`);
              }}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "cheatsheet" && (
            <CheatsheetTab
              cheatsheet={cheatsheet}
              onGenerateCheatsheet={handleGenerateCheatsheet}
              isGeneratingCheatsheet={isGeneratingCheatsheet}
              showNotice={showNotice}
            />
          )}
        </main>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        documents={documents}
        activeDocId={activeDocId}
        setActiveDocId={setActiveDocId}
        onDeleteDocument={handleDeleteDocument}
        onTriggerFileUpload={() => {
          setIsMobileDrawerOpen(false);
          fileInputRef.current?.click();
        }}
        onTriggerRawText={() => {
          setIsMobileDrawerOpen(false);
          setIsRawTextModalOpen(true);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Mobile Bottom Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        mistakeCount={mistakes.length}
      />

      {/* Modals & Overlays */}
      <StagingUploadModal
        isOpen={isStagingModalOpen}
        stagedFiles={stagedFiles}
        onRemoveFile={handleRemoveStagedFile}
        onAddMoreFiles={() => fileInputRef.current?.click()}
        onClose={() => setIsStagingModalOpen(false)}
        docTitle={stagedDocTitle}
        setDocTitle={setStagedDocTitle}
        stagedGoal={stagedGoal}
        setStagedGoal={setStagedGoal}
        stagedCustomInstruction={stagedCustomInstruction}
        setStagedCustomInstruction={setStagedCustomInstruction}
        onProcess={handleProcessStagedFiles}
        uploadProcessing={uploadProcessing}
        uploadStepIndex={uploadStepIndex}
        uploadStepDetail={uploadStepDetail}
      />

      <EnrichModal
        isOpen={isEnrichModalOpen}
        onClose={() => setIsEnrichModalOpen(false)}
        suggestions={enrichSuggestions}
        selectedTitles={selectedEnrichTitles}
        onToggleSelect={handleToggleSelectEnrich}
        focusText={enrichFocusText}
        setFocusText={setEnrichFocusText}
        onApply={handleApplyEnrichment}
        isEnriching={isEnriching}
        isLoadingSuggestions={isEnrichSuggestionsLoading}
      />

      <RawTextModal
        isOpen={isRawTextModalOpen}
        onClose={() => setIsRawTextModalOpen(false)}
        rawTextTitle={rawTextTitle}
        setRawTextTitle={setRawTextTitle}
        rawTextContent={rawTextContent}
        setRawTextContent={setRawTextContent}
        onSubmit={async () => {
          const success = await handleCreateRawText(rawTextTitle, rawTextContent);
          if (success) {
            setIsRawTextModalOpen(false);
            setRawTextTitle("");
            setRawTextContent("");
            setActiveTab("material");
          }
        }}
      />

      <AiChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
        isChatSending={isChatSending}
        onClearChat={handleClearChatHistory}
        activeDocTitle={activeDoc?.title}
      />

      <AudioAlarmModal
        isOpen={isAlarmActive}
        timerMode={timerMode}
        onStartBreak={handleStartBreak}
        onStartFocus={handleStartFocus}
        onClose={() => setIsAlarmActive(false)}
      />
    </div>
  );
}

export default App;
