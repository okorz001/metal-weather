#!/usr/bin/env bash
set -euo pipefail

force=false
title_filter=""

for arg in "$@"; do
  if [[ "$arg" == "--force" ]]; then
    force=true
  else
    title_filter="$arg"
  fi
done

errors=0
matched=0

while IFS= read -r song; do
  title=$(echo "$song" | jq -r '.title')
  youtube_id=$(echo "$song" | jq -r '.youtubeId')
  audio_file=$(echo "$song" | jq -r '.audioFile')
  start_time=$(echo "$song" | jq -r '.startTime')
  end_time=$(echo "$song" | jq -r '.endTime')
  fade_in=$(echo "$song" | jq -r '.fadeIn')
  fade_out=$(echo "$song" | jq -r '.fadeOut')

  if [[ -n "$title_filter" ]] && [[ "${title,,}" != "${title_filter,,}" ]]; then
    continue
  fi

  matched=$((matched + 1))
  output_path="/app/public${audio_file}"

  if [[ "$force" == false ]] && [[ -f "$output_path" ]]; then
    echo "[$title] Already exists, skipping (use --force to re-download)"
    continue
  fi

  tmpdir=$(mktemp -d)

  echo "[$title] Downloading..."
  if ! yt-dlp -x -o "$tmpdir/audio.%(ext)s" "https://www.youtube.com/watch?v=$youtube_id"; then
    echo "[$title] Error: yt-dlp failed" >&2
    rm -rf "$tmpdir"
    errors=$((errors + 1))
    continue
  fi

  tmpfile=$(ls "$tmpdir"/audio.* | head -1)
  out_duration=$(( end_time - start_time ))
  fade_out_start=$(( out_duration - fade_out ))

  echo "[$title] Processing..."
  mkdir -p "$(dirname "$output_path")"

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
