#!/bin/bash
# parallel render: prender.sh <out.mp4> <blur> ; splits the film into 4 frame ranges, renders them at once, joins them
OUT=$1; BLUR=${2:-1}; DUR=$(python3 -c "import json;print(json.load(open('out/timeline.json'))['duration'])")
N=4; mkdir -p out/seg; rm -f out/seg/*
for i in $(seq 0 $((N-1))); do
  A=$(python3 -c "print(round($DUR*$i/$N*24)/24)"); B=$(python3 -c "print(round($DUR*($i+1)/$N*24)/24)")
  node sf/render.mjs --root . --page film/film.html --from $A --to $B --blur $BLUR --out out/seg/s$i.mp4 > out/seg/log$i.txt 2>&1 &
done
wait
for i in $(seq 0 $((N-1))); do echo "file 's$i.mp4'"; done > out/seg/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/seg/list.txt -c copy $OUT && echo "joined -> $OUT"
