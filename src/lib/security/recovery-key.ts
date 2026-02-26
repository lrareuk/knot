import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { RECOVERY_WORDS } from "@/lib/security/recovery-words";

const RECOVERY_WORD_COUNT = 3;
const RECOVERY_KEY_PATTERN = /^[a-z]+ [a-z]+ [a-z]+$/;

export function normalizeRecoveryKey(input: string) {
  return input
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

export function isRecoveryKeyShape(input: string) {
  return RECOVERY_KEY_PATTERN.test(normalizeRecoveryKey(input));
}

function randomIndex(size: number) {
  const bytes = randomBytes(4);
  return bytes.readUInt32BE(0) % size;
}

export function generateRecoveryKeyWords() {
  const words: string[] = [];
  for (let index = 0; index < RECOVERY_WORD_COUNT; index += 1) {
    words.push(RECOVERY_WORDS[randomIndex(RECOVERY_WORDS.length)]);
  }
  return words;
}

export function generateRecoveryKey() {
  return generateRecoveryKeyWords().join(" ");
}

export function generateRecoverySalt() {
  return randomBytes(16).toString("hex");
}

export function hashRecoveryKey(input: { recoveryKey: string; salt: string; pepper: string }) {
  const normalized = normalizeRecoveryKey(input.recoveryKey);
  return createHash("sha256")
    .update(`${input.pepper}:${input.salt}:${normalized}`)
    .digest("hex");
}

export function verifyRecoveryKey(input: {
  providedKey: string;
  salt: string;
  pepper: string;
  expectedHash: string;
}) {
  const providedHash = hashRecoveryKey({
    recoveryKey: input.providedKey,
    salt: input.salt,
    pepper: input.pepper,
  });

  const expectedBuffer = Buffer.from(input.expectedHash, "hex");
  const providedBuffer = Buffer.from(providedHash, "hex");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
