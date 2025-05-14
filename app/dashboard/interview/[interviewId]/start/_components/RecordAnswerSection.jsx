"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/GeminiAIModel";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import moment from "moment";

function RecordAnswerSection({ mockInterviewQuestion, activeQuestionIndex, interviewData }) {
  const [userAnswer, setUserAnswer] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const {
    error,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  // Detect browser speech support
  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    if (!isSupported) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome.");
      setSpeechSupported(false);
    }
  }, []);

  // Collect results into answer
  useEffect(() => {
    results.map((result) => {
      setUserAnswer((prevAns) => prevAns + result?.transcript);
    });
  }, [results]);

  // Trigger AI feedback when user finishes speaking
  useEffect(() => {
    if (!isRecording && userAnswer.length > 10) {
      UpdateUserAnswer();
    }
  }, [userAnswer]);

  const StartStopRecording = async () => {
    if (!speechSupported) return;
    if (isRecording) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };

  const UpdateUserAnswer = async () => {
    try {
      setLoading(true);
      const currentQuestion = mockInterviewQuestion?.questions[activeQuestionIndex];

      const feedbackPrompt = `Question: ${currentQuestion.question}, 
                User Answer: ${userAnswer},
                Please give a rating (1-5) and feedback for this interview answer in JSON format like:
                {
                    "rating": 3,
                    "feedback": "feedback text here"
                }`;

      const result = await chatSession.sendMessage(feedbackPrompt);
      const rawText = await result.response.text();
      const mockJsonResp = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const JsonFeedbackResp = JSON.parse(mockJsonResp);

      const resp = await db.insert(UserAnswer).values({
        mockIdRef: interviewData?.mockId,
        question: currentQuestion.question,
        correctAns: currentQuestion.answer,
        userAns: userAnswer,
        feedback: JsonFeedbackResp.feedback,
        rating: JsonFeedbackResp.rating,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format("DD-MM-YYYY"),
      });

      if (resp) {
        toast("User Answer recorded successfully");
        setUserAnswer("");
        setResults([]);
      }
    } catch (error) {
      console.error("Error updating user answer:", error);
      toast.error("Failed to save answer. Please try again.");
    } finally {
      setLoading(false);
      setResults([]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-10">
      {/* Webcam Section */}
      <div className="relative flex flex-col justify-center items-center bg-gray-900 text-white rounded-xl shadow-xl p-6">
        <Image
          src={"/camera.png"}
          width={180}
          height={180}
          alt="WebCam"
          className="absolute opacity-40"
        />
        <Webcam
          mirrored={true}
          className="rounded-xl border-2 border-gray-500"
          style={{ height: 300, width: "100%", zIndex: 10 }}
        />
        {isRecording && (
          <div className="absolute top-2 right-2 flex items-center gap-2 text-red-500 animate-pulse">
            <span className="h-3 w-3 bg-red-500 rounded-full"></span>
            <span className="text-sm font-medium">Recording...</span>
          </div>
        )}
      </div>

      {/* Record Button or Warning */}
      {!speechSupported ? (
        <p className="text-red-600 mt-6 font-medium text-center">
          Your browser does not support speech recognition. Please use Google Chrome.
        </p>
      ) : (
        <Button
          disabled={loading}
          variant="outline"
          className="mt-6 px-6 py-3 text-lg font-semibold transition duration-300 ease-in-out transform hover:scale-105"
          onClick={StartStopRecording}
        >
          {isRecording ? (
            <span className="text-red-500 flex gap-2 items-center">
              <StopCircle className="h-6 w-6" /> Stop Recording
            </span>
          ) : (
            <span className="text-primary flex gap-2 items-center dark:text-white">
              <Mic className="h-6 w-6" /> Start Recording
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

export default RecordAnswerSection;
