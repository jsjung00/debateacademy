// app/components/DebateAssistant/index.jsx
"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Mic,
  FileText,
  X,
  Trash2,
  Loader2,
  VolumeX,
  Volume2,
  Pause,
  Play,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Markdown from "react-markdown";
import { splitText } from "@/lib/audio";
import { split } from "postcss/lib/list";

export default function DebateAssistant() {
  const [files, setFiles] = useState([]);
  const [fileDatas, setFileDatas] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [userSpeech, setUserSpeech] = useState("");
  const [cxResponseLoading, setCXResponseLoading] = useState(false);
  const [constructiveLoading, setConstructiveLoading] = useState(false);
  const [generatedCX, setGeneratedCX] = useState("");
  const [generatedConstructive, setGeneratedConstructive] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioExists, setAudioExists] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const [constructiveActiveTab, setConstructiveActiveTab] =
    useState("cross-examination");
  const currentAudioRef = useRef(null);

  class AudioChainPlayer {
    constructor(text, speed) {
      this.textChunks = splitText(text);
      this.speed = speed;
      this.currentChunkIndex = 0;
      this.currentAudio = null;
    }

    async start() {
      setAudioExists(true);
      await this.playNextChunk();
    }

    async playNextChunk() {
      // terminal case played all chunks
      if (this.currentChunkIndex >= this.textChunks.length) {
        return;
      }

      this.currentAudio = new Audio(
        `api/openTTS?input=${encodeURIComponent(
          this.textChunks[this.currentChunkIndex]
        )}&speed=${encodeURIComponent(this.speed)}`
      );

      this.currentAudio.addEventListener("ended", () => {
        this.currentChunkIndex++;
        this.playNextChunk();
      });

      this.currentAudio.addEventListener("error", (e) => {
        console.error("Error playing audio chunk", e);
        //skip to next chunk
        this.currentChunkIndex++;
        this.playNextChunk();
      });

      this.currentAudio.addEventListener("canplay", () => {
        this.currentAudio.play();
      });
    }

    pause() {
      if (this.currentAudio) {
        this.currentAudio.pause();
      }
    }

    resume() {
      if (this.currentAudio) {
        this.currentAudio.play();
      }
    }

    stop() {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentChunkIndex = this.textChunks.length;
      }
    }
  }

  const openTTS = async (text, speed = 1.0) => {
    if (!text) return;

    try {
      // stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.stop();
        currentAudioRef.current = null;
        setAudioExists(false);
      }

      const audioplayer = new AudioChainPlayer(text, 1.0);
      currentAudioRef.current = audioplayer;
      await audioplayer.start();
    } catch (error) {
      console.error("TTS error", error);
    }
  };

  const togglePause = () => {
    if (currentAudioRef.current) {
      if (isPaused === false) {
        currentAudioRef.current.pause();
      } else {
        currentAudioRef.current.resume();
      }
    }
    setIsPaused(!isPaused);
  };

  const handleUploadFiles = async () => {
    if (files.length === 0) {
      return;
    }

    setUploading(true);
    console.log("Sending these files: ", files);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("file[]", file));

      const response = await fetch("/api/uploadGemini", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("returned data", data);

      if (!response.ok) {
        throw new Error(
          `Failed with status ${response.status} and ${data.message}`
        );
      }
      setFileDatas(data.fileDatas);
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
      setFiles([]);
    }
  };

  const handleFileChange = (event) => {
    console.log("Fired file change");
    const selectedFiles = Array.from(event.target.files);
    const newPDFFiles = selectedFiles.filter(
      (file) =>
        file.type == "application/pdf" &&
        !files.some((existingFile) => existingFile.name === file.name)
    );
    setFiles([...files, ...newPDFFiles]);
    console.log("Updated files to", [...files, ...newPDFFiles]);

    event.target.value = "";
  };

  const handleDelete = (index) => {
    const newFiles = files.filter((_, idx) => idx != index);
    setFiles(newFiles);
  };

  const handleGenerateCXResponse = async () => {
    setCXResponseLoading(true);
    setConstructiveActiveTab("cross-examination");
    try {
      const response = await fetch("/api/crossex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userSpeech: userSpeech, fileDatas: fileDatas }),
      });

      if (!response.ok) {
        throw new Error(`Reponse generation failed: ${response.statusText}`);
      }
      const { crossExaminationText } = await response.json();
      console.log("Received response text", crossExaminationText);
      setGeneratedCX(crossExaminationText);
      await openTTS(crossExaminationText, 1.0);
    } catch (err) {
      console.log(err);
    } finally {
      setCXResponseLoading(false);
    }
  };

  const handleGenerateConstuctive = async () => {
    setConstructiveLoading(true);
    setConstructiveActiveTab("constructive");
    try {
      const response = await fetch("/api/constructive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userSpeech: userSpeech, fileDatas: fileDatas }),
      });

      if (!response.ok) {
        throw new Error(
          `Constructive generation failed: ${response.statusText}`
        );
      }
      const { constructiveText } = await response.json();
      setGeneratedConstructive(constructiveText);
      await openTTS(constructiveText, 1.1);
    } catch (err) {
      console.log(err);
    } finally {
      setConstructiveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto text-center mb-8">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          Debate Academy
        </h1>
        <p className="text-xl text-muted-foreground">
          Upload cases and blocks and simulate a debate round with AI
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Upload Section */}
        <Card className="w-full max-w-xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="border-2 border-dashed rounded-lg">
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Click to upload PDF documents here
                </h2>
              </label>
            </div>
            {files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 flex justify-between items-center"
                    >
                      <span>
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                      <button
                        onClick={() => handleDelete(index)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleUploadFiles}
              disabled={uploading || files.length === 0}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload Files"}
            </Button>
          </CardFooter>
        </Card>
        {/* Split Screen Interface */}
        <div className="grid md:grid-cols-2 gap-4 min-h-[400px]">
          {/* Left Panel */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Argument</h3>
              {/* 
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="icon"
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic className="w-5 h-5" />
              </Button>
              */}
            </div>
            <Textarea
              className="min-h-[300px] resize-none mb-4"
              placeholder="Type or speak your argument here..."
              value={userSpeech}
              onChange={(e) => setUserSpeech(e.target.value)}
            />
            <div className="space-y-2 mt-4">
              <Button
                className="w-full"
                onClick={handleGenerateCXResponse}
                disabled={uploading || cxResponseLoading}
              >
                {cxResponseLoading ? (
                  <Loader2 className="animate-spin"></Loader2>
                ) : (
                  <p>Generate Cross Examination Questions</p>
                )}
              </Button>
              <Button
                className="w-full"
                onClick={handleGenerateConstuctive}
                disabled={uploading || constructiveLoading}
              >
                {constructiveLoading ? (
                  <Loader2 className="animate-spin"></Loader2>
                ) : (
                  <p>Generate Counter Constructive</p>
                )}
              </Button>
              {audioExists && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePause}
                  className="mt-4"
                >
                  {isPaused ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </Card>

          {/* Right Panel- tabs for CX and counter speech */}
          <Card className="pt-6 h-full">
            <CardContent className="h-full">
              <Tabs
                value={constructiveActiveTab}
                onValueChange={setConstructiveActiveTab}
                className="w-full h-full flex flex-col"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cross-examination">
                    Cross Examination
                  </TabsTrigger>
                  <TabsTrigger value="constructive">Counter Speech</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="cross-examination"
                  className="mt-4 flex-grow"
                >
                  <div className="p-3 border rounded-lg h-full">
                    {generatedCX ? (
                      <p className="text-gray-600">
                        <Markdown>{generatedCX}</Markdown>
                      </p>
                    ) : (
                      <div className="text-gray-600">
                        <Markdown>
                          Cross examination questions will appear here after
                          generating...
                        </Markdown>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="constructive" className="mt-4 flex-grow">
                  <div className="p-3 border rounded-lg h-full">
                    {generatedConstructive ? (
                      <p className="text-gray-600">
                        <Markdown>{generatedConstructive}</Markdown>
                      </p>
                    ) : (
                      <p className="text-gray-600">
                        Counter constructive will appear here after
                        generating...
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
