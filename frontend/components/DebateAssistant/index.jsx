// app/components/DebateAssistant/index.jsx
"use client";

import React, { useState } from 'react';
import { Upload, Mic, FileText, X } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DebateAssistant() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [userSpeech, setUserSpeech] = useState('');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateResponse = () => {
    setGeneratedResponse(
      "Based on your argument and the uploaded documents, here are some potential counter-points:\n\n" +
      "1. Your premise about economic impact might not consider long-term sustainability factors\n" +
      "2. Historical precedents suggest a different outcome than what you've proposed\n" +
      "3. Recent studies have shown contradicting evidence to your main points"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto text-center mb-8">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          AI-Powered Debate Assistant
        </h1>
        <p className="text-xl text-muted-foreground">
          Upload your research, speak your argument, get instant counter-points
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Upload Section */}
        <Card 
          className={`border-2 border-dashed rounded-lg ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted'
          }`}
        >
          <CardContent 
            className="p-8 text-center"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Drop your PDF documents here
            </h2>
            <p className="text-muted-foreground mb-4">
              or click to browse your files
            </p>
            <Button size="lg">Upload Files</Button>
          </CardContent>
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
            >
              Generate Counter-Arguments
            </Button>
          </Card>

          {/* Right Panel */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Counter-Arguments</h3>
            <div className="bg-muted p-4 rounded-lg min-h-[300px]">
              {generatedResponse ? (
                <p className="whitespace-pre-line">{generatedResponse}</p>
              ) : (
                <p className="text-muted-foreground text-center mt-8">
                  Counter-arguments will appear here after you submit your argument
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}