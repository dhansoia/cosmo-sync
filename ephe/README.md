# Swiss Ephemeris Data Files

This directory is reserved for Swiss Ephemeris `.se1` binary data files.
They are required if/when `swisseph` replaces `astronomy-engine` as the
calculation backend.

## Why this directory exists

`swisseph` calls `swe_set_ephe_path()` pointing here at startup.
Without the data files it falls back to the built-in Moshier algorithm
(lower accuracy). With the files, accuracy is sub-arcsecond.

## How to download

The files are provided free of charge by Astrodienst (Swiss Ephemeris authors):

1. Visit: https://www.astro.com/ftp/swisseph/ephe/
2. Download the range you need:
   - `seas_18.se1` … `seas_24.se1`  → 1800–2400 CE (recommended)
   - `semo_18.se1` … `semo_24.se1`  → Moon (high precision)
   - `sepl_18.se1` … `sepl_24.se1`  → Outer planets
3. Place all `.se1` files in this directory.
4. The `.gitignore` in the repo root already excludes `*.se1` from version
   control (these are large binaries — do not commit them).

## Current backend

The engine currently uses `astronomy-engine` (pure TypeScript, VSOP87-level
accuracy, no compilation required). To switch to `swisseph`:

1. Install Visual Studio with "Desktop development with C++" workload.
2. Run: `npm install swisseph`
3. Replace the `astronomy-engine` calls in `lib/astro/AstroEngine.ts`
   with the `swisseph` equivalents (same formula interface).
4. Uncomment the `serverComponentsExternalPackages: ['swisseph']` line
   in `next.config.ts` (it is already present and ready).
