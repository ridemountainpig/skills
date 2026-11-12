#!/bin/bash
# Mux picture and sound with two-pass loudness normalisation to -16 LUFS, true peak -2 dBTP (AAC adds a little).
# The normalised sound is fixed to a WAV first; if the encoded AAC still peaks above -1 dBTP (short clicks have large
# inter-sample peaks), that WAV is turned down by the excess and re-encoded, which is linear and so predictable.
#   bash afterglow/mux.sh out/v.mp4 out/sound.wav out/film.mp4
V=$1; A=$2; O=$3
TMP=$(mktemp -d); trap 'rm -rf -- "$TMP"' EXIT
M=$(ffmpeg -hide_banner -i "$A" -af loudnorm=I=-16:TP=-2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
F="loudnorm=I=-16:TP=-2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
ffmpeg -v error -y -i "$A" -af "$F,aresample=48000" -c:a pcm_s24le "$TMP/norm.wav" || exit 1
mux() { ffmpeg -v error -y -i "$V" -i "$TMP/norm.wav" -map 0:v:0 -map 1:a:0 -af "volume=${1}dB" -c:v copy -c:a aac -b:a 192k -shortest "$O"; }
tp() { ffmpeg -hide_banner -i "$O" -map 0:a:0 -af loudnorm=print_format=summary -f null - 2>&1 | awk '/Input True Peak/{print $4}'; }
mux 0 || exit 1
TP=$(tp); CUT=$(python3 -c "tp=float('$TP');print(round(-1.2 - tp, 2) if tp > -1.0 else 0)")
if [ "$CUT" != "0" ]; then echo "[mux] true peak $TP dBTP after AAC, trimming $CUT dB"; mux "$CUT" || exit 1; fi
echo "muxed -> $O"
