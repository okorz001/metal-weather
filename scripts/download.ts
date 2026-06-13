import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import ytdl from "@distube/ytdl-core";
import ffmpegStatic from "ffmpeg-static";
import Ffmpeg from "fluent-ffmpeg";

import rawSongs from "../src/data/songs.json";

interface Song {
  title: string;
  artist: string;
  audioFile: string;
  youtubeId: string;
  startTime: number | null;
  endTime: number | null;
  fadeIn: number;
  fadeOut: number;
}

interface SongsData {
  conditions: Array<{ status: string; songs: Song[] }>;
  error: { songs: Song[] };
}

const songsData = rawSongs as unknown as SongsData;

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveOutputPath(audioFile: string): string {
  // audioFile is like /assets/foo.mp3 — map to public/assets/foo.mp3 in repo root
  return join(__dirname, "..", "public", audioFile);
}

async function downloadSong(song: Song, force: boolean): Promise<void> {
  if (song.startTime === null || song.endTime === null) {
    console.log(`[${song.title}] Skipping — startTime/endTime not configured`);
    return;
  }

  const outputPath = resolveOutputPath(song.audioFile);

  if (!force && existsSync(outputPath)) {
    console.log(
      `[${song.title}] Already exists, skipping (use --force to re-download)`,
    );
    return;
  }

  const tmpFile = join(tmpdir(), `metal-weather-${song.youtubeId}.webm`);

  try {
    console.log(`[${song.title}] Downloading...`);
    const stream = ytdl(`https://www.youtube.com/watch?v=${song.youtubeId}`, {
      filter: "audioonly",
    });
    await pipeline(stream, createWriteStream(tmpFile));

    console.log(`[${song.title}] Processing...`);

    const outDuration = song.endTime - song.startTime;
    const fadeOutStart = outDuration - song.fadeOut;

    mkdirSync(dirname(outputPath), { recursive: true });

    await new Promise<void>((resolve, reject) => {
      Ffmpeg(tmpFile)
        .outputOptions("-y")
        .setStartTime(song.startTime!)
        .setDuration(outDuration)
        .audioFilters([
          `afade=t=in:d=${song.fadeIn}`,
          `afade=t=out:st=${fadeOutStart}:d=${song.fadeOut}`,
        ])
        .noVideo()
        .audioCodec("libmp3lame")
        .audioQuality(2)
        .save(outputPath)
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`[${song.title}] Done — ${outputPath}`);
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
const allSongs: Song[] = [
  ...songsData.conditions.flatMap((c) => c.songs),
  ...songsData.error.songs,
];

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

Ffmpeg.setFfmpegPath(ffmpegStatic);

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
