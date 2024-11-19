// app/components/DebateAssistant/index.jsx
"use client";

import React, { useState } from "react";
import { Upload, Mic, FileText, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DebateAssistant() {
  const [files, setFiles] = useState([]);
  const [fileUrls, setFileUrls] = useState([]); //public AWS file urls
  const [uploading, setUploading] = useState(false);
  const [userSpeech, setUserSpeech] = useState("");
  const [responseLoading, setResponseLoading] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleUpload = async () => {
    if (files.length === 0) {
      return;
    }
    setUploading(true);
    try {
      // get the presigned URL to then upload to s3
      const response = await fetch("/api/getUploadURL", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileNames: files.map((fileObj) => fileObj.name),
        }),
      });

      if (!response.ok) {
        throw new Error(`Reponse generation failed: ${response.statusText}`);
      }

      const { uploadUrls, fileUrls } = await response.json();
      console.log("upload urls", uploadUrls);
      console.log("file urls", fileUrls);

      // upload the file directly to s3
      const result = await Promise.all(
        uploadUrls.map((uploadUrl, index) =>
          fetch(uploadUrl, {
            method: "PUT",
            body: files[index],
            headers: {
              "Content-Type": "application/pdf",
            },
          })
        )
      );

      if (!result.every((res) => res.ok)) {
        throw new Error("Failed to upload all files succesfully ");
      }

      setFileUrls(fileUrls);
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
      setFiles([]);
    }
  };

  const handleFileChange = (event) => {
    console.log("Fired file change");
    console.log(files);
    const selectedFiles = Array.from(event.target.files);
    const newPDFFiles = selectedFiles.filter(
      (file) =>
        file.type == "application/pdf" &&
        !files.some((existingFile) => existingFile.name === file.name)
    );
    setFiles([...files, ...newPDFFiles]);

    event.target.value = "";
  };

  const handleDelete = (index) => {
    const newFiles = files.filter((_, idx) => idx != index);
    setFiles(newFiles);
  };

  const handleGenerateResponse = async () => {
    setResponseLoading(true);
    try {
      const response = await fetch("/api/crossex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userSpeech: userSpeech, fileUrls: fileUrls }),
      });

      if (!response.ok) {
        throw new Error(`Reponse generation failed: ${response.statusText}`);
      }
      const { crossExaminationText } = await response.json();
      console.log("Received response text", crossExaminationText);
      setGeneratedResponse(crossExaminationText);
    } catch (err) {
      print(err);
    } finally {
      setResponseLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto text-center mb-8">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          AI-Powered Debate Assistant
        </h1>
        <p className="text-xl text-muted-foreground">
          Upload cases and blocks and simulate a debate round
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
              onClick={handleUpload}
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
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="icon"
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic className="w-5 h-5" />
              </Button>
            </div>
            <Textarea
              className="min-h-[300px] resize-none mb-4"
              placeholder="Type or speak your argument here..."
              value={userSpeech}
              onChange={(e) => setUserSpeech(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleGenerateResponse}
              disabled={uploading}
            >
              Generate Cross Examination Questions
            </Button>
          </Card>

          {/* Right Panel */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cross Examination</h3>
            <div className="bg-muted p-4 rounded-lg min-h-[300px]">
              {generatedResponse ? (
                <p className="whitespace-pre-line">{generatedResponse}</p>
              ) : (
                <p className="text-muted-foreground text-center mt-8">
                  Cross examination questions will appear here after you submit
                  your case
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
