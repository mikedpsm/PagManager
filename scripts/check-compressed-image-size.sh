#!/usr/bin/env bash
set -euo pipefail

image_ref="${1:?Usage: check-compressed-image-size.sh IMAGE_REF}"
max_bytes=80000000

# Measure the transferable single-platform image as a compressed Docker archive.
size_bytes="$(docker save "$image_ref" | gzip -9 -c | wc -c | tr -d '[:space:]')"
size_mb="$(awk -v bytes="$size_bytes" 'BEGIN { printf "%.2f", bytes / 1000000 }')"

echo "Compressed image archive: ${size_mb} MB (limit: 80 MB)"

if [ "$size_bytes" -gt "$max_bytes" ]; then
  echo "Image exceeds the 80 MB compressed size budget." >&2
  exit 1
fi
