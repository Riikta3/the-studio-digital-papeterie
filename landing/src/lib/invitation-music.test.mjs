import assert from "node:assert/strict";
import test from "node:test";

import {
  countsAsGesture,
  fadeInVolume,
  initialMusicState,
  musicStorageKey,
  nextMusicStep,
  readStoredMuted,
  writeStoredMuted,
} from "./invitation-music.ts";

/** Feeds events from a state; returns where it ends and every command issued. */
function run(state, events) {
  const commands = [];
  for (const event of events) {
    const step = nextMusicStep(state, event);
    state = step.state;
    if (step.command) commands.push(step.command);
  }
  return { state, commands };
}

test("a guest who never muted starts idle; one who did starts muted", () => {
  assert.equal(initialMusicState(false), "idle");
  assert.equal(initialMusicState(true), "muted");
});

test("the first gesture starts the music, once", () => {
  assert.deepEqual(run("idle", ["gesture", "gesture"]), { state: "playing", commands: ["play"] });
});

test("a first tap on the icon starts the music rather than toggling it twice", () => {
  assert.deepEqual(nextMusicStep("idle", "toggle"), { state: "playing", command: "play", remember: null });
});

test("tapping the icon while playing mutes and remembers it; tapping again unmutes", () => {
  assert.deepEqual(nextMusicStep("playing", "toggle"), { state: "muted", command: "pause", remember: "muted" });
  assert.deepEqual(nextMusicStep("muted", "toggle"), { state: "playing", command: "play", remember: "unmuted" });
});

test("a muted guest's gestures do not start the music", () => {
  assert.deepEqual(run("muted", ["gesture", "gesture"]), { state: "muted", commands: [] });
});

test("hiding the page pauses and showing it resumes, only if it was playing", () => {
  assert.deepEqual(run("playing", ["hidden", "visible"]), { state: "playing", commands: ["pause", "play"] });
  assert.deepEqual(run("muted", ["hidden", "visible"]), { state: "muted", commands: [] });
  assert.deepEqual(run("idle", ["hidden", "visible"]), { state: "idle", commands: [] });
});

test("a refused play() (a swipe is not a gesture on iOS) goes back to idle, and the next tap starts it", () => {
  assert.deepEqual(run("idle", ["gesture", "rejected", "gesture"]), {
    state: "playing",
    commands: ["play", "play"],
  });
  assert.deepEqual(run("muted", ["rejected"]), { state: "muted", commands: [] });
});

test("a file that cannot play ends in error, and nothing brings it back", () => {
  assert.deepEqual(run("playing", ["failed", "toggle", "gesture", "visible"]), {
    state: "error",
    commands: ["pause"],
  });
});

test("the remembered choice is per wedding", () => {
  assert.equal(musicStorageKey("w-1"), "invitation-music:w-1");
  assert.notEqual(musicStorageKey("w-1"), musicStorageKey("demo:ciao-amore"));
});

test("the stored choice survives a round trip", () => {
  const store = new Map();
  const storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
  };
  writeStoredMuted(storage, "k", "muted");
  assert.equal(readStoredMuted(storage, "k"), true);
  writeStoredMuted(storage, "k", "unmuted");
  assert.equal(readStoredMuted(storage, "k"), false);
});

test("a storage that throws (private window) reads as not muted and forgets silently", () => {
  const throwing = {
    getItem() { throw new Error("SecurityError"); },
    setItem() { throw new Error("QuotaExceededError"); },
    removeItem() { throw new Error("SecurityError"); },
  };
  assert.equal(readStoredMuted(throwing, "k"), false);
  assert.doesNotThrow(() => writeStoredMuted(throwing, "k", "muted"));
  assert.equal(readStoredMuted(null, "k"), false);
});

test("an outside pause (lock screen, media keys) shows as muted without remembering it", () => {
  assert.deepEqual(nextMusicStep("playing", "interrupted"), { state: "muted", command: null, remember: null });
  assert.deepEqual(nextMusicStep("muted", "interrupted"), { state: "muted", command: null, remember: null });
  assert.deepEqual(nextMusicStep("idle", "interrupted"), { state: "idle", command: null, remember: null });
});

test("an outside play (lock screen, media keys) shows as playing", () => {
  assert.deepEqual(nextMusicStep("muted", "resumed"), { state: "playing", command: null, remember: "unmuted" });
  assert.deepEqual(nextMusicStep("idle", "resumed"), { state: "playing", command: null, remember: null });
  assert.deepEqual(nextMusicStep("playing", "resumed"), { state: "playing", command: null, remember: null });
});

test("another video or sound starting on the page silences the music, without remembering it", () => {
  assert.deepEqual(nextMusicStep("playing", "otherMedia"), { state: "muted", command: "pause", remember: null });
  assert.deepEqual(nextMusicStep("idle", "otherMedia"), { state: "idle", command: null, remember: null });
});

test("Tab, modifier keys and Escape are not the gesture that starts the music", () => {
  for (const key of ["Tab", "Shift", "Control", "Alt", "Meta", "Escape", "CapsLock"]) {
    assert.equal(countsAsGesture({ type: "keydown", key }), false, key);
  }
  for (const key of ["Enter", " ", "ArrowDown", "a"]) {
    assert.equal(countsAsGesture({ type: "keydown", key }), true, key);
  }
  assert.equal(countsAsGesture({ type: "click" }), true);
  assert.equal(countsAsGesture({ type: "touchend" }), true);
});

test("the fade-in volume stays within [0, target], even for a frame stamped before the fade began", () => {
  // requestAnimationFrame passes the frame's START time, which can precede the
  // performance.now() taken when the fade began: a negative elapsed time.
  assert.equal(fadeInVolume(-0.9, 0.6, 2000), 0);
  assert.equal(fadeInVolume(0, 0.6, 2000), 0);
  assert.equal(fadeInVolume(1000, 0.6, 2000), 0.3);
  assert.equal(fadeInVolume(2000, 0.6, 2000), 0.6);
  assert.equal(fadeInVolume(5000, 0.6, 2000), 0.6);
});
