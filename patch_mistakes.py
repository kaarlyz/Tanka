import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace states
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

# Remove functions exactly
func_regex = re.compile(r'  async function fetchMistakes\(\) \{.*?\n  \}\n\n  function startMistakeDrill\(\) \{', re.DOTALL)
content = func_regex.sub('  function startMistakeDrill() {', content)

with open("src/App.tsx", "w") as f:
    f.write(content)
