import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_MUSIC_TRACK_ID,
  MUSIC_LIBRARY,
  findMusicTrack,
} from "../data/music-library.ts";
import {
  MAX_MUSIC_BYTES,
  isOwnMusicPath,
  musicDisplayName,
  musicObjectName,
  musicPublicUrl,
  resolveMusicSource,
  validateMusicUpload,
} from "./music.ts";

const url = (path) => `https://cdn.test/${path}`;
const W = "0b6c2f0e-1111-4222-8333-444455556666";

test("the library's default is in the list, and ids are unique", () => {
  assert.ok(findMusicTrack(DEFAULT_MUSIC_TRACK_ID));
  const ids = MUSIC_LIBRARY.map((track) => track.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(findMusicTrack(null), undefined);
  assert.equal(findMusicTrack("no-such-track"), undefined);
});

test("resolveMusicSource plays nothing when the database blanked the row", () => {
  assert.equal(resolveMusicSource(null, url), null);
  assert.equal(
    resolveMusicSource({ music_enabled: false, music_track: "x", music_upload_path: `${W}/1-a.mp3` }, url),
    null,
  );
  assert.equal(
    resolveMusicSource({ music_enabled: null, music_track: null, music_upload_path: null }, url),
    null,
  );
});

test("resolveMusicSource prefers the couple's upload", () => {
  assert.deepEqual(
    resolveMusicSource(
      { music_enabled: true, music_track: DEFAULT_MUSIC_TRACK_ID, music_upload_path: `${W}/1-a.mp3` },
      url,
    ),
    { src: `https://cdn.test/${W}/1-a.mp3` },
  );
});

test("resolveMusicSource falls back to the default track, also for an id the library lost", () => {
  const expected = { src: `https://cdn.test/library/${findMusicTrack(DEFAULT_MUSIC_TRACK_ID).file}` };
  assert.deepEqual(
    resolveMusicSource({ music_enabled: true, music_track: null, music_upload_path: null }, url),
    expected,
  );
  assert.deepEqual(
    resolveMusicSource({ music_enabled: true, music_track: "removed-song", music_upload_path: null }, url),
    expected,
  );
});

test("musicPublicUrl builds Supabase's public object URL, encoding each segment", () => {
  assert.equal(
    musicPublicUrl("http://127.0.0.1:54321/", "library/a b.mp3"),
    "http://127.0.0.1:54321/storage/v1/object/public/music/library/a%20b.mp3",
  );
});

test("validateMusicUpload trusts the extension, not the browser's MIME type", () => {
  assert.deepEqual(validateMusicUpload({ name: "CHANSON.MP3", size: 1000 }), {
    ok: true,
    ext: "mp3",
    contentType: "audio/mpeg",
  });
  assert.deepEqual(validateMusicUpload({ name: "voice memo.m4a", size: 1000 }), {
    ok: true,
    ext: "m4a",
    contentType: "audio/mp4",
  });
  assert.deepEqual(validateMusicUpload({ name: "song.aac", size: 1 }), {
    ok: true,
    ext: "aac",
    contentType: "audio/aac",
  });
});

test("validateMusicUpload refuses other formats, empty files and files over 15 MB", () => {
  assert.deepEqual(validateMusicUpload({ name: "song.wav", size: 1000 }), { ok: false, reason: "type" });
  assert.deepEqual(validateMusicUpload({ name: "song", size: 1000 }), { ok: false, reason: "type" });
  assert.deepEqual(validateMusicUpload({ name: "song.mp3", size: 0 }), { ok: false, reason: "empty" });
  assert.deepEqual(validateMusicUpload({ name: "song.mp3", size: MAX_MUSIC_BYTES + 1 }), {
    ok: false,
    reason: "size",
  });
  assert.equal(validateMusicUpload({ name: "song.mp3", size: MAX_MUSIC_BYTES }).ok, true);
});

test("musicObjectName keeps a readable, safe version of the name in the couple's folder", () => {
  assert.equal(
    musicObjectName(W, "Notre chanson ❤️ (live).MP3", 1700000000000),
    `${W}/1700000000000-notre-chanson-live.mp3`,
  );
  assert.equal(musicObjectName(W, "Écoute-moi.m4a", 1), `${W}/1-ecoute-moi.m4a`);
  assert.equal(musicObjectName(W, "❤️.mp3", 1), `${W}/1-musique.mp3`);
  assert.equal(musicObjectName(W, `${"a".repeat(100)}.mp3`, 1), `${W}/1-${"a".repeat(60)}.mp3`);
});

test("isOwnMusicPath accepts only an upload in this wedding's own folder", () => {
  assert.equal(isOwnMusicPath(W, `${W}/1700000000000-notre-chanson.mp3`), true);
  assert.equal(isOwnMusicPath(W, musicObjectName(W, "Notre chanson ❤️ (live).MP3", 5)), true);
  assert.equal(isOwnMusicPath(W, "other-wedding/1-a.mp3"), false);
  assert.equal(isOwnMusicPath(W, `${W}/../other/1-a.mp3`), false);
  assert.equal(isOwnMusicPath(W, `${W}/sub/1-a.mp3`), false);
  assert.equal(isOwnMusicPath(W, "library/studio-default.mp3"), false);
  assert.equal(isOwnMusicPath(W, `${W}/1-a.wav`), false);
});

test("musicDisplayName drops the folder and the timestamp", () => {
  assert.equal(musicDisplayName(`${W}/1700000000000-notre-chanson.mp3`), "notre-chanson.mp3");
});
