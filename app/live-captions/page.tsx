"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations/ui";
import { translateText } from "../utils/translate";

type Language = {
  code: string;
  name: string;
  speechCode: string;
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

export default function LiveCaptionsPage() {
  const { language } = useLanguage();

  const ui = translations[language] as Record<string, string>;

  const text = (key: string, fallback: string) => {
    return ui[key] ?? fallback;
  };

  const [spokenLanguage, setSpokenLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("te");
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [currentCaption, setCurrentCaption] = useState("");
  const [currentTranslation, setCurrentTranslation] = useState("");
  const [error, setError] = useState("");

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const spokenLanguageRef = useRef(spokenLanguage);
  const targetLanguageRef = useRef(targetLanguage);

  useEffect(() => {
    spokenLanguageRef.current = spokenLanguage;
  }, [spokenLanguage]);

  useEffect(() => {
    targetLanguageRef.current = targetLanguage;
  }, [targetLanguage]);

  const getLanguage = (code: string) => {
    return LANGUAGES.find((item) => item.code === code);
  };

  const saveReminder = () => {
    const reminderText = currentCaption.trim();

    if (!reminderText) {
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
      text: reminderText,
      createdAt: new Date().toLocaleString(),
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));

    window.alert(
      text("reminderAdded", "Reminder added successfully.")
    );
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
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript || "";

        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim.trim());

      if (finalText.trim()) {
        const cleanText = finalText.trim();

        setCurrentCaption(cleanText);

        const translated = await translateText(
          cleanText,
          spokenLanguageRef.current,
          targetLanguageRef.current
        );

        setCurrentTranslation(translated);
        setInterimText("");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event);

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

      setError(
        text("speechStartError", "Unable to start speech recognition.")
      );

      shouldListenRef.current = false;
      setIsListening(false);
    }
  };

  const stopListening = () => {
    shouldListenRef.current = false;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsListening(false);
    setInterimText("");
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

  const changeTargetLanguage = async (value: string) => {
    setTargetLanguage(value);
    targetLanguageRef.current = value;

    if (currentCaption.trim()) {
      const translated = await translateText(
        currentCaption,
        spokenLanguageRef.current,
        value
      );

      setCurrentTranslation(translated);
    }
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
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <Header />

        <section className="welcome-section">
          <div>
            <span className="eyebrow">
              {text("speechAccessibility", "SPEECH ACCESSIBILITY")}
            </span>

            <h2>{text("liveCaptions", "Live Captions")}</h2>

            <p>
              {text(
                "liveCaptionsDescription",
                "Convert spoken words into readable captions and translate them into your preferred language."
              )}
            </p>
          </div>

          <div className="status-pill">
            <span
              className={
                isListening ? "status-dot active" : "status-dot"
              }
            />

            {isListening
              ? text("listening", "Listening")
              : text("speechToText", "Speech to text")}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="conversation-feature">
            <div className="conversation-header">
              <div>
                <h1>{text("liveCaptions", "Live Captions")}</h1>

                <p>
                  {text(
                    "liveCaptionSubtitle",
                    "Listen to speech, display captions, and translate the current speech."
                  )}
                </p>
              </div>
            </div>

            <div className="conversation-controls">
              <div className="language-control">
                <label htmlFor="live-caption-spoken">
                  {text("spokenLanguage", "Spoken Language")}
                </label>

                <select
                  id="live-caption-spoken"
                  value={spokenLanguage}
                  onChange={(event) => {
                    changeSpokenLanguage(event.target.value);
                  }}
                >
                  {LANGUAGES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="language-control">
                <label htmlFor="live-caption-target">
                  {text("translationLanguage", "Translation Language")}
                </label>

                <select
                  id="live-caption-target"
                  value={targetLanguage}
                  onChange={(event) => {
                    changeTargetLanguage(event.target.value);
                  }}
                >
                  {LANGUAGES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="conversation-error" role="alert">
                {error}
              </div>
            )}

            <div className="conversation-main">
              <div className="conversation-live" aria-live="polite">
                <div className="conversation-card">
                  <h2>{text("liveCaption", "Live Caption")}</h2>

                  <div className="conversation-caption">
                    {interimText ||
                      currentCaption ||
                      text(
                        "startSpeaking",
                        "Start speaking to see captions..."
                      )}
                  </div>
                </div>

                <div className="conversation-card">
                  <h2>{text("translation", "Translation")}</h2>

                  <div className="conversation-translation">
                    {currentTranslation ||
                      text(
                        "translationWillAppear",
                        "Your translation will appear here."
                      )}
                  </div>
                </div>
              </div>

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
                  onClick={saveReminder}
                  disabled={!currentCaption.trim()}
                  className="conversation-reminder-button"
                >
                  🔔 {text("saveReminder", "Save as Reminder")}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}