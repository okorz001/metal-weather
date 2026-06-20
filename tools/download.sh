#!/usr/bin/env bash
# Downloads, crops, and fades audio for each song in src/data/songs.json.
# Intended to be run inside the Docker container defined in tools/Dockerfile.
#
# Usage:
#   download.sh [--force] [--no-audio] [--no-cover] [title]
#
#   --force     Re-download even if the output file already exists.
#   --no-audio  Skip audio download.
#   --no-cover  Skip cover art download.
#   title       Optional song title to process a single song (case-insensitive).
#               Without this, all songs are processed.
set -euo pipefail

force=false
no_audio=false
no_cover=false
title_filter=""

for arg in "$@"; do
  if [[ "$arg" == "--force" ]]; then
    force=true
  elif [[ "$arg" == "--no-audio" ]]; then
    no_audio=true
  elif [[ "$arg" == "--no-cover" ]]; then
    no_cover=true
  else
    title_filter="$arg"
  fi
done

errors=0
matched=0

# Flatten all songs from conditions[].songs[] and error.songs[] into a stream
# of compact JSON objects, one per line.
while IFS= read -r song; do
  title=$(echo "$song" | jq -r '.title')
  youtube_id=$(echo "$song" | jq -r '.youtubeId')
  audio_file=$(echo "$song" | jq -r '.audioFile')
  cover_art=$(echo "$song" | jq -r '.coverArt // empty')
  start_time=$(echo "$song" | jq -r '.startTime')
  end_time=$(echo "$song" | jq -r '.endTime')
  fade_in=$(echo "$song" | jq -r '.fadeIn')
  fade_out=$(echo "$song" | jq -r '.fadeOut')

  # Apply optional title filter (case-insensitive).
  if [[ -n "$title_filter" ]] && [[ "${title,,}" != "${title_filter,,}" ]]; then
    continue
  fi

  matched=$((matched + 1))

  # coverArt is a public URL path like /assets/foo.jpg; download YouTube thumbnail.
  if [[ "$no_cover" == false ]] && [[ -n "$cover_art" ]]; then
    cover_path="/app/public${cover_art}"
    if [[ "$force" == false ]] && [[ -f "$cover_path" ]]; then
      echo "[$title] Cover already exists, skipping (use --force to re-download)"
    else
      mkdir -p "$(dirname "$cover_path")"
      tmp_cover=$(mktemp /tmp/cover_XXXXXX.jpg)
      cover_ok=true

      if ! curl -fsSL -o "$tmp_cover" "https://img.youtube.com/vi/${youtube_id}/hqdefault.jpg"; then
        echo "[$title] Error: curl failed to download cover art" >&2
        cover_ok=false
      fi

      if [[ "$cover_ok" == true ]]; then
        # hqdefault thumbnails are 480x360. The album art is a 360x360 square
        # centered horizontally (60px colored fills on each side, no top/bottom bars).
        if ! ffmpeg -y -i "$tmp_cover" -vf "crop=360:360:60:0" "$cover_path"; then
          echo "[$title] Error: ffmpeg failed to crop cover art" >&2
          cover_ok=false
        fi
      fi

      rm -f "$tmp_cover"

      if [[ "$cover_ok" == true ]]; then
        echo "[$title] Cover — $cover_path"
      else
        errors=$((errors + 1))
      fi
    fi
  fi

  if [[ "$no_audio" == true ]]; then
    continue
  fi

  # audioFile is a public URL path like /assets/foo.mp3; prepend /app/public
  # to get the filesystem path inside the container (repo root is mounted at /app).
  output_path="/app/public${audio_file}"

  if [[ "$force" == false ]] && [[ -f "$output_path" ]]; then
    echo "[$title] Audio already exists, skipping (use --force to re-download)"
    continue
  fi

  tmpdir=$(mktemp -d)

  # -x: extract audio only (no video); yt-dlp picks the best available format.
  # %(ext)s in the template lets yt-dlp append the actual file extension.
  echo "[$title] Downloading..."
  if ! yt-dlp -x -o "$tmpdir/audio.%(ext)s" "https://www.youtube.com/watch?v=$youtube_id"; then
    echo "[$title] Error: yt-dlp failed" >&2
    rm -rf "$tmpdir"
    errors=$((errors + 1))
    continue
  fi

  tmpfile=$(ls "$tmpdir"/audio.* | head -1)
  out_duration=$(( end_time - start_time ))
  # Fade-out starts this many seconds into the output clip (i.e. fade_out seconds before the end).
  fade_out_start=$(( out_duration - fade_out ))

  echo "[$title] Processing..."
  mkdir -p "$(dirname "$output_path")"

  # -ss before -i: input-side seeking, which resets output timestamps to 0.
  #   This is required so the afade filter's st= (start time) is relative to
  #   the clipped output, not the original file. Output-side -ss retains the
  #   original timestamps and breaks the fade-out timing.
  # -to out_duration: stop after this many seconds of output (not an absolute time).
  # -af afade: fade in at the start, fade out near the end.
  # -vn: drop any video stream.
  # -q:a 2: VBR MP3 quality ~190 kbps.
  if ! ffmpeg -y -ss "$start_time" -i "$tmpfile" \
    -to "$out_duration" \
    -af "afade=t=in:d=${fade_in},afade=t=out:st=${fade_out_start}:d=${fade_out}" \
    -vn -acodec libmp3lame -q:a 2 \
    "$output_path"; then
    echo "[$title] Error: ffmpeg failed" >&2
    rm -rf "$tmpdir"
    errors=$((errors + 1))
    continue
  fi

  rm -rf "$tmpdir"
  echo "[$title] Done — $output_path"
done < <(jq -c '.conditions[].songs[], .error.songs[]' /app/src/data/songs.json)

if [[ -n "$title_filter" ]] && [[ $matched -eq 0 ]]; then
  echo "Error: no song matched \"$title_filter\"" >&2
  exit 1
fi

exit $errors
