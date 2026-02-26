import { describe, expect, it } from "vitest";
import {
  generateRecoveryKey,
  generateRecoverySalt,
  hashRecoveryKey,
  isRecoveryKeyShape,
  normalizeRecoveryKey,
  verifyRecoveryKey,
} from "@/lib/security/recovery-key";

describe("recovery-key utilities", () => {
  it("normalizes input into lowercase three-word format", () => {
    expect(normalizeRecoveryKey("  Cedar   WAVE\tstone  ")).toBe("cedar wave stone");
  });

  it("validates key shape", () => {
    expect(isRecoveryKeyShape("cedar wave stone")).toBe(true);
    expect(isRecoveryKeyShape("cedar-wave-stone")).toBe(false);
  });

  it("hashes and verifies recovery keys with salt + pepper", () => {
    const salt = generateRecoverySalt();
    const pepper = "pepper-value";
    const recoveryKey = "cedar wave stone";

    const hash = hashRecoveryKey({ recoveryKey, salt, pepper });
    expect(hash.length).toBe(64);

    expect(
      verifyRecoveryKey({
        providedKey: "CEDAR   wave stone",
        salt,
        pepper,
        expectedHash: hash,
      })
    ).toBe(true);

    expect(
      verifyRecoveryKey({
        providedKey: "cedar wave river",
        salt,
        pepper,
        expectedHash: hash,
      })
    ).toBe(false);
  });

  it("generates a three-word key", () => {
    const key = generateRecoveryKey();
    const parts = key.split(" ");
    expect(parts).toHaveLength(3);
    expect(parts.every((part) => /^[a-z]+$/.test(part))).toBe(true);
  });
});
