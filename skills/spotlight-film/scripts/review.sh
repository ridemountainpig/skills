#!/usr/bin/env bash
# Review evidence for a rendered film, in forms Claude can actually read (stills).
#
#   review.sh stills <dir-with-pngs> [cols]        -> <dir>/../stills-sheet.jpg
#   review.sh video  <film.mp4> [timeline.json]    -> <film>-review/
#
# video mode writes:
#   contact.jpg      uniform 1 fps contact sheet (repeated holds show up as repeats)
#   cuts/cut-XX.jpg  the 2 frames before and 2 after each cut (native frames)
#   strips/shot-*.jpg 8 evenly spaced frames per shot (motion direction, speed, easing)
#   motion.txt       mean absolute frame difference per frame (spikes = cuts, flats = holds)
set -euo pipefail
mode=${1:-}; src=${2:-}
[[ -n "$mode" && -n "$src" ]] || { sed -n '2,13p' "$0"; exit 2; }

if [[ $mode == stills ]]; then
  cols=${3:-4}
  ffmpeg -loglevel error -y -pattern_type glob -i "$src/*.png" \
    -vf "scale=480:-2,tile=${cols}x$(( ( $(ls "$src"/*.png | wc -l) + cols - 1 ) / cols )):padding=4:color=0x333333" \
    -frames:v 1 "$src/../$(basename "$src")-sheet.jpg"
  echo "sheet -> $src/../$(basename "$src")-sheet.jpg"
  exit 0
fi

out="${src%.*}-review"
mkdir -p "$out/cuts" "$out/strips"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$src")
fpsn=$(awk -v f="$fps" 'BEGIN{split(f,a,"/"); printf "%.6f", (a[2]?a[1]/a[2]:a[1])}')
rows=$(awk -v d="$dur" 'BEGIN{printf "%d", (d+5)/6}')

ffmpeg -loglevel error -y -i "$src" -vf "fps=1,scale=320:-2,tile=6x${rows}:padding=3:color=0x333333" -frames:v 1 "$out/contact.jpg"

ffmpeg -loglevel error -i "$src" -vf "scale=160:-2,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - 2>/dev/null \
  | awk '/pts_time/{split($0,a,"pts_time:"); t=a[2]} /YAVG/{split($0,b,"="); printf "%.3f %.2f\n", t, b[2]}' > "$out/motion.txt" || true

timeline=${3:-}
if [[ -n "$timeline" && -f "$timeline" ]]; then
  cuts=$(python3 -c "import json,sys; print(' '.join(str(c) for c in json.load(open(sys.argv[1]))['cuts']))" "$timeline")
  shots=$(python3 -c "import json,sys; print(' '.join(f\"{s['id']}:{s['start']}:{s['end']}\" for s in json.load(open(sys.argv[1]))['shots']))" "$timeline")
else
  cuts=$(awk '$2>25{print $1}' "$out/motion.txt" | tr '\n' ' ')
  shots=""
fi

i=1
for c in $cuts; do
  start=$(awk -v c="$c" -v f="$fpsn" 'BEGIN{v=c-2/f; if(v<0)v=0; printf "%.4f", v}')
  ffmpeg -loglevel error -y -ss "$start" -i "$src" -vf "select='lt(n\,4)',scale=480:-2,tile=4x1:padding=3:color=0xff0000" -frames:v 1 "$out/cuts/cut-$(printf %02d $i)-at-${c}s.jpg"
  i=$((i+1))
done

for s in $shots; do
  IFS=: read -r id a b <<< "$s"
  step=$(awk -v a="$a" -v b="$b" 'BEGIN{printf "%.4f", (b-a)/8}')
  ffmpeg -loglevel error -y -ss "$a" -t "$(awk -v a="$a" -v b="$b" 'BEGIN{print b-a}')" -i "$src" \
    -vf "fps=1/${step},scale=360:-2,tile=8x1:padding=3:color=0x333333" -frames:v 1 "$out/strips/shot-${a}-${id}.jpg"
done

echo "review -> $out"
