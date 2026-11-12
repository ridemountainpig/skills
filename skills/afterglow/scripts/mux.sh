#!/bin/bash
# Mux picture and sound with two-pass loudness normalisation to -16 LUFS, true peak -2 dBTP (AAC adds a little).
#   bash afterglow/mux.sh out/v.mp4 out/sound.wav out/film.mp4
V=$1; A=$2; O=$3
M=$(ffmpeg -hide_banner -i "$A" -af loudnorm=I=-16:TP=-2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
F="loudnorm=I=-16:TP=-2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
ffmpeg -v error -y -i "$V" -i "$A" -af "$F,aresample=48000" -c:v copy -c:a aac -b:a 192k -shortest "$O" && echo "muxed -> $O"
