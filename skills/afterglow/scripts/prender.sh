#!/bin/bash
# Parallel render: bash afterglow/prender.sh <out.mp4> [query]   e.g.  bash afterglow/prender.sh out/film-paper.mp4 palette=paper
# Splits the film into 4 frame ranges, renders them at once, joins them. Needs out/timeline.json
# (node afterglow/render.mjs --root . --page film/film.html --timeline out/timeline.json).
set -e
OUT=$1; QUERY=${2:-x=1}; N=${N:-4}
read DUR FPS < <(python3 -c "import json;d=json.load(open('out/timeline.json'));print(d['duration'],d['fps'])")
SEG=$(mktemp -d out/seg.XXXX); PIDS=
for i in $(seq 0 $((N-1))); do
  A=$(python3 -c "print(round($DUR*$i/$N*$FPS)/$FPS)"); B=$(python3 -c "print(round($DUR*($i+1)/$N*$FPS)/$FPS)")
  node afterglow/render.mjs --root . --page film/film.html --from $A --to $B --query "$QUERY" --out $SEG/s$i.mp4 > $SEG/log$i.txt 2>&1 &
  PIDS="$PIDS $!"
done
FAIL=0; for p in $PIDS; do wait $p || FAIL=1; done
# a segment whose browser crashed leaves a short file: check every segment's frame count
for i in $(seq 0 $((N-1))); do
  A=$(python3 -c "print(round($DUR*$i/$N*$FPS))"); B=$(python3 -c "print(round($DUR*($i+1)/$N*$FPS))")
  GOT=$(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 $SEG/s$i.mp4 2>/dev/null || echo 0)
  if [ "$GOT" != "$((B-A))" ]; then echo "[render] FIX segment $i has ${GOT:-0} of $((B-A)) frames; log: $SEG/log$i.txt"; tail -5 $SEG/log$i.txt; FAIL=1; fi
done
[ $FAIL = 0 ] || { echo "[render] FIX parallel render failed, segments kept in $SEG"; exit 1; }
grep -h "\[review\]\|error" $SEG/log0.txt | sort -u || true
for i in $(seq 0 $((N-1))); do echo "file 's$i.mp4'"; done > $SEG/list.txt
ffmpeg -v error -y -f concat -safe 0 -i $SEG/list.txt -c copy $OUT && rm -rf $SEG && echo "joined -> $OUT"
