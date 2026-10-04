import { useState, useCallback } from "react";
import { FormulaItem } from "../types";

export interface UseFormulasProps {
  activeDocId: string | null;
  selectedModel: string;
  showNotice: (msg: string) => void;
}

export function useFormulas({ activeDocId, selectedModel, showNotice }: UseFormulasProps) {
  const [isFormulaDrawerOpen, setIsFormulaDrawerOpen] = useState(false);
  const [formulas, setFormulas] = useState<FormulaItem[]>([]);
  const [isLoadingFormulas, setIsLoadingFormulas] = useState(false);
  const [formulaFilter, setFormulaFilter] = useState("");

  const fetchOrExtractFormulas = useCallback(async () => {
    if (!activeDocId) {
      showNotice("Pilih materi terlebih dahulu");
      return;
    }
    setIsFormulaDrawerOpen(true);
    setIsLoadingFormulas(true);
    try {
      const res = await fetch(`/api/documents/${activeDocId}/formulas`);
      const data = await res.json();
      if (data.success && data.formulas && data.formulas.length > 0) {
        setFormulas(data.formulas);
      } else {
        const aiRes = await fetch("/api/ai/extract-formulas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docId: activeDocId, model: selectedModel })
        });
        const aiData = await aiRes.json();
        if (aiData.success && aiData.formulas) {
          setFormulas(aiData.formulas);
        }
      }
    } catch (e) {
      console.error("Failed to load formulas:", e);
    } finally {
      setIsLoadingFormulas(false);
    }
  }, [activeDocId, selectedModel, showNotice]);

  return {
    isFormulaDrawerOpen,
    setIsFormulaDrawerOpen,
    formulas,
    setFormulas,
    isLoadingFormulas,
    formulaFilter,
    setFormulaFilter,
    fetchOrExtractFormulas
  };
}
