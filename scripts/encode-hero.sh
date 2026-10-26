#!/usr/bin/env bash
# Encodes the hero video (brief Appendix A). Run locally; requires ffmpeg (with libx264, libvpx-vp9, libaom/libsvtav1 for AVIF).
# Input:  assets-src/hero-source.mp4   Output: public/media/hero.{mp4,webm}, hero-poster.{jpg,avif}
set -euo pipefail
SRC=${1:-assets-src/hero-source.mp4}
OUT=public/media
DUR=10
XF=0.8
mkdir -p "$OUT"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# 1) trim to 10 s and crossfade the last 0.8 s into the first 0.8 s → seamless loop
ffmpeg -y -v error -i "$SRC" -t "$DUR" -an -vf "fps=24,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" -c:v libx264 -crf 12 -preset fast "$TMP/trim.mp4"
ffmpeg -y -v error -i "$TMP/trim.mp4" -filter_complex \
  "[0:v]split[a][b];[a]trim=start=$XF:end=$DUR,setpts=PTS-STARTPTS[main];[b]trim=start=0:end=$XF,setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration=$XF:offset=$(echo "$DUR - 2*$XF" | bc)[v]" \
  -map "[v]" -c:v libx264 -crf 12 -preset fast "$TMP/loop.mp4"

# 2) delivery formats
ffmpeg -y -v error -i "$TMP/loop.mp4" -c:v libx264 -profile:v high -r 24 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart -an "$OUT/hero.mp4"
ffmpeg -y -v error -i "$TMP/loop.mp4" -c:v libvpx-vp9 -r 24 -crf 36 -b:v 0 -row-mt 1 -an "$OUT/hero.webm"

# 3) posters from frame 0
ffmpeg -y -v error -i "$OUT/hero.mp4" -frames:v 1 -q:v 4 "$OUT/hero-poster.jpg"
ffmpeg -y -v error -i "$OUT/hero.mp4" -frames:v 1 -c:v libaom-av1 -still-picture 1 -crf 32 "$OUT/hero-poster.avif" || echo "AVIF encoder missing — skipped hero-poster.avif"

# 4) budgets (§11): mp4 ≤ 6 MB, webm ≤ 5 MB, poster ≤ 140 KB
size() { stat -c %s "$1" 2>/dev/null || stat -f %z "$1"; }
fail=0
check() { local f=$1 max=$2; local s; s=$(size "$f"); printf '%-28s %8d KB (max %d KB)\n' "$f" $((s / 1024)) $((max / 1024)); [ "$s" -le "$max" ] || fail=1; }
check "$OUT/hero.mp4" $((6 * 1024 * 1024))
check "$OUT/hero.webm" $((5 * 1024 * 1024))
check "$OUT/hero-poster.jpg" $((140 * 1024))
[ -f "$OUT/hero-poster.avif" ] && check "$OUT/hero-poster.avif" $((140 * 1024))
if [ "$fail" -ne 0 ]; then echo "Budget exceeded — raise -crf and re-run." >&2; exit 1; fi
echo "Done. Rebuild the site: the hero switches from the drawing to the video automatically."
