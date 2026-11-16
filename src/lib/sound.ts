import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

let ctx: AudioContext | null = null;
let muted = false;

export const setMuted = (value: boolean) => {
  muted = value;
};

function audio() {
  if (muted || typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, duration: number, type: OscillatorType = 'sine', volume = 0.1, slideTo?: number) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

const arpeggio = (notes: number[], step: number, type: OscillatorType = 'triangle') =>
  notes.forEach((f, i) => tone(f, i * step, 0.18, type, 0.09));

export const sfx = {
  coin: () => {
    tone(1318, 0, 0.09, 'triangle', 0.08);
    tone(1975, 0.06, 0.16, 'triangle', 0.07);
  },
  note: () => tone(420, 0, 0.14, 'sine', 0.1, 760),
  remove: () => tone(520, 0, 0.16, 'sine', 0.08, 240),
  win: () => arpeggio([523, 659, 784, 1047, 1319, 1568], 0.09),
};

/**
 * Reads text aloud, preferring an Indian English voice. Inside the Android/iOS apps this uses the
 * native speech engine (Android's WebView has no Web Speech API); in browsers it uses speechSynthesis.
 */
export function say(text: string) {
  if (muted || typeof window === 'undefined') return;
  if (Capacitor.isNativePlatform()) {
    void TextToSpeech.stop()
      .then(() => TextToSpeech.speak({ text, lang: 'en-IN', rate: 0.95, pitch: 1.1, category: 'ambient' }))
      .catch(() => {});
    return;
  }
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel(); // a fresh tap interrupts the previous announcement
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = synth.getVoices();
  const voice = voices.find((v) => v.lang === 'en-IN') ?? voices.find((v) => v.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? 'en-IN';
  utterance.rate = 0.95;
  utterance.pitch = 1.1;
  synth.speak(utterance);
}

export const spokenRupees = (n: number) => `${n.toLocaleString('en-IN')} ${n === 1 ? 'rupee' : 'rupees'}`;

/** Turns on-screen text like "Make ₹20 with 2 × ₹10" into words a speech engine reads naturally. */
export const speakable = (text: string) =>
  text
    .replace(/₹([\d,]+)/g, (_, n: string) => spokenRupees(Number(n.replace(/,/g, ''))))
    .replace(/ × /g, ' times ')
    .replace(/ \+ /g, ' plus ')
    .replace(/ = /g, ' equals ')
    .replace(/[✓✅💡]/gu, '')
    .trim();
