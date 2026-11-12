#!/usr/bin/env bash
# Downloads the open-source samples used by the desk sequencer into prototypes/assets/samples/.
#
# Sources (pinned):
#   - TR808EmulationKit by ArtemioLabs, from the Hydrogen drum machine (GPL-2.0). Copied unmodified.
#   - Versilian Community Sample Library (VCSL) by Versilian Studios (CC0-1.0). Trimmed to mono FLAC.
#
# Requires curl and ffmpeg. Without a local ffmpeg, run it through Nix:
#   nix shell nixpkgs#ffmpeg --command scripts/fetch-sequencer-samples.sh
set -euo pipefail

readonly HYDROGEN_COMMIT="a612c74060d68d443d75bd61daf7e5fd46d6f0dc"
readonly VCSL_COMMIT="c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e"
readonly HYDROGEN_RAW="https://raw.githubusercontent.com/hydrogen-music/hydrogen/${HYDROGEN_COMMIT}"
readonly VCSL_RAW="https://raw.githubusercontent.com/sgossner/VCSL/${VCSL_COMMIT}"

root="$(cd "$(dirname "$0")/.." && pwd)"
output_dir="$root/prototypes/assets/samples"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

command -v ffmpeg >/dev/null || { echo "fetch-sequencer-samples: ffmpeg is required (see header)" >&2; exit 1; }

url_encode() { python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$1"; }

# convert <vcsl path> <output file> <seconds>: mono, 44.1 kHz, trimmed with a short fade-out.
convert() {
  local source="$1" target="$2" seconds="$3"
  local fade_start
  fade_start="$(python3 -c "print(max(0, $seconds - 0.08))")"
  curl -fsSL "${VCSL_RAW}/$(url_encode "$source")" -o "$work_dir/source.wav"
  ffmpeg -loglevel error -y -i "$work_dir/source.wav" -ac 1 -ar 44100 -t "$seconds" \
    -af "afade=t=out:st=${fade_start}:d=0.08" -compression_level 8 "$target"
}

rm -rf "$output_dir"
mkdir -p "$output_dir/tr808" "$output_dir/vcsl"

for name in Kick_Long Kick_Short Snare_1 Snare_2 Clap Hat_Closed Hat_Open Hat_Pedal Tom_Low Tom_Mid Tom_Hi Cowbell Shaker Clave Conga Cymbal; do
  curl -fsSL "${HYDROGEN_RAW}/data/drumkits/TR808EmulationKit/808_${name}.flac" -o "$output_dir/tr808/${name}.flac"
done
curl -fsSL "${HYDROGEN_RAW}/COPYING" -o "$output_dir/tr808/COPYING"
cat > "$output_dir/tr808/SOURCE.txt" <<EOF
TR808EmulationKit by ArtemioLabs (http://artemiolabs.com), distributed with the Hydrogen drum machine.
License: GNU General Public License, version 2 (see COPYING in this directory).
Source: https://github.com/hydrogen-music/hydrogen/tree/${HYDROGEN_COMMIT}/data/drumkits/TR808EmulationKit
The files are unmodified copies of 808_<name>.flac, renamed to <name>.flac.
EOF

membranes="Membranophones/Struck Membranophones"
idiophones="Idiophones/Struck Idiophones"
mkdir -p "$output_dir/vcsl/drums"
convert "$membranes/Bass Drum 2/bassdrum_hit_f.wav" "$output_dir/vcsl/drums/kick.flac" 1.2
convert "$membranes/Snare Drum, Modern 1/Snare2_HitNS_v5_rr1_Mid.wav" "$output_dir/vcsl/drums/snare.flac" 0.8
convert "$idiophones/Hi-Hat Cymbal/HiHat_HitC_v3_rr1_Mid.wav" "$output_dir/vcsl/drums/hat.flac" 0.6
convert "$idiophones/Hi-Hat Cymbal/HiHat_HitO_rr1_Mid.wav" "$output_dir/vcsl/drums/open-hat.flac" 1.2
convert "$membranes/Tom 1/Stick/TomH_HitS_v3_rr1_Mid.wav" "$output_dir/vcsl/drums/tom.flac" 1.0
convert "$idiophones/Claps/Clap_rr1.wav" "$output_dir/vcsl/drums/clap.flac" 0.6
convert "$idiophones/Cowbells/Cowbell1_Hit_v3_rr1_Mid.wav" "$output_dir/vcsl/drums/cowbell.flac" 0.8
convert "$idiophones/Tambourine 1/Tamb1_Hit_v2_rr1_Mid.wav" "$output_dir/vcsl/drums/tambourine.flac" 0.8
convert "$idiophones/Shaker, Small/Mid_ShakerDouble_Down_rr1.wav" "$output_dir/vcsl/drums/shaker.flac" 0.4

# Pitched instruments: one velocity layer, sampled every few semitones and repitched in between.
fm_and_clavi_notes="C1 G#1 C2 G#2 C3 G#3 C4 G#4 C5 G#5 C6"
mkdir -p "$output_dir/vcsl/fm-piano" "$output_dir/vcsl/clavisynth" "$output_dir/vcsl/vibraphone" "$output_dir/vcsl/marimba" "$output_dir/vcsl/glockenspiel"
for note in $fm_and_clavi_notes; do
  convert "Electrophones/TX81Z/FM Piano/FMPiano_${note}_vl2.wav" "$output_dir/vcsl/fm-piano/${note/\#/s}.flac" 1.6
  convert "Electrophones/TX81Z/Clavisynth/Clavisynth_${note}_vl2.wav" "$output_dir/vcsl/clavisynth/${note/\#/s}.flac" 1.0
done
for note in F2 A2 C3 E3 G3 B3 D4 F4 A4 C5 E5; do
  convert "$idiophones/Vibraphone/Hard Mallets/Vibes_hard_${note}_v2_rr1_Main.wav" "$output_dir/vcsl/vibraphone/${note}.flac" 2.0
done
for note in F1 C2 G2 B2 F3 C4 G4 B4 F5 C6; do
  convert "$idiophones/Marimba/Marimba_hit_Outrigger_${note}_med_01.wav" "$output_dir/vcsl/marimba/${note}.flac" 1.2
done
for note in G4 C5 G5 C6 G6 C7; do
  convert "$idiophones/Glockenspiel/glock_medium_${note}_01.wav" "$output_dir/vcsl/glockenspiel/${note}.flac" 1.5
done
cat > "$output_dir/vcsl/SOURCE.txt" <<EOF
Versilian Community Sample Library (VCSL) by Versilian Studios.
License: CC0 1.0 Universal (public domain dedication).
Source: https://github.com/sgossner/VCSL/tree/${VCSL_COMMIT}
Files were converted to mono 44.1 kHz FLAC and trimmed with a short fade-out by scripts/fetch-sequencer-samples.sh.
EOF

echo "fetch-sequencer-samples: wrote $output_dir ($(du -sh "$output_dir" | cut -f1), $(find "$output_dir" -name '*.flac' | wc -l | tr -d ' ') samples)"
