import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import ytdl from "@distube/ytdl-core";
import ffmpegStatic from "ffmpeg-static";

import type { Song, SongCatalog } from "../src/lib/types";

import rawSongs from "../src/data/songs.json";

const songsData = rawSongs as unknown as SongCatalog;

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveOutputPath(audioFile: string): string {
  // audioFile is like /assets/foo.mp3 — map to public/assets/foo.mp3 in repo root
  return join(__dirname, "..", "public", audioFile);
}

async function downloadSong(song: Song, force: boolean): Promise<void> {
  const { title, audioFile, youtubeId, startTime, endTime, fadeIn, fadeOut } =
    song;

  const outputPath = resolveOutputPath(audioFile);

  if (!force && existsSync(outputPath)) {
    console.log(
      `[${title}] Already exists, skipping (use --force to re-download)`,
    );
    return;
  }

  const tmpFile = join(tmpdir(), `metal-weather-${youtubeId}.webm`);

  try {
    console.log(`[${title}] Downloading...`);
    const stream = ytdl(`https://www.youtube.com/watch?v=${youtubeId}`, {
      filter: "audioonly",
    });
    await pipeline(stream, createWriteStream(tmpFile));

    console.log(`[${title}] Processing...`);

    const outDuration = endTime - startTime;
    const fadeOutStart = outDuration - fadeOut;

    mkdirSync(dirname(outputPath), { recursive: true });

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegStatic!, [
        "-y",
        "-i",
        tmpFile,
        "-ss",
        String(startTime),
        "-to",
        String(endTime),
        "-af",
        `afade=t=in:d=${fadeIn},afade=t=out:st=${fadeOutStart}:d=${fadeOut}`,
        "-vn",
        "-acodec",
        "libmp3lame",
        "-q:a",
        "2",
        outputPath,
      ]);
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
      proc.on("error", reject);
    });

    console.log(`[${title}] Done — ${outputPath}`);
  } finally {
    try {
      await unlink(tmpFile);
    } catch {
      // temp file may not exist if download failed
    }
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const force = args.includes("--force");
const titleFilter = args.find((a) => !a.startsWith("--"));

// Flatten all songs from conditions + error
const allSongs = [
  ...songsData.conditions.flatMap((c) => c.songs),
  ...songsData.error.songs,
] as Song[];

const targets = titleFilter
  ? allSongs.filter((s) => s.title.toLowerCase() === titleFilter.toLowerCase())
  : allSongs;

if (titleFilter && targets.length === 0) {
  console.error(`No song found matching "${titleFilter}"`);
  process.exit(1);
}

if (!ffmpegStatic) {
  console.error("ffmpeg binary not found");
  process.exit(1);
}

let errors = 0;
for (const song of targets) {
  try {
    await downloadSong(song, force);
  } catch (err) {
    console.error(`[${song.title}] Error:`, err);
    errors++;
  }
}

if (errors > 0) {
  process.exit(1);
}
