#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  analyze-reference-video.sh INPUT_VIDEO OUTPUT_DIR [OVERVIEW_SECONDS] [DENSE_SECONDS] [SCENE_THRESHOLD]

Creates, without modifying the input:
  metadata.json
  metadata.txt
  overview-frames/ and overview-sheet-*.jpg
  dense-frames/ and dense-sheet-*.jpg
  scene-candidates/ and scene-candidates.txt
  transition-strips/strip-*.jpg

Defaults:
  OVERVIEW_SECONDS=1
  DENSE_SECONDS=0.25
  SCENE_THRESHOLD=0.16
USAGE
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 2 || $# -gt 5 ]]; then
  usage >&2
  exit 2
fi

input=$1
output=$2
overview_seconds=${3:-1}
dense_seconds=${4:-0.25}
scene_threshold=${5:-0.16}

for command_name in ffmpeg ffprobe awk; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$command_name" >&2
    exit 1
  fi
done

if [[ ! -f "$input" ]]; then
  printf 'Input video does not exist: %s\n' "$input" >&2
  exit 1
fi

if [[ -z "$output" || "$output" == "/" ]]; then
  printf 'Refusing unsafe output directory: %s\n' "$output" >&2
  exit 1
fi

number_pattern='^[0-9]+([.][0-9]+)?$'
for number_value in "$overview_seconds" "$dense_seconds" "$scene_threshold"; do
  if [[ ! "$number_value" =~ $number_pattern ]]; then
    printf 'Expected a non-negative number, received: %s\n' "$number_value" >&2
    exit 1
  fi
done

if [[ "$overview_seconds" == "0" || "$dense_seconds" == "0" ]]; then
  printf 'Sampling intervals must be greater than zero.\n' >&2
  exit 1
fi

overview_dir="$output/overview-frames"
dense_dir="$output/dense-frames"
scene_dir="$output/scene-candidates"
strip_dir="$output/transition-strips"

mkdir -p "$overview_dir" "$dense_dir" "$scene_dir" "$strip_dir"

ffprobe \
  -v error \
  -show_format \
  -show_streams \
  -of json \
  "$input" > "$output/metadata.json"

{
  printf 'input=%s\n' "$input"
  ffprobe \
    -v error \
    -select_streams v:0 \
    -show_entries stream=codec_name,width,height,r_frame_rate,avg_frame_rate,nb_frames,duration \
    -show_entries format=duration,size,bit_rate \
    -of default=noprint_wrappers=1 \
    "$input"
} > "$output/metadata.txt"

ffmpeg \
  -hide_banner \
  -loglevel error \
  -y \
  -i "$input" \
  -vf "fps=1/${overview_seconds},scale=480:-2" \
  "$overview_dir/frame_%05d.jpg"

ffmpeg \
  -hide_banner \
  -loglevel error \
  -y \
  -framerate "1/${overview_seconds}" \
  -i "$overview_dir/frame_%05d.jpg" \
  -vf "tile=6x4:padding=2:margin=2:color=black" \
  -fps_mode vfr \
  "$output/overview-sheet-%03d.jpg"

ffmpeg \
  -hide_banner \
  -loglevel error \
  -y \
  -i "$input" \
  -vf "fps=1/${dense_seconds},scale=320:-2" \
  "$dense_dir/frame_%05d.jpg"

ffmpeg \
  -hide_banner \
  -loglevel error \
  -y \
  -framerate "1/${dense_seconds}" \
  -i "$dense_dir/frame_%05d.jpg" \
  -vf "tile=8x4:padding=2:margin=2:color=black" \
  -fps_mode vfr \
  "$output/dense-sheet-%03d.jpg"

ffmpeg \
  -hide_banner \
  -loglevel info \
  -y \
  -i "$input" \
  -vf "select='gt(scene,${scene_threshold})',showinfo,scale=640:-2" \
  -fps_mode vfr \
  "$scene_dir/scene-%05d.jpg" \
  2> "$output/scene-detect.log" || true

awk '
  match($0, /pts_time:[0-9.]+/) {
    value = substr($0, RSTART + 9, RLENGTH - 9)
    if (value != previous) {
      print value
      previous = value
    }
  }
' "$output/scene-detect.log" > "$output/scene-candidates.txt"

strip_index=1
while IFS= read -r timestamp; do
  [[ -n "$timestamp" ]] || continue
  start=$(awk -v t="$timestamp" 'BEGIN { value = t - 0.6; if (value < 0) value = 0; printf "%.3f", value }')
  strip_name=$(printf 'strip-%03d' "$strip_index")
  strip_frames="$strip_dir/${strip_name}-frames"
  mkdir -p "$strip_frames"

  ffmpeg \
    -nostdin \
    -hide_banner \
    -loglevel error \
    -y \
    -ss "$start" \
    -t 1.4 \
    -i "$input" \
    -vf "fps=12,scale=320:-2" \
    "$strip_frames/frame_%03d.jpg"

  ffmpeg \
    -nostdin \
    -hide_banner \
    -loglevel error \
    -y \
    -framerate 12 \
    -i "$strip_frames/frame_%03d.jpg" \
    -vf "tile=6x3:padding=2:margin=2:color=black" \
    -frames:v 1 \
    "$strip_dir/${strip_name}-at-${timestamp}s.jpg"

  strip_index=$((strip_index + 1))
done < "$output/scene-candidates.txt"

printf 'Reference analysis written to: %s\n' "$output"
