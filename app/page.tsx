"use client";

import { useEffect, useRef, useState } from "react";
import {
  AudioClassifier,
  FilesetResolver,
} from "@mediapipe/tasks-audio";

type Reminder = {
  id: number;
  text: string;
  translatedText: string;
  time: string;
};

type Caption = {
  id: number;
  original: string;
  translated: string;
  speaker: "Person A" | "Person B";
};

type SpeechRecognitionResultLike = {
  [index: number]: {
    transcript: string;
  };
  isFinal: boolean;
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    [index: number]: SpeechRecognitionResultLike;
    length: number;
  };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export default function Home() {
  // -----------------------------------
  // SPEECH STATES
  // -----------------------------------

  const [isListening, setIsListening] =
    useState(false);

  const [spokenLanguage, setSpokenLanguage] =
    useState("English");

  const [targetLanguage, setTargetLanguage] =
    useState("English");

  const [caption, setCaption] = useState(
    "Press Start Listening and begin speaking..."
  );

  const [translatedText, setTranslatedText] =
    useState("Your translation will appear here.");

  const [captions, setCaptions] =
    useState<Caption[]>([]);

  const [currentSpeaker, setCurrentSpeaker] =
    useState<"Person A" | "Person B">("Person A");

  const recognitionRef =
    useRef<SpeechRecognitionLike | null>(null);

  // -----------------------------------
  // REMINDERS
  // -----------------------------------

  const [reminders, setReminders] =
    useState<Reminder[]>([]);

  // -----------------------------------
  // ACCESSIBILITY
  // -----------------------------------

  const [fontSize, setFontSize] =
    useState(24);

  const [highContrast, setHighContrast] =
    useState(false);

  const [darkMode, setDarkMode] =
    useState(false);

  // -----------------------------------
  // CONVERSATION
  // -----------------------------------

  const [conversationMode, setConversationMode] =
    useState(false);

  // -----------------------------------
  // SOUND DETECTION
  // -----------------------------------

  const [soundAlert, setSoundAlert] =
    useState("No important sound detected");

  const [soundConfidence, setSoundConfidence] =
    useState<number | null>(null);

  const [soundListening, setSoundListening] =
    useState(false);

  const audioClassifierRef =
    useRef<AudioClassifier | null>(null);

  const audioContextRef =
    useRef<AudioContext | null>(null);

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const processorRef =
    useRef<ScriptProcessorNode | null>(null);

  // Audio buffer for approximately 1 second
  const audioBufferRef =
    useRef<Float32Array[]>([]);

  const audioSamplesRef =
    useRef(0);

  // Prevent the same sound from being
  // repeatedly displayed every few milliseconds
  const lastSoundRef =
    useRef("");

  const lastSoundTimeRef =
    useRef(0);

  // -----------------------------------
  // LOAD REMINDERS
  // -----------------------------------

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "accessview-reminders"
        );

      if (saved) {
        setReminders(JSON.parse(saved));
      }
    } catch {
      console.log(
        "Could not load reminders"
      );
    }
  }, []);

  // -----------------------------------
  // SAVE REMINDERS
  // -----------------------------------

  useEffect(() => {
    try {
      localStorage.setItem(
        "accessview-reminders",
        JSON.stringify(reminders)
      );
    } catch {
      console.log(
        "Could not save reminders"
      );
    }
  }, [reminders]);

  // -----------------------------------
  // LANGUAGE CODES
  // -----------------------------------

  const getSpeechLanguage = (
    language: string
  ) => {
    const languages: Record<string, string> = {
      English: "en-US",
      Telugu: "te-IN",
      Hindi: "hi-IN",
      Tamil: "ta-IN",
      Kannada: "kn-IN",
      Malayalam: "ml-IN",
      Bengali: "bn-IN",
      Marathi: "mr-IN",
      Gujarati: "gu-IN",
      Punjabi: "pa-IN",
      Urdu: "ur-IN",
    };

    return (
      languages[language] || "en-US"
    );
  };

  // -----------------------------------
  // TRANSLATION
  // -----------------------------------

  const translateText = async (
    text: string,
    fromLanguage: string,
    toLanguage: string
  ) => {
    if (!text.trim()) {
      return "";
    }

    // If both languages are same,
    // no translation is required.
    if (fromLanguage === toLanguage) {
      return text;
    }

    const languageCodes: Record<string, string> = {
      English: "en",
      Telugu: "te",
      Hindi: "hi",
      Tamil: "ta",
      Kannada: "kn",
      Malayalam: "ml",
      Bengali: "bn",
      Marathi: "mr",
      Gujarati: "gu",
      Punjabi: "pa",
      Urdu: "ur",
    };

    const fromCode =
      languageCodes[fromLanguage] || "en";

    const toCode =
      languageCodes[toLanguage] || "en";

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=${fromCode}|${toCode}`
      );

      if (!response.ok) {
        return "Translation unavailable";
      }

      const data = await response.json();

      const result =
        data?.responseData?.translatedText;

      if (
        result &&
        typeof result === "string"
      ) {
        return result;
      }

      return "Translation unavailable";
    } catch {
      return "Translation unavailable";
    }
  };

  // -----------------------------------
  // START SPEECH RECOGNITION
  // -----------------------------------

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech Recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.lang =
      getSpeechLanguage(
        spokenLanguage
      );

    recognition.onstart = () => {
      setIsListening(true);
      setCaption("Listening...");
      setTranslatedText(
        "Your translation will appear here."
      );
    };

    recognition.onresult = async (
      event
    ) => {
      let interimText = "";
      let finalText = "";

      // IMPORTANT:
      // Only process the changed results.
      // This prevents duplicate text and
      // incorrect repeated translations.
      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result =
          event.results[i];

        const text =
          result[0]?.transcript || "";

        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      // Show live speech immediately.
      if (interimText.trim()) {
        setCaption(
          interimText.trim()
        );
      }

      // Translate only completed speech.
      // This gives a much cleaner translation.
      if (finalText.trim()) {
        const cleanText =
          finalText.trim();

        setCaption(cleanText);

        const translated =
          await translateText(
            cleanText,
            spokenLanguage,
            targetLanguage
          );

        setTranslatedText(
          translated
        );

        const newCaption: Caption = {
          id: Date.now(),
          original: cleanText,
          translated,
          speaker: currentSpeaker,
        };

        setCaptions(
          (previous) => [
            ...previous,
            newCaption,
          ].slice(-20)
        );
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current =
      recognition;

    try {
      recognition.start();
    } catch (error) {
      console.log(
        "Speech recognition:",
        error
      );
    }
  };

  // -----------------------------------
  // STOP SPEECH
  // -----------------------------------

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    setIsListening(false);
  };

  // -----------------------------------
  // CHANGE SPOKEN LANGUAGE
  // -----------------------------------

  const changeSpokenLanguage = (
    language: string
  ) => {
    setSpokenLanguage(language);

    if (isListening) {
      stopListening();

      setTimeout(() => {
        startListening();
      }, 300);
    }
  };

  // -----------------------------------
  // CHANGE TARGET LANGUAGE
  // -----------------------------------

  const changeTargetLanguage =
    async (
      language: string
    ) => {
      setTargetLanguage(language);

      // Immediately translate the current
      // caption into the newly selected language.
      if (
        caption &&
        caption !==
          "Press Start Listening and begin speaking..." &&
        caption !== "Listening..."
      ) {
        const translated =
          await translateText(
            caption,
            spokenLanguage,
            language
          );

        setTranslatedText(
          translated
        );
      }
    };

  // -----------------------------------
  // SAVE CAPTION AS REMINDER
  // -----------------------------------

  const saveCaptionAsReminder = (
    original: string,
    translated: string
  ) => {
    if (!original.trim()) {
      return;
    }

    const newReminder: Reminder = {
      id: Date.now(),
      text: original,
      translatedText:
        translated,
      time: new Date().toLocaleString(),
    };

    setReminders(
      (previous) => [
        ...previous,
        newReminder,
      ]
    );
  };

  // -----------------------------------
  // DELETE REMINDER
  // -----------------------------------

  const deleteReminder = (
    id: number
  ) => {
    setReminders(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !== id
        )
    );
  };

  // -----------------------------------
  // SWITCH SPEAKER
  // -----------------------------------

  const switchSpeaker = () => {
    setCurrentSpeaker(
      (previous) =>
        previous === "Person A"
          ? "Person B"
          : "Person A"
    );
  };

  // -----------------------------------
  // SPEAKER COUNT
  // -----------------------------------

  const speakerCount =
    conversationMode ? 2 : 1;

  // -----------------------------------
  // INITIALIZE SOUND CLASSIFIER
  // -----------------------------------

  const initializeSoundClassifier =
    async () => {
      if (
        audioClassifierRef.current
      ) {
        return audioClassifierRef.current;
      }

      try {
        const audio =
          await FilesetResolver.forAudioTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio/wasm"
          );

        const classifier =
          await AudioClassifier.createFromOptions(
            audio,
            {
              baseOptions: {
                modelAssetPath:
                  "https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite",
              },

              // We only need the best
              // sound classification.
              maxResults: 1,

              scoreThreshold: 0.35,
            }
          );

        audioClassifierRef.current =
          classifier;

        return classifier;
      } catch (error) {
        console.error(
          "MediaPipe error:",
          error
        );

        return null;
      }
    };

  // -----------------------------------
  // SOUND CLASSIFICATION
  // -----------------------------------

  const classifyAudio = (
    input: Float32Array,
    sampleRate: number
  ) => {
    if (
      !audioClassifierRef.current
    ) {
      return;
    }

    try {
      const results =
        audioClassifierRef.current.classify(
          input,
          sampleRate
        );

      // IMPORTANT:
      // classify() returns an array.
      // Therefore classifications are
      // inside results[0].
      const classifications =
        results[0]
          ?.classifications?.[0]
          ?.categories || [];

      if (
        classifications.length === 0
      ) {
        return;
      }

      // Sort from highest confidence
      // to lowest confidence.
      const sorted =
        [...classifications].sort(
          (a, b) =>
            b.score - a.score
        );

      const best = sorted[0];

      const label =
        best.categoryName ||
        best.displayName ||
        "Unknown sound";

      const score =
        best.score || 0;

      // Ignore normal speech because
      // AccessView is already showing
      // speech through Live Captions.
      const ignoredSounds = [
        "Speech",
        "Conversation",
        "Narration",
        "Music",
        "Singing",
        "Silence",
      ];

      const isIgnored =
        ignoredSounds.some(
          (item) =>
            label
              .toLowerCase()
              .includes(
                item.toLowerCase()
              )
        );

      if (isIgnored) {
        return;
      }

      if (score < 0.35) {
        return;
      }

      const now = Date.now();

      // Only update when the detected
      // sound changes or after 3 seconds.
      if (
        label !==
          lastSoundRef.current ||
        now -
          lastSoundTimeRef.current >
          3000
      ) {
        lastSoundRef.current =
          label;

        lastSoundTimeRef.current =
          now;

        setSoundAlert(label);
        setSoundConfidence(score);
      }
    } catch (error) {
      console.log(
        "Sound classification error:",
        error
      );
    }
  };

  // -----------------------------------
  // START SOUND DETECTION
  // -----------------------------------

  const startSoundDetection =
    async () => {
      try {
        setSoundListening(true);

        setSoundAlert(
          "Listening for sounds..."
        );

        setSoundConfidence(null);

        const classifier =
          await initializeSoundClassifier();

        if (!classifier) {
          setSoundListening(false);

          setSoundAlert(
            "Sound classifier could not be loaded."
          );

          return;
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: false,
                autoGainControl: false,
              },
            }
          );

        mediaStreamRef.current =
          stream;

        const AudioContextClass =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;

        if (!AudioContextClass) {
          throw new Error(
            "AudioContext is not supported."
          );
        }

        const audioContext =
          new AudioContextClass({
            sampleRate: 16000,
          });

        audioContextRef.current =
          audioContext;

        await audioContext.resume();

        const source =
          audioContext.createMediaStreamSource(
            stream
          );

        const processor =
          audioContext.createScriptProcessor(
            16384,
            1,
            1
          );

        processorRef.current =
          processor;

        source.connect(processor);

        processor.connect(
          audioContext.destination
        );

        processor.onaudioprocess =
          (event) => {
            const input =
              event.inputBuffer.getChannelData(
                0
              );

            // Store audio chunks until
            // approximately 1 second exists.
            audioBufferRef.current.push(
              new Float32Array(input)
            );

            audioSamplesRef.current +=
              input.length;

            if (
              audioSamplesRef.current <
              audioContext.sampleRate
            ) {
              return;
            }

            const totalLength =
              audioSamplesRef.current;

            const combined =
              new Float32Array(
                totalLength
              );

            let offset = 0;

            for (
              const chunk of
                audioBufferRef.current
            ) {
              combined.set(
                chunk,
                offset
              );

              offset +=
                chunk.length;
            }

            audioBufferRef.current =
              [];

            audioSamplesRef.current =
              0;

            classifyAudio(
              combined,
              audioContext.sampleRate
            );
          };
      } catch (error) {
        console.error(
          "Sound detection error:",
          error
        );

        setSoundListening(false);

        setSoundAlert(
          "Microphone access is required for sound detection."
        );

        setSoundConfidence(null);
      }
    };

  // -----------------------------------
  // STOP SOUND DETECTION
  // -----------------------------------

  const stopSoundDetection = () => {
    processorRef.current?.disconnect();

    mediaStreamRef.current
      ?.getTracks()
      .forEach(
        (track) =>
          track.stop()
      );

    audioContextRef.current?.close();

    processorRef.current = null;

    mediaStreamRef.current =
      null;

    audioContextRef.current =
      null;

    audioBufferRef.current =
      [];

    audioSamplesRef.current =
      0;

    try {
      audioClassifierRef.current?.close();
    } catch {}

    audioClassifierRef.current =
      null;

    setSoundListening(false);

    setSoundAlert(
      "Sound detection stopped"
    );

    setSoundConfidence(null);

    lastSoundRef.current = "";

    lastSoundTimeRef.current =
      0;
  };

  // -----------------------------------
  // CLEANUP
  // -----------------------------------

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}

      processorRef.current?.disconnect();

      mediaStreamRef.current
        ?.getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      audioContextRef.current?.close();

      try {
        audioClassifierRef.current?.close();
      } catch {}
    };
  }, []);

  // -----------------------------------
  // PAGE STYLES
  // -----------------------------------

  const pageBackground =
    darkMode
      ? "bg-gray-950 text-white"
      : highContrast
      ? "bg-black text-white"
      : "bg-gray-100 text-gray-900";

  const cardBackground =
    darkMode
      ? "bg-gray-900 border-gray-700"
      : highContrast
      ? "bg-black border-white"
      : "bg-white border-gray-200";

  // -----------------------------------
  // UI
  // -----------------------------------

  return (
    <main
      className={`min-h-screen transition-all duration-300 ${pageBackground}`}
    >
      {/* HEADER */}

      <header
        className={`border-b ${
          darkMode || highContrast
            ? "border-gray-700"
            : "border-gray-200"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">
              AccessView
            </h1>

            <p className="mt-1 text-lg">
              Making Sound Visible
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setFontSize(
                  Math.min(
                    fontSize + 2,
                    40
                  )
                )
              }
              className="rounded-lg border px-4 py-2 font-semibold"
            >
              A+
            </button>

            <button
              onClick={() =>
                setFontSize(
                  Math.max(
                    fontSize - 2,
                    18
                  )
                )
              }
              className="rounded-lg border px-4 py-2 font-semibold"
            >
              A-
            </button>

            <button
              onClick={() =>
                setHighContrast(
                  !highContrast
                )
              }
              className="rounded-lg border px-4 py-2 font-semibold"
            >
              Contrast
            </button>

            <button
              onClick={() =>
                setDarkMode(!darkMode)
              }
              className="rounded-lg border px-4 py-2 font-semibold"
            >
              {darkMode
                ? "☀️ Light"
                : "🌙 Dark"}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* INTRO */}

        <section className="mb-8 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Communication Without Barriers
          </h2>

          <p className="mx-auto mt-3 max-w-3xl text-lg opacity-80">
            AccessView converts speech and important
            sounds into clear visual information.
          </p>
        </section>

        {/* LANGUAGE SETTINGS */}

        <section
          className={`mb-8 rounded-2xl border p-6 shadow-sm ${cardBackground}`}
        >
          <h2 className="mb-5 text-2xl font-bold">
            🌐 Language Settings
          </h2>

          <div className="grid gap-5 md:grid-cols-2">

            {/* SPOKEN LANGUAGE */}

            <div>
              <label className="mb-2 block font-bold">
                Spoken Language
              </label>

              <select
                value={spokenLanguage}
                onChange={(e) =>
                  changeSpokenLanguage(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border bg-transparent px-4 py-3"
              >
                <option value="English">
                  English
                </option>

                <option value="Telugu">
                  Telugu
                </option>

                <option value="Hindi">
                  Hindi
                </option>

                <option value="Tamil">
                  Tamil
                </option>

                <option value="Kannada">
                  Kannada
                </option>

                <option value="Malayalam">
                  Malayalam
                </option>

                <option value="Bengali">
                  Bengali
                </option>

                <option value="Marathi">
                  Marathi
                </option>

                <option value="Gujarati">
                  Gujarati
                </option>

                <option value="Punjabi">
                  Punjabi
                </option>

                <option value="Urdu">
                  Urdu
                </option>
              </select>
            </div>

            {/* TARGET LANGUAGE */}

            <div>
              <label className="mb-2 block font-bold">
                Translate To
              </label>

              <select
                value={targetLanguage}
                onChange={(e) =>
                  changeTargetLanguage(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border bg-transparent px-4 py-3"
              >
                <option value="English">
                  English
                </option>

                <option value="Telugu">
                  Telugu
                </option>

                <option value="Hindi">
                  Hindi
                </option>

                <option value="Tamil">
                  Tamil
                </option>

                <option value="Kannada">
                  Kannada
                </option>

                <option value="Malayalam">
                  Malayalam
                </option>

                <option value="Bengali">
                  Bengali
                </option>

                <option value="Marathi">
                  Marathi
                </option>

                <option value="Gujarati">
                  Gujarati
                </option>

                <option value="Punjabi">
                  Punjabi
                </option>

                <option value="Urdu">
                  Urdu
                </option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">

            <button
              onClick={startListening}
              disabled={isListening}
              className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white disabled:opacity-50"
            >
              🎤 Start Listening
            </button>

            <button
              onClick={stopListening}
              disabled={!isListening}
              className="rounded-lg bg-red-600 px-6 py-3 font-bold text-white disabled:opacity-50"
            >
              ⏹ Stop
            </button>
          </div>

          {isListening && (
            <div className="mt-5 rounded-lg border border-green-500 p-4 font-semibold text-green-600">
              🟢 Listening in{" "}
              {spokenLanguage}...
            </div>
          )}
        </section>

        {/* LIVE CAPTION */}

        <section
          className={`mb-8 rounded-2xl border p-6 shadow-sm ${cardBackground}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              📝 Live Caption
            </h2>

            <span className="rounded-full border px-3 py-1 text-sm font-semibold">
              {currentSpeaker}
            </span>
          </div>

          <div
            className="rounded-xl border-2 border-blue-500 p-6"
            style={{
              fontSize: `${fontSize}px`,
            }}
          >
            <p className="font-bold">
              {caption}
            </p>

            <div className="my-5 border-t" />

            <p className="text-blue-600 dark:text-blue-400">
              {translatedText}
            </p>

            {/* REMINDER INSIDE LIVE CAPTION */}

            {caption &&
              caption !==
                "Press Start Listening and begin speaking..." &&
              caption !== "Listening..." && (
                <button
                  onClick={() =>
                    saveCaptionAsReminder(
                      caption,
                      translatedText
                    )
                  }
                  className="mt-6 rounded-lg bg-purple-600 px-5 py-3 font-bold text-white hover:bg-purple-700"
                >
                  🔔 Reminder
                </button>
              )}
          </div>
        </section>

        {/* SOUND ALERT */}

        <section
          className={`mb-8 rounded-2xl border p-6 shadow-sm ${cardBackground}`}
        >
          <h2 className="mb-2 text-2xl font-bold">
            🔔 Visual Sound Alerts
          </h2>

          <p className="mb-5 opacity-75">
            AccessView listens for environmental sounds
            and displays the detected sound visually.
          </p>

          <div className="rounded-xl border-2 border-orange-500 p-8 text-center">
            <div className="mb-3 text-5xl">
              🔊
            </div>

            <p
              className="font-bold"
              style={{
                fontSize: `${fontSize - 4}px`,
              }}
            >
              {soundAlert}
            </p>

            {soundConfidence !== null && (
              <p className="mt-3 font-semibold opacity-70">
                Confidence:{" "}
                {(soundConfidence * 100).toFixed(
                  0
                )}
                %
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">

            {!soundListening ? (
              <button
                onClick={
                  startSoundDetection
                }
                className="rounded-lg bg-orange-500 px-6 py-3 font-bold text-white"
              >
                🔊 Start Sound Detection
              </button>
            ) : (
              <button
                onClick={
                  stopSoundDetection
                }
                className="rounded-lg bg-red-600 px-6 py-3 font-bold text-white"
              >
                ⏹ Stop Sound Detection
              </button>
            )}

          </div>
        </section>

        {/* REMINDERS */}

        <section
          className={`mb-8 rounded-2xl border p-6 shadow-sm ${cardBackground}`}
        >
          <h2 className="mb-2 text-2xl font-bold">
            ⏰ Saved Reminders
          </h2>

          <p className="mb-5 opacity-75">
            Captions appear here only when the user
            presses the 🔔 Reminder button.
          </p>

          {reminders.length === 0 ? (
            <div className="rounded-xl border p-6 text-center opacity-60">
              No reminders saved.
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map(
                (reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-xl border p-5"
                  >
                    <p className="font-bold">
                      {reminder.text}
                    </p>

                    <p className="mt-2 text-blue-600">
                      {reminder.translatedText}
                    </p>

                    <p className="mt-2 text-sm opacity-60">
                      {reminder.time}
                    </p>

                    <button
                      onClick={() =>
                        deleteReminder(
                          reminder.id
                        )
                      }
                      className="mt-3 rounded-lg border border-red-500 px-4 py-2 font-semibold text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* CONVERSATION MODE */}

        <section
          className={`mb-8 rounded-2xl border p-6 shadow-sm ${cardBackground}`}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-2xl font-bold">
                💬 Conversation Mode
              </h2>

              <p className="mt-2 opacity-75">
                Track a conversation between two people.
              </p>
            </div>

            <button
              onClick={() =>
                setConversationMode(
                  !conversationMode
                )
              }
              className={`rounded-lg px-6 py-3 font-bold text-white ${
                conversationMode
                  ? "bg-red-600"
                  : "bg-green-600"
              }`}
            >
              {conversationMode
                ? "Exit Conversation"
                : "Start Conversation"}
            </button>
          </div>

          {conversationMode && (
            <div className="mt-6">

              {/* SPEAKER COUNT */}

              <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">

                <p className="text-lg font-bold">
                  👥 People speaking:{" "}
                  {speakerCount}
                </p>

                <button
                  onClick={
                    switchSpeaker
                  }
                  className="rounded-lg bg-blue-600 px-5 py-3 font-bold text-white"
                >
                  🔄 Switch to{" "}
                  {currentSpeaker ===
                  "Person A"
                    ? "Person B"
                    : "Person A"}
                </button>
              </div>

              <div className="mb-5 rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-sm text-yellow-900">
                💡 Currently showing:{" "}
                <strong>
                  {currentSpeaker}
                </strong>
                . Click "Switch to Person B"
                when Person B starts speaking.
              </div>

              {/* TWO PEOPLE */}

              <div className="grid gap-5 md:grid-cols-2">

                {/* PERSON A */}

                <div className="rounded-xl border-2 border-blue-500 p-5">
                  <h3 className="mb-3 text-xl font-bold">
                    👤 Person A
                  </h3>

                  {captions.filter(
                    (item) =>
                      item.speaker ===
                      "Person A"
                  ).length === 0 ? (
                    <p className="opacity-60">
                      Waiting for Person A...
                    </p>
                  ) : (
                    captions
                      .filter(
                        (item) =>
                          item.speaker ===
                          "Person A"
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          className="mb-4 border-b pb-3"
                        >
                          <p className="font-semibold">
                            {item.original}
                          </p>

                          <p className="mt-1 text-blue-600">
                            {item.translated}
                          </p>
                        </div>
                      ))
                  )}
                </div>

                {/* PERSON B */}

                <div className="rounded-xl border-2 border-purple-500 p-5">
                  <h3 className="mb-3 text-xl font-bold">
                    👤 Person B
                  </h3>

                  {captions.filter(
                    (item) =>
                      item.speaker ===
                      "Person B"
                  ).length === 0 ? (
                    <p className="opacity-60">
                      Waiting for Person B...
                    </p>
                  ) : (
                    captions
                      .filter(
                        (item) =>
                          item.speaker ===
                          "Person B"
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          className="mb-4 border-b pb-3"
                        >
                          <p className="font-semibold">
                            {item.original}
                          </p>

                          <p className="mt-1 text-purple-600">
                            {item.translated}
                          </p>
                        </div>
                      ))
                  )}
                </div>

              </div>
            </div>
          )}
        </section>

        {/* ACCESSIBILITY */}

        <section
          className={`rounded-2xl border p-6 shadow-sm ${cardBackground}`}
        >
          <h2 className="mb-5 text-2xl font-bold">
            ♿ Accessibility Settings
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border p-4">
              <p className="font-bold">
                Font Size
              </p>

              <p className="mt-1 opacity-70">
                {fontSize}px
              </p>
            </div>

            <button
              onClick={() =>
                setHighContrast(
                  !highContrast
                )
              }
              className="rounded-xl border p-4 text-left"
            >
              <p className="font-bold">
                High Contrast
              </p>

              <p className="mt-1 opacity-70">
                {highContrast
                  ? "Enabled"
                  : "Disabled"}
              </p>
            </button>

            <button
              onClick={() =>
                setDarkMode(!darkMode)
              }
              className="rounded-xl border p-4 text-left"
            >
              <p className="font-bold">
                Dark Mode
              </p>

              <p className="mt-1 opacity-70">
                {darkMode
                  ? "Enabled"
                  : "Disabled"}
              </p>
            </button>

            <button
              onClick={() =>
                setFontSize(24)
              }
              className="rounded-xl border p-4 text-left"
            >
              <p className="font-bold">
                Reset Text
              </p>

              <p className="mt-1 opacity-70">
                Return to normal size
              </p>
            </button>

          </div>
        </section>

        {/* FOOTER */}

        <footer className="py-10 text-center">
          <p className="text-lg font-bold">
            AccessView — Making Sound Visible
          </p>

          <p className="mt-2 text-sm opacity-60">
            AI-Powered Accessibility Platform
          </p>
        </footer>

      </div>
    </main>
  );
}