import { useState } from "react";
import { StagedFile, DocumentItem } from "../types";

export function useStagedUpload(
  showNotice: (msg: string) => void,
  onUploadSuccess: (newDoc: DocumentItem, isExamQuestions: boolean, questionCount?: number) => void
) {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isStagingModalOpen, setIsStagingModalOpen] = useState(false);
  const [stagedDocTitle, setStagedDocTitle] = useState("");
  const [stagedGoal, setStagedGoal] = useState("");
  const [stagedCustomInstruction, setStagedCustomInstruction] = useState("");
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadStepIndex, setUploadStepIndex] = useState(0);
  const [uploadStepDetail, setUploadStepDetail] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);
    const staged: StagedFile[] = selected.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      name: f.name,
      size: f.size,
      ext: f.name.split(".").pop()?.toLowerCase() || "",
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined
    }));

    setStagedFiles((prev) => [...prev, ...staged]);
    setIsStagingModalOpen(true);
    e.target.value = "";
  };

  const handleRemoveStagedFile = (id: string) => {
    setStagedFiles((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (updated.length === 0) setIsStagingModalOpen(false);
      return updated;
    });
  };

  const handleProcessStagedFiles = async () => {
    if (stagedFiles.length === 0) return;
    setUploadProcessing(true);
    setUploadStepIndex(0);
    setUploadStepDetail("Mempersiapkan berkas...");

    try {
      const fileDataPromises = stagedFiles.map(
        (sf) =>
          new Promise<{ name: string; type: string; base64: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const base64 = res.split(",")[1] || "";
              resolve({ name: sf.name, type: sf.file.type, base64 });
            };
            reader.onerror = reject;
            reader.readAsDataURL(sf.file);
          })
      );

      const files = await fileDataPromises;
      setUploadStepIndex(1);
      setUploadStepDetail("Mengekstrak teks & menganalisis topik materi...");

      const payload = {
        title: stagedDocTitle.trim(),
        files,
        goal: stagedGoal,
        instruction: stagedCustomInstruction
      };

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.ok && data.document) {
        setUploadStepIndex(3);
        setUploadStepDetail("Selesai!");
        setIsStagingModalOpen(false);
        setStagedFiles([]);
        setStagedDocTitle("");
        setStagedGoal("");
        setStagedCustomInstruction("");

        onUploadSuccess(
          data.document,
          !!data.detectedExamQuestions,
          data.detectedQuestionCount
        );
      } else {
        showNotice(data.error || "Gagal memproses dokumen");
      }
    } catch (err: any) {
      showNotice("Terjadi kesalahan: " + err.message);
    } finally {
      setUploadProcessing(false);
    }
  };

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
    uploadProcessing,
    uploadStepIndex,
    uploadStepDetail,
    handleFileChange,
    handleRemoveStagedFile,
    handleProcessStagedFiles
  };
}
