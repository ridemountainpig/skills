#!/bin/bash
# Review a rendered film: bash afterglow/review.sh out/film.mp4
# Writes <film>-contact.jpg (one frame per second) and <film>-chapters.jpg (the middle of each chapter, full size halves),
# prints duration, loudness and true peak against the targets (about -16 LUFS, true peak <= -1 dBTP).
F=$1; B=${F%.*}
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate -of compact "$F" | sed 's/^/[render] /'
ROWS=$(python3 -c "import math;print(math.ceil(float($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F"))/4))")
ffmpeg -v error -y -i "$F" -vf "fps=1,scale=480:-1,tile=4x$ROWS" -frames:v 1 "$B-contact.jpg" && echo "[review] contact sheet -> $B-contact.jpg"
if [ -f out/timeline.json ]; then
  TS=$(python3 -c "import json;d=json.load(open('out/timeline.json'));print(' '.join(str(round((c['t0']+c['t1'])/2,2)) for c in d['chapters']))")
  i=0; for t in $TS; do ffmpeg -v error -y -ss $t -i "$F" -frames:v 1 -vf scale=960:-1 /tmp/ag_ch$i.png; i=$((i+1)); done
  ffmpeg -v error -y $(for j in $(seq 0 $((i-1))); do echo -i /tmp/ag_ch$j.png; done) -filter_complex "$(for j in $(seq 0 $((i-1))); do printf "[$j]"; done)vstack=$i" "$B-chapters.jpg" && echo "[review] chapter frames -> $B-chapters.jpg"
  python3 -c "import json;r=json.load(open('out/timeline.json')).get('review',[]);print('\n'.join('[review] '+x for x in r) or '[review] page checks OK')"
fi
L=$(ffmpeg -hide_banner -i "$F" -af loudnorm=print_format=summary -f null - 2>&1)
I=$(echo "$L" | awk '/Input Integrated/{print $3}'); P=$(echo "$L" | awk '/Input True Peak/{print $4}')
if [ -z "$I" ]; then echo "[review] FIX no audio track"; else
  python3 -c "i=float('$I');p=float('$P');print('[review]', 'OK ' if -18<=i<=-14 and p<=-1 else 'FIX', f'loudness {i} LUFS (target -16), true peak {p} dBTP (<= -1)')"; fi
