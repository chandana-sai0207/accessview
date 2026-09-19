"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations/ui";
import { translateText } from "../utils/translate";

type Language = {
  code: string;
  name: string;
  speechCode: string;
};

type Speaker = "Person A" | "Person B";

type Message = {
  id: number;
  speaker: Speaker;
  originalText: string;
  translatedText: string;
  time: string;
};

const LANGUAGES: Language[] = [
  { code: "en", name: "English", speechCode: "en-US" },
  { code: "te", name: "తెలుగు", speechCode: "te-IN" },
  { code: "hi", name: "हिन्दी", speechCode: "hi-IN" },
  { code: "ta", name: "தமிழ்", speechCode: "ta-IN" },
  { code: "ml", name: "മലയാളം", speechCode: "ml-IN" },
  { code: "mr", name: "मराठी", speechCode: "mr-IN" },
  { code: "bn", name: "বাংলা", speechCode: "bn-IN" },
];

const STORAGE_KEY = "accessview-reminders";

export default function Conversation() {
  const { language } = useLanguage();

  const ui = translations[language] as Record<string, string>;

  const text = (key: string, fallback: string) => {
    return ui[key] ?? fallback;
  };

  /*
   * These are Conversation-only languages.
   * They are NOT connected to the global UI language.
   */
  const [spokenLanguage, setSpokenLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("te");
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>("Person A");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const spokenLanguageRef = useRef(spokenLanguage);
  const targetLanguageRef = useRef(targetLanguage);
  const currentSpeakerRef = useRef<Speaker>("Person A");

  useEffect(() => {
    spokenLanguageRef.current = spokenLanguage;
  }, [spokenLanguage]);

  useEffect(() => {
    targetLanguageRef.current = targetLanguage;
  }, [targetLanguage]);

  useEffect(() => {
    currentSpeakerRef.current = currentSpeaker;
  }, [currentSpeaker]);

  const getLanguage = (code: string) => {
    return LANGUAGES.find((item) => item.code === code);
  };

  const saveReminder = (message: string) => {
    const cleanText = message.trim();

    if (!cleanText) {
      return;
    }

    const existing = localStorage.getItem(STORAGE_KEY);

    let reminders: {
      id: number;
      text: string;
      createdAt: string;
    }[] = [];

    if (existing) {
      try {
        const parsed = JSON.parse(existing);

        if (Array.isArray(parsed)) {
          reminders = parsed;
        }
      } catch {
        reminders = [];
      }
    }

    reminders.push({
      id: Date.now(),
      text: cleanText,
      createdAt: new Date().toLocaleString(),
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));

    window.alert(
      text("reminderAdded", "Reminder added successfully.")
    );
  };

  const addMessage = async (messageText: string) => {
    const cleanText = messageText.trim();

    if (!cleanText) {
      return;
    }

    const from = spokenLanguageRef.current;
    const to = targetLanguageRef.current;
    const speaker = currentSpeakerRef.current;

    const translatedText = await translateText(cleanText, from, to);

    const newMessage: Message = {
      id: Date.now(),
      speaker,
      originalText: cleanText,
      translatedText,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((previous) => [...previous, newMessage]);

    /*
     * IMPORTANT:
     * We do NOT automatically switch speakers.
     *
     * The selected Person A / Person B button
     * remains active until the user changes it.
     */
  };

  const startListening = () => {
    setError("");

    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setError(
        text(
          "speechRecognitionUnsupported",
          "Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
        )
      );

      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.lang =
      getLanguage(spokenLanguageRef.current)?.speechCode || "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
    };

    recognition.onresult = async (event: any) => {
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        if (!result.isFinal) {
          continue;
        }

        const transcript = result?.[0]?.transcript || "";
        finalText += transcript;
      }

      if (finalText.trim()) {
        await addMessage(finalText.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Conversation speech error:", event);

      if (event.error === "not-allowed") {
        setError(
          text(
            "microphoneDenied",
            "Microphone permission was denied. Please allow microphone access."
          )
        );
      } else if (event.error === "no-speech") {
        setError(
          text(
            "noSpeech",
            "No speech was detected. Please try speaking again."
          )
        );
      } else if (event.error === "network") {
        setError(
          text(
            "speechNetworkError",
            "Network error occurred during speech recognition."
          )
        );
      } else {
        setError(
          text(
            "speechError",
            "Speech recognition encountered an error."
          )
        );
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch (restartError) {
          console.error("Could not restart recognition:", restartError);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    shouldListenRef.current = true;

    try {
      recognition.start();
    } catch (startError) {
      console.error("Unable to start recognition:", startError);

      shouldListenRef.current = false;
      setIsListening(false);

      setError(
        text("speechStartError", "Unable to start speech recognition.")
      );
    }
  };

  const stopListening = () => {
    shouldListenRef.current = false;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsListening(false);
  };

  const changeSpokenLanguage = (value: string) => {
    setSpokenLanguage(value);
    spokenLanguageRef.current = value;

    if (isListening) {
      stopListening();

      window.setTimeout(() => {
        startListening();
      }, 300);
    }
  };

  const changeTargetLanguage = (value: string) => {
    setTargetLanguage(value);
    targetLanguageRef.current = value;
  };

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;

      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return (
    <div className="conversation-feature">
      <div className="conversation-header">
        <div>
          <h1>{text("conversation", "Conversation")}</h1>

          <p>
            {text(
              "conversationSubtitle",
              "Person-to-person conversation"
            )}
          </p>
        </div>

        <div className="conversation-mode-control" aria-live="polite">
          {text("currentSpeaker", "Current speaker")}:{" "}
          <strong>{currentSpeaker}</strong>
        </div>
      </div>

      <div className="conversation-controls">
        <div className="language-control">
          <label htmlFor="conversation-spoken-language">
            {text("spokenLanguage", "Spoken Language")}
          </label>

          <select
            id="conversation-spoken-language"
            value={spokenLanguage}
            onChange={(event) => changeSpokenLanguage(event.target.value)}
          >
            {LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="language-control">
          <label htmlFor="conversation-target-language">
            {text("translationLanguage", "Translation Language")}
          </label>

          <select
            id="conversation-target-language"
            value={targetLanguage}
            onChange={(event) => changeTargetLanguage(event.target.value)}
          >
            {LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <button
          type="button"
          onClick={() => {
            currentSpeakerRef.current = "Person A";
            setCurrentSpeaker("Person A");
          }}
          aria-pressed={currentSpeaker === "Person A"}
          style={{
            padding: "12px 22px",
            borderRadius: "999px",
            border:
              currentSpeaker === "Person A"
                ? "2px solid #2563eb"
                : "1px solid #d1d5db",
            background:
              currentSpeaker === "Person A" ? "#2563eb" : "#ffffff",
            color: currentSpeaker === "Person A" ? "#ffffff" : "#111827",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Person A
        </button>

        <button
          type="button"
          onClick={() => {
            currentSpeakerRef.current = "Person B";
            setCurrentSpeaker("Person B");
          }}
          aria-pressed={currentSpeaker === "Person B"}
          style={{
            padding: "12px 22px",
            borderRadius: "999px",
            border:
              currentSpeaker === "Person B"
                ? "2px solid #16a34a"
                : "1px solid #d1d5db",
            background:
              currentSpeaker === "Person B" ? "#16a34a" : "#ffffff",
            color: currentSpeaker === "Person B" ? "#ffffff" : "#111827",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Person B
        </button>
      </div>

      {error && (
        <div className="conversation-error" role="alert">
          {error}
        </div>
      )}

      <div className="conversation-actions">
        {!isListening ? (
          <button
            type="button"
            onClick={startListening}
            className="conversation-start-button"
          >
            🎤 {text("startListening", "Start Listening")}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopListening}
            className="conversation-stop-button"
          >
            ⏹ {text("stopListening", "Stop Listening")}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            const latest = messages[messages.length - 1];

            if (latest) {
              saveReminder(latest.originalText);
            }
          }}
          disabled={messages.length === 0}
          className="conversation-reminder-button"
        >
          🔔 {text("saveReminder", "Save as Reminder")}
        </button>
      </div>

      <div
        style={{
          marginTop: "24px",
          minHeight: "420px",
          maxHeight: "620px",
          overflowY: "auto",
          padding: "24px",
          borderRadius: "18px",
          background: "#efeae2",
          border: "1px solid #d9d3ca",
        }}
        aria-live="polite"
        role="log"
      >
        {messages.length === 0 ? (
          <div
            style={{
              minHeight: "360px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "17px",
            }}
          >
            {text(
              "noConversation",
              "No messages yet. Select Person A or Person B and start speaking."
            )}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {messages.map((message) => {
              const isPersonA = message.speaker === "Person A";

              return (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    justifyContent: isPersonA ? "flex-start" : "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "min(78%, 600px)",
                      padding: "12px 16px",
                      borderRadius: isPersonA
                        ? "18px 18px 18px 4px"
                        : "18px 18px 4px 18px",
                      background: isPersonA ? "#ffffff" : "#d9fdd3",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      <strong
                        style={{
                          color: isPersonA ? "#2563eb" : "#15803d",
                          fontSize: "14px",
                        }}
                      >
                        {message.speaker}
                      </strong>

                      <span style={{ color: "#6b7280", fontSize: "12px" }}>
                        {message.time}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: "17px",
                        lineHeight: 1.5,
                        color: "#111827",
                        fontWeight: 600,
                      }}
                    >
                      {message.originalText}
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid rgba(107,114,128,0.2)",
                        fontSize: "15px",
                        lineHeight: 1.5,
                        color: "#374151",
                      }}
                    >
                      {message.translatedText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}