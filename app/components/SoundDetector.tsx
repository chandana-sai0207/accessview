"use client";

import { useEffect, useRef, useState } from "react";
import {
  AudioClassifier,
  FilesetResolver,
} from "@mediapipe/tasks-audio";

type SoundResult = {
  label: string;
  confidence: number;
};

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio/wasm";

const ignoredSounds = [
  "Speech",
  "Conversation",
  "Narration",
  "Music",
  "Singing",
  "Silence",
];

export default function SoundDetector() {
  const [isListening, setIsListening] = useState(false);

  const [sound, setSound] =
    useState<SoundResult | null>(null);

  const [error, setError] = useState("");

  const audioContextRef =
    useRef<AudioContext | null>(null);

  const processorRef =
    useRef<ScriptProcessorNode | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const classifierRef =
    useRef<AudioClassifier | null>(null);

  const audioBufferRef =
    useRef<number[]>([]);

  const lastSoundRef =
    useRef("");

  const lastUpdateRef =
    useRef(0);

  const createClassifier = async () => {
    if (classifierRef.current) {
      return classifierRef.current;
    }

    const audioFileset =
      await FilesetResolver.forAudioTasks(WASM_URL);

    const classifier =
      await AudioClassifier.createFromOptions(
        audioFileset,
        {
          baseOptions: {
            modelAssetPath: MODEL_URL,
          },

          maxResults: 1,

          scoreThreshold: 0.35,
        }
      );

    classifierRef.current = classifier;

    return classifier;
  };

  const startListening = async () => {
    try {
      setError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Your browser does not support microphone access."
        );

        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      const classifier =
        await createClassifier();

      const audioContext =
        new AudioContext({
          sampleRate: 16000,
        });

      audioContextRef.current =
        audioContext;

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

      audioBufferRef.current = [];

      processor.onaudioprocess = (
        event
      ) => {
        const input =
          event.inputBuffer.getChannelData(0);

        audioBufferRef.current.push(
          ...Array.from(input)
        );

        const requiredSamples =
          16000;

        if (
          audioBufferRef.current.length <
          requiredSamples
        ) {
          return;
        }

        const samples =
          new Float32Array(
            audioBufferRef.current.slice(
              0,
              requiredSamples
            )
          );

        audioBufferRef.current =
          audioBufferRef.current.slice(
            requiredSamples
          );

        try {
          const result =
            classifier.classify(
              samples,
              16000
            );

          const classifications =
            result[0]
              ?.classifications?.[0]
              ?.categories || [];

          if (
            classifications.length === 0
          ) {
            return;
          }

          const best =
            classifications[0];

          const label =
            best.categoryName ||
            best.displayName ||
            "Unknown sound";

          const confidence =
            best.score || 0;

          const shouldIgnore =
            ignoredSounds.some(
              (item) =>
                label
                  .toLowerCase()
                  .includes(
                    item.toLowerCase()
                  )
            );

          if (shouldIgnore) {
            return;
          }

          if (confidence < 0.35) {
            return;
          }

          const now = Date.now();

          if (
            label !==
              lastSoundRef.current ||
            now -
                lastUpdateRef.current >
              3000
          ) {
            lastSoundRef.current =
              label;

            lastUpdateRef.current =
              now;

            setSound({
              label,
              confidence,
            });
          }
        } catch (classificationError) {
          console.error(
            "Sound classification error:",
            classificationError
          );
        }
      };

      source.connect(processor);

      processor.connect(
        audioContext.destination
      );

      setIsListening(true);
    } catch (err) {
      console.error(
        "Microphone error:",
        err
      );

      setError(
        "Microphone access is required for sound detection."
      );

      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();

      processorRef.current =
        null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();

      audioContextRef.current =
        null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    audioBufferRef.current = [];

    lastSoundRef.current = "";

    lastUpdateRef.current = 0;

    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (processorRef.current) {
        processorRef.current.disconnect();
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }
    };
  }, []);

  return (
    <div className="sound-detector">
      <div className="sound-detector-header">
        <div>
          <span className="eyebrow">
            ENVIRONMENTAL SOUND
          </span>

          <h2>
            Visual Sound Alerts
          </h2>

          <p>
            Detect important environmental
            sounds and display them visually.
          </p>
        </div>

        <div className="status-pill">
          <span
            className={`status-dot ${
              isListening
                ? "listening"
                : ""
            }`}
          />

          {isListening
            ? "Listening"
            : "Not listening"}
        </div>
      </div>

      <div className="sound-detector-content">
        <div className="sound-alert-card">
          {sound ? (
            <>
              <div className="sound-alert-icon">
                🔊
              </div>

              <div>
                <span className="eyebrow">
                  SOUND DETECTED
                </span>

                <h3>
                  {sound.label}
                </h3>

                <p>
                  Confidence:{" "}
                  {(
                    sound.confidence *
                    100
                  ).toFixed(0)}
                  %
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="sound-alert-icon">
                👂
              </div>

              <div>
                <span className="eyebrow">
                  READY
                </span>

                <h3>
                  No sound detected yet
                </h3>

                <p>
                  Start listening to detect
                  environmental sounds.
                </p>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="sound-detector-actions">
          {!isListening ? (
            <button
              type="button"
              className="primary-button"
              onClick={startListening}
            >
              🎙 Start Sound Detection
            </button>
          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={stopListening}
            >
              ⏹ Stop Sound Detection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}