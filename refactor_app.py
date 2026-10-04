import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Add imports
import_statement = 'import { useMistakes } from "./hooks/useMistakes";\nimport { useQuiz } from "./hooks/useQuiz";\n'
content = content.replace('import { useStudyTimer } from "./hooks/useStudyTimer";', import_statement + 'import { useStudyTimer } from "./hooks/useStudyTimer";')

# 2. Replace mistake states
mistake_state_regex = re.compile(r'  // Mistake Notebook state\n  const \[mistakes.*?const displayedMistakes =.*?;', re.DOTALL)
content = mistake_state_regex.sub(r'''
  const {
    mistakes, setMistakes,
    isDrillingMistakes, setIsDrillingMistakes,
    mistakeFilterScope, setMistakeFilterScope,
    activeDocMistakes, displayedMistakes,
    fetchMistakes, recordMistake, resolveMistake, deleteMistake, handleClearMistakes
  } = useMistakes({ activeDocId, activeDocTitle, showNotice });
''', content)

# 3. Replace mistake functions
mistake_func_regex = re.compile(r'  async function fetchMistakes\(\) \{.*?  \}\n\n  async function handleClearMistakes\(\) \{.*?  \}\n', re.DOTALL)
content = mistake_func_regex.sub('', content)

# 4. Replace quiz states
quiz_state_regex = re.compile(r'  const \[quizQuestions.*?const \[examDurationSeconds, setExamDurationSeconds\] = useState\(0\);', re.DOTALL)
content = quiz_state_regex.sub(r'''
  const {
    quizQuestions, setQuizQuestions,
    quizQuestionCount, setQuizQuestionCount,
    currentQuestionIndex, setCurrentQuestionIndex,
    selectedOption, setSelectedOption,
    isAnswerSubmitted, setIsAnswerSubmitted,
    score, setScore,
    userAnswers, setUserAnswers,
    isQuizCompleted, setIsQuizCompleted,
    isGeneratingQuiz, setIsGeneratingQuiz,
    solutionStep, setSolutionStep,
    quizMode, setQuizMode,
    examTimeLeft, setExamTimeLeft,
    isExamTimerRunning, setIsExamTimerRunning,
    examFlagged, setExamFlagged,
    examSubmitted, setExamSubmitted,
    examDurationSeconds, setExamDurationSeconds,
    isQuizChatOpen, setIsQuizChatOpen,
    handleGenerateQuiz,
    handleSelectQuizOption,
    handlePrevQuizQuestion,
    handleNextQuizQuestion,
    toggleFlagQuestion,
    handleExamSubmit,
    resetQuizState
  } = useQuiz({ activeDocId, selectedModel, quizType, showNotice, recordMistake });
''', content)

# 5. Remove quiz functions
# handleGenerateQuiz down to handleNextQuizQuestion
quiz_func_regex1 = re.compile(r'  async function handleGenerateQuiz\(.*?\n  function handleNextQuizQuestion\(\) \{.*?\}\n', re.DOTALL)
content = quiz_func_regex1.sub('', content)

# handleExamSubmit
quiz_func_regex2 = re.compile(r'  function handleExamSubmit\(\) \{.*?\}\n', re.DOTALL)
content = quiz_func_regex2.sub('', content)

# resetQuizState
quiz_func_regex3 = re.compile(r'  function resetQuizState\(\) \{.*?\}\n', re.DOTALL)
content = quiz_func_regex3.sub('', content)

# 6. Remove isQuizChatOpen states (if defined locally in App.tsx)
chat_state_regex = re.compile(r'  const \[isQuizChatOpen, setIsQuizChatOpen\] = useState\(false\);\n', re.DOTALL)
content = chat_state_regex.sub('', content)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("App.tsx refactoring script executed.")
