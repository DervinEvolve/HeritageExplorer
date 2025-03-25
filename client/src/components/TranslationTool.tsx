import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { askPerplexity } from "@/lib/perplexity";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { extractTextFromPDF, readTextFile } from "@/lib/fileProcessing";

const LANGUAGES = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
];

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

export function TranslationTool() {
  const [sourceText, setSourceText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [translation, setTranslation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [processingStep, setProcessingStep] = useState<"idle" | "uploading" | "detecting" | "translating">("idle");
  const [isDocumentLoaded, setIsDocumentLoaded] = useState(false);

  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const supportedTypes = [
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf'
    ];

    if (!supportedTypes.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload a text document or PDF.');
    }
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setProcessingStep("uploading");
    setError(null);
    setUploadProgress(0);
    setSourceText("");
    setDetectedLanguage(null);
    setTranslation("");
    setIsDocumentLoaded(false);

    try {
      const file = files[0];
      validateFile(file);

      let text: string;
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        text = await readTextFile(file, (progress) => {
          setUploadProgress(progress);
        });
      }

      if (!text.trim()) {
        throw new Error('The document appears to be empty or could not be read properly.');
      }

      setSourceText(text);
      setIsDocumentLoaded(true);

      // Reset the file input
      e.target.value = '';

      setProcessingStep("detecting");
      const sampleText = text.substring(0, 500);
      const detectQuery = `What language is this text written in? Please respond with just the language name: ${sampleText}`;
      const detectResponse = await askPerplexity(detectQuery);
      setDetectedLanguage(detectResponse.content.split('\n')[0].trim());
    } catch (error) {
      console.error('File processing error:', error);
      setError(error instanceof Error ? error.message : "Failed to process file");
      setSourceText("");
      setDetectedLanguage(null);
      setIsDocumentLoaded(false);
    } finally {
      setUploadProgress(null);
      setProcessingStep("idle");
    }
  };

  const handleTranslate = async () => {
    if (!sourceText || !targetLanguage || processingStep !== "idle") return;

    setProcessingStep("translating");
    setError(null);
    try {
      const query = `Translate the following text to ${targetLanguage}. Maintain the original formatting and structure. Here's the text to translate:\n\n${sourceText}`;
      const response = await askPerplexity(query);
      setTranslation(response.content);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Translation failed");
    } finally {
      setProcessingStep("idle");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Translation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full gap-4">
          <Label htmlFor="file">Upload Document</Label>
          <Input
            id="file"
            type="file"
            accept=".txt,.doc,.docx,.pdf"
            onChange={handleFilesChange}
            disabled={processingStep !== "idle"}
            className="cursor-pointer"
          />
          <div className="text-sm text-muted-foreground">
            Supported formats: TXT, DOC, DOCX, PDF (max {MAX_FILE_SIZE / 1024 / 1024}MB)
          </div>
          {uploadProgress !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full bg-secondary rounded-full h-2.5 overflow-hidden"
            >
              <motion.div
                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </motion.div>
          )}
        </div>

        {processingStep !== "idle" && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              {processingStep === "uploading" && "Processing document..."}
              {processingStep === "detecting" && "Detecting language..."}
              {processingStep === "translating" && "Translating content..."}
            </span>
          </div>
        )}

        <div className="grid gap-2">
          <Label>Text to Translate</Label>
          <Textarea
            placeholder="Enter text to translate or upload a document..."
            value={sourceText}
            onChange={(e) => {
              setSourceText(e.target.value);
              setIsDocumentLoaded(true);
            }}
            className="min-h-[150px]"
            disabled={processingStep !== "idle"}
          />
          {detectedLanguage && (
            <div className="text-sm text-muted-foreground">
              Detected language: {detectedLanguage}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Select
            value={targetLanguage}
            onValueChange={setTargetLanguage}
            disabled={processingStep !== "idle" || !isDocumentLoaded}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select target language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.name}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleTranslate}
            disabled={processingStep !== "idle" || !isDocumentLoaded || !targetLanguage}
          >
            {processingStep === "translating" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              "Translate"
            )}
          </Button>
        </div>

        {translation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h3 className="text-sm font-medium">Translation</h3>
            <div className="rounded-md bg-muted p-4">
              <pre className="whitespace-pre-wrap">{translation}</pre>
            </div>
          </motion.div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}