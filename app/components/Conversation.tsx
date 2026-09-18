"use client";

import { useEffect, useRef, useState } from "react";

type Language = {
  code: string;
  name: string;
  speechCode: string;
};

type Caption = {
  id: number;
  speaker: "Person A" | "Person B";
  originalText: string;
  translatedText: string;
  time: string;
};

const LANGUAGES: Language[] = [
  {
    code: "en",
    name: "English",
    speechCode: "en-US",
  },
  {
    code: "te",
    name: "తెలుగు",
    speechCode: "te-IN",
  },
  {
    code: "hi",
    name: "हिन्दी",
    speechCode: "hi-IN",
  },
  {
    code: "ta",
    name: "தமிழ்",
    speechCode: "ta-IN",
  },
  {
    code: "ml",
    name: "മലയാളം",
    speechCode: "ml-IN",
  },
  {
    code: "mr",
    name: "मराठी",
    speechCode: "mr-IN",
  },
  {
    code: "bn",
    name: "বাংলা",
    speechCode: "bn-IN",
  },
];

const STORAGE_KEY = "accessview-reminders";

export default function Conversation() {
  const [spokenLanguage, setSpokenLanguage] =
    useState("en");

  const [targetLanguage, setTargetLanguage] =
    useState("te");

  const [isListening, setIsListening] =
    useState(false);

  const [interimText, setInterimText] =
    useState("");

  const [currentCaption, setCurrentCaption] =
    useState("");

  const [currentTranslation, setCurrentTranslation] =
    useState("");

  const [captions, setCaptions] =
    useState<Caption[]>([]);

  const [conversationMode, setConversationMode] =
    useState(false);

  const [currentSpeaker, setCurrentSpeaker] =
    useState<"Person A" | "Person B">(
      "Person A"
    );

  const [error, setError] =
    useState("");

  const recognitionRef =
    useRef<any>(null);

  const shouldListenRef =
    useRef(false);

  const spokenLanguageRef =
    useRef(spokenLanguage);

  const targetLanguageRef =
    useRef(targetLanguage);

  const currentSpeakerRef =
    useRef<"Person A" | "Person B">(
      currentSpeaker
    );

  useEffect(() => {
    spokenLanguageRef.current =
      spokenLanguage;
  }, [spokenLanguage]);

  useEffect(() => {
    targetLanguageRef.current =
      targetLanguage;
  }, [targetLanguage]);

  useEffect(() => {
    currentSpeakerRef.current =
      currentSpeaker;
  }, [currentSpeaker]);

  const getLanguage = (
    code: string
  ) => {
    return LANGUAGES.find(
      (language) =>
        language.code === code
    );
  };

  const translateText = async (
    text: string,
    from: string,
    to: string
  ) => {
    if (!text.trim()) {
      return "";
    }

    if (from === to) {
      return text;
    }

    try {
      const response =
        await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
            text
          )}&langpair=${from}|${to}`
        );

      const data =
        await response.json();

      return (
        data?.responseData
          ?.translatedText || text
      );
    } catch (translationError) {
      console.error(
        "Translation error:",
        translationError
      );

      return text;
    }
  };

  const saveReminder = (
    text: string
  ) => {
    if (!text.trim()) {
      return;
    }

    const existing =
      localStorage.getItem(
        STORAGE_KEY
      );

    let reminders: {
      id: number;
      text: string;
      createdAt: string;
    }[] = [];

    if (existing) {
      try {
        const parsed =
          JSON.parse(existing);

        if (Array.isArray(parsed)) {
          reminders = parsed;
        }
      } catch {
        reminders = [];
      }
    }

    reminders.push({
      id: Date.now(),
      text,
      createdAt:
        new Date().toLocaleString(),
    });

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(reminders)
    );
  };

  const addCaption = async (
    text: string
  ) => {
    if (!text.trim()) {
      return;
    }

    const from =
      spokenLanguageRef.current;

    const to =
      targetLanguageRef.current;

    const translated =
      await translateText(
        text,
        from,
        to
      );

    const newCaption: Caption = {
      id: Date.now(),

      speaker:
        currentSpeakerRef.current,

      originalText: text,

      translatedText: translated,

      time: new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
    };

    setCaptions(
      (previous) => [
        newCaption,
        ...previous,
      ]
    );

    setCurrentCaption(text);

    setCurrentTranslation(
      translated
    );
  };

  const startListening = () => {
    setError("");

    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any)
            .SpeechRecognition ||
          (window as any)
            .webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.lang =
      spokenLanguageRef.current ===
      "en"
        ? "en-US"
        : getLanguage(
            spokenLanguageRef.current
          )?.speechCode ||
          "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (
      event: any
    ) => {
      let interim = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript =
          event.results[i][0]
            .transcript;

        if (
          event.results[i].isFinal
        ) {
          await addCaption(
            transcript.trim()
          );
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim);
    };

    recognition.onerror = (
      event: any
    ) => {
      console.error(
        "Speech recognition error:",
        event
      );

      if (
        event.error ===
        "not-allowed"
      ) {
        setError(
          "Microphone permission was denied. Please allow microphone access."
        );
      } else {
        setError(
          "Speech recognition encountered an error."
        );
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      if (
        shouldListenRef.current
      ) {
        try {
          recognition.start();
        } catch {
          // Recognition may already be restarting.
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current =
      recognition;

    shouldListenRef.current =
      true;

    try {
      recognition.start();
    } catch (recognitionError) {
      console.error(
        recognitionError
      );

      setError(
        "Unable to start speech recognition."
      );

      shouldListenRef.current =
        false;

      setIsListening(false);
    }
  };

  const stopListening = () => {
    shouldListenRef.current =
      false;

    if (
      recognitionRef.current
    ) {
      recognitionRef.current.stop();

      recognitionRef.current =
        null;
    }

    setIsListening(false);

    setInterimText("");
  };

  const switchSpeaker = () => {
    setCurrentSpeaker(
      (current) =>
        current === "Person A"
          ? "Person B"
          : "Person A"
    );
  };

  const handleSpokenLanguageChange = (
    value: string
  ) => {
    setSpokenLanguage(value);

    if (isListening) {
      stopListening();

      setTimeout(() => {
        startListening();
      }, 300);
    }
  };

  const handleTargetLanguageChange = async (
    value: string
  ) => {
    setTargetLanguage(value);

    if (currentCaption) {
      const translated =
        await translateText(
          currentCaption,
          spokenLanguageRef.current,
          value
        );

      setCurrentTranslation(
        translated
      );
    }
  };

  useEffect(() => {
    return () => {
      shouldListenRef.current =
        false;

      if (
        recognitionRef.current
      ) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="conversation-feature">
      <div className="conversation-controls">
        <div className="language-control">
          <label htmlFor="spoken-language">
            Spoken Language
          </label>

          <select
            id="spoken-language"
            value={spokenLanguage}
            onChange={(event) =>
              handleSpokenLanguageChange(
                event.target.value
              )
            }
          >
            {LANGUAGES.map(
              (language) => (
                <option
                  key={language.code}
                  value={language.code}
                >
                  {language.name}
                </option>
              )
            )}
          </select>
        </div>

        <div className="language-control">
          <label htmlFor="target-language">
            Translate To
          </label>

          <select
            id="target-language"
            value={targetLanguage}
            onChange={(event) =>
              handleTargetLanguageChange(
                event.target.value
              )
            }
          >
            {LANGUAGES.map(
              (language) => (
                <option
                  key={language.code}
                  value={language.code}
                >
                  {language.name}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div className="conversation-mode-panel">
        <div>
          <span className="eyebrow">
            CONVERSATION MODE
          </span>

          <h3>
            Two-Person Conversation
          </h3>

          <p>
            Switch between Person A and
            Person B while capturing speech.
          </p>
        </div>

        <div className="conversation-mode-actions">
          <button
            type="button"
            className={
              conversationMode
                ? "primary-button"
                : "secondary-button"
            }
            onClick={() =>
              setConversationMode(
                (current) =>
                  !current
              )
            }
          >
            {conversationMode
              ? "Conversation Mode On"
              : "Enable Conversation Mode"}
          </button>

          {conversationMode && (
            <button
              type="button"
              className="secondary-button"
              onClick={switchSpeaker}
            >
              Switch to{" "}
              {currentSpeaker ===
              "Person A"
                ? "Person B"
                : "Person A"}
            </button>
          )}
        </div>
      </div>

      {conversationMode && (
        <div className="speaker-status">
          <div>
            <span className="speaker-label">
              CURRENT SPEAKER
            </span>

            <strong>
              {currentSpeaker}
            </strong>
          </div>

          <div>
            <span className="speaker-label">
              PEOPLE SPEAKING
            </span>

            <strong>2</strong>
          </div>
        </div>
      )}

      <div className="caption-display">
        <div className="caption-header">
          <span className="eyebrow">
            LIVE CAPTIONS
          </span>

          <span
            className={`listening-status ${
              isListening
                ? "active"
                : ""
            }`}
          >
            <span className="status-dot" />

            {isListening
              ? "Listening"
              : "Not listening"}
          </span>
        </div>

        {currentCaption ||
        interimText ? (
          <>
            {conversationMode && (
              <div className="caption-speaker">
                {currentSpeaker}
              </div>
            )}

            <div className="large-caption">
              {currentCaption}

              {interimText && (
                <span className="interim-caption">
                  {" "}
                  {interimText}
                </span>
              )}
            </div>

            {currentTranslation && (
              <div className="translation-caption">
                {currentTranslation}
              </div>
            )}

            {currentCaption && (
              <button
                type="button"
                className="reminder-button"
                onClick={() =>
                  saveReminder(
                    currentTranslation ||
                      currentCaption
                  )
                }
              >
                🔔 Reminder
              </button>
            )}
          </>
        ) : (
          <div className="caption-placeholder">
            <div className="caption-placeholder-icon">
              CC
            </div>

            <h3>
              Your live captions will
              appear here
            </h3>

            <p>
              Start listening and speak
              into the microphone.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="conversation-actions">
        {!isListening ? (
          <button
            type="button"
            className="primary-button"
            onClick={
              startListening
            }
          >
            🎙 Start Listening
          </button>
        ) : (
          <button
            type="button"
            className="secondary-button"
            onClick={
              stopListening
            }
          >
            ⏹ Stop Listening
          </button>
        )}
      </div>

      {captions.length > 0 && (
        <div className="caption-history">
          <div className="caption-history-header">
            <div>
              <span className="eyebrow">
                CONVERSATION HISTORY
              </span>

              <h3>
                Previous Captions
              </h3>
            </div>
          </div>

          <div className="caption-history-list">
            {captions.map(
              (caption) => (
                <article
                  key={caption.id}
                  className="caption-history-item"
                >
                  <div className="history-top">
                    <strong>
                      {conversationMode
                        ? caption.speaker
                        : "Speaker"}
                    </strong>

                    <span>
                      {caption.time}
                    </span>
                  </div>

                  <p className="history-original">
                    {caption.originalText}
                  </p>

                  {caption.translatedText && (
                    <p className="history-translation">
                      {caption.translatedText}
                    </p>
                  )}
                </article>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}