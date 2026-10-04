import { useState, useCallback } from "react";
import { StagedFile } from "../types";

export interface UseUploadStagingProps {
  fetchDocuments: () => Promise<void>;
  loadDocument: (id: string) => Promise<void>;
  setActiveTab: (tab: any) => void;
  setQuizQuestions: (questions: any[]) => void;
  setCurrentQuestionIndex: (idx: number) => void;
  setUserAnswers: (ans: any) => void;
  setExamSubmitted: (sub: boolean) => void;
  showNotice: (msg: string) => void;
}

export function useUploadStaging({
  fetchDocuments,
  loadDocument,
  setActiveTab,
  setQuizQuestions,
  setCurrentQuestionIndex,
  setUserAnswers,
  setExamSubmitted,
  showNotice
}: UseUploadStagingProps) {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isStagingModalOpen, setIsStagingModalOpen] = useState(false);
  const [stagedDocTitle, setStagedDocTitle] = useState("");
  const [stagedGoal, setStagedGoal] = useState<string>("theory");
  const [stagedCustomInstruction, setStagedCustomInstruction] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleStageFiles = useCallback((filesInput: FileList | File[] | File) => {
    let files: File[] = [];
    if (filesInput instanceof File) files = [filesInput];
    else files = Array.from(filesInput);

    if (files.length === 0) return;

    const newItems: StagedFile[] = files.map((f) => {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      const isImg = ["png", "jpg", "jpeg", "webp", "bmp"].includes(ext);
      return {
        id: "staged_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        file: f,
        name: f.name,
        size: f.size,
        ext,
        previewUrl: isImg ? URL.createObjectURL(f) : undefined
      };
    });

    setStagedFiles((prev) => {
      // Deduplicate against existing staged files (by name, size, lastModified)
      const existingKeys = new Set(
        prev.map((item) => `${item.file.name}_${item.file.size}_${item.file.lastModified}`)
      );

      const uniqueNewItems: StagedFile[] = [];
      for (const item of newItems) {
        const key = `${item.file.name}_${item.file.size}_${item.file.lastModified}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          uniqueNewItems.push(item);
        } else {
          // Cleanup unused preview URL object if duplicate
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        }
      }

      if (uniqueNewItems.length === 0) {
        return prev;
      }

      const combined = [...prev, ...uniqueNewItems];
      if (!stagedDocTitle && combined.length > 0) {
        const cleanName = combined[0].name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
        setStagedDocTitle(cleanName);
      }
      return combined;
    });

    setIsStagingModalOpen(true);
  }, [stagedDocTitle]);

  const handleRemoveStagedFile = useCallback((id: string) => {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const remaining = prev.filter((item) => item.id !== id);
      if (remaining.length === 0) {
        setIsStagingModalOpen(false);
        setStagedDocTitle("");
      }
      return remaining;
    });
  }, []);

  const handleCancelStaging = useCallback(() => {
    stagedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setStagedFiles([]);
    setIsStagingModalOpen(false);
    setStagedDocTitle("");
    setUploadError("");
  }, [stagedFiles]);

  const handleConfirmStagedUpload = useCallback(async () => {
    if (stagedFiles.length === 0) return;
    setIsUploading(true);
    setUploadError("");

    try {
      const filesPayload = await Promise.all(
        stagedFiles.map((item) => {
          return new Promise<{ fileName: string; fileData: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64Data = (reader.result as string).split(",")[1];
              resolve({ fileName: item.name, fileData: base64Data });
            };
            reader.onerror = () => reject(new Error(`Gagal membaca ${item.name}`));
            reader.readAsDataURL(item.file);
          });
        })
      );

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: filesPayload,
          goal: stagedGoal,
          instruction: stagedCustomInstruction.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.isExamSheet && data.questionCount > 0) {
          showNotice(`📋 Terdeteksi ${data.questionCount} Soal Kisi-Kisi! Materi teori berhasil disusun & soal siap dikerjakan.`);
          if (data.detectedQuestions && data.detectedQuestions.length > 0) {
            setQuizQuestions(data.detectedQuestions);
            setCurrentQuestionIndex(0);
            setUserAnswers({});
            setExamSubmitted(false);
          }
        } else {
          showNotice(`Materi "${data.title}" berhasil dibuat dan siap dipelajari!`);
        }
        await fetchDocuments();
        if (data.id) {
          await loadDocument(data.id);
        }
        handleCancelStaging();
        setActiveTab("material");
      } else {
        setUploadError(data.error || "Gagal memproses berkas dokumen");
      }
    } catch (err: any) {
      setUploadError("Gagal mengunggah berkas: " + err.message);
    } finally {
      setIsUploading(false);
    }
  }, [
    stagedFiles,
    stagedDocTitle,
    stagedGoal,
    stagedCustomInstruction,
    fetchDocuments,
    loadDocument,
    handleCancelStaging,
    setActiveTab,
    setQuizQuestions,
    setCurrentQuestionIndex,
    setUserAnswers,
    setExamSubmitted,
    showNotice
  ]);

  return {
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
  };
}
