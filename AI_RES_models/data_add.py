#!/usr/bin/env python3
"""
calculate_ghi_only.py

- Strict purpose: read a CSV, compute a single new column "GHI" per row as the sum of available
  POA components (poa_direct + poa_diffuse + poa_sky_diffuse + poa_ground_diffuse),
  and write an output CSV with the new column appended.
- Includes progress bar, ETA, and clear console messages (uses tqdm + colorama).
- DOES NOT touch or create any timestamp columns.

Usage:
  - Edit INPUT_PATH and OUTPUT_PATH if needed, then run:
      python calculate_ghi_only.py

Notes:
  - The script auto-detects POA column names case-insensitively.
  - If a component column is missing, it is treated as zero for the sum.
  - If *all* components are missing for a row, GHI is set to NaN.
  - Processes the file in chunks to be memory-friendly and shows progress/ETA.
"""
import os
import sys
import pandas as pd
import numpy as np
from tqdm import tqdm
from colorama import init as colorama_init, Fore, Style

colorama_init(autoreset=True)

# ---------- USER CONFIG ----------
# The user-uploaded file path from conversation history (kept here as default per instruction).
# If you want to use a .csv file on your disk, replace this path with that CSV path.
INPUT_PATH = "D:/AI_RES_models/karnataka_data.csv"
# Example CSV alternative:
# INPUT_PATH = ""

OUTPUT_PATH = "D:/AI_RES_models/output_with_ghi.csv"
CHUNKSIZE = 200000   # rows per chunk; tune based on memory (200k is a good starting point)
# ----------------------------------

def _print_info(msg):
    print(Fore.CYAN + "[INFO] " + Style.RESET_ALL + msg)

def _print_ok(msg):
    print(Fore.GREEN + "[OK]   " + Style.RESET_ALL + msg)

def _print_warn(msg):
    print(Fore.YELLOW + "[WARN] " + Style.RESET_ALL + msg)

def _print_err(msg):
    print(Fore.RED + "[ERR]  " + Style.RESET_ALL + msg)

def find_column_ignore_case(cols, candidates):
    lower = {c.lower().strip(): c for c in cols}
    for cand in candidates:
        key = cand.lower().strip()
        if key in lower:
            return lower[key]
    return None

def detect_poa_columns(columns):
    """Return a tuple of (poa_direct, poa_diffuse, poa_sky, poa_ground) or None when not found."""
    cand_direct = ["poa_direct", "poa direct", "direct", "poa_direct_irradiance"]
    cand_diffuse = ["poa_diffuse", "poa diffuse", "diffuse", "poa_diffuse_irradiance"]
    cand_sky = ["poa_sky_diffuse", "poa_sky", "sky_diffuse", "sky"]
    cand_ground = ["poa_ground_diffuse", "poa_ground", "ground_diffuse", "ground"]
    return (
        find_column_ignore_case(columns, cand_direct),
        find_column_ignore_case(columns, cand_diffuse),
        find_column_ignore_case(columns, cand_sky),
        find_column_ignore_case(columns, cand_ground),
    )

def estimate_total_rows(path):
    """Estimate total rows (fast-ish). Falls back to None on failure."""
    try:
        with open(path, "rb") as f:
            # Count newline bytes - memory efficient
            count = 0
            buf_size = 1024 * 1024
            while True:
                b = f.read(buf_size)
                if not b:
                    break
                count += b.count(b"\n")
        # subtract header (we assume 1 header line). If file ends without newline difference minimal.
        return max(0, count - 1)
    except Exception:
        return None

def main():
    _print_info("Starting GHI-only processing...")
    if not os.path.exists(INPUT_PATH):
        _print_err(f"Input file not found: {INPUT_PATH}")
        sys.exit(1)

    # Quick sanity: ensure it's a CSV (file extension check only)
    if not INPUT_PATH.lower().endswith((".csv", ".txt")):
        _print_warn(f"Input file does not have .csv extension. Attempting to read anyway. Path: {INPUT_PATH}")

    total_rows = estimate_total_rows(INPUT_PATH)
    if total_rows is None:
        _print_warn("Could not estimate total rows. Progress will show chunks processed (no percent).")
    else:
        _print_info(f"Estimated total data rows (excluding header): {total_rows:,}")

    # Remove existing output if any (we'll write fresh)
    if os.path.exists(OUTPUT_PATH):
        _print_warn(f"Output file {OUTPUT_PATH} exists and will be overwritten.")
        try:
            os.remove(OUTPUT_PATH)
        except Exception as e:
            _print_err(f"Could not remove existing output file: {e}")
            sys.exit(1)

    # Read first chunk to detect columns and prepare header writing
    _print_info("Reading first chunk to detect columns and POA component names...")
    try:
        it = pd.read_csv(INPUT_PATH, chunksize=CHUNKSIZE, iterator=True, low_memory=False)
    except Exception as e:
        _print_err(f"Failed to open input as CSV: {e}")
        sys.exit(1)

    try:
        first_chunk = next(it)
    except StopIteration:
        _print_err("Input CSV appears empty.")
        sys.exit(1)
    except Exception as e:
        _print_err(f"Error reading first chunk: {e}")
        sys.exit(1)

    # Normalize columns
    first_chunk.columns = [c.strip() for c in first_chunk.columns]
    poa_cols = detect_poa_columns(first_chunk.columns)
    _print_info("Detected POA columns (or None):")
    _print_info(f"  poa_direct: {poa_cols[0]}")
    _print_info(f"  poa_diffuse: {poa_cols[1]}")
    _print_info(f"  poa_sky: {poa_cols[2]}")
    _print_info(f"  poa_ground: {poa_cols[3]}")

    # Prepare output CSV header: same columns as input + GHI
    out_columns = list(first_chunk.columns) + ["GHI"]
    # Write header now (we will append chunks)
    pd.DataFrame(columns=out_columns).to_csv(OUTPUT_PATH, index=False)

    # Function to compute GHI for a dataframe chunk (vectorized)
    def compute_ghi_chunk(df_chunk, poa_cols_tuple):
        # ensure columns cleaned
        df_chunk.columns = [c.strip() for c in df_chunk.columns]
        # prepare components
        comps = []
        present_mask = []
        for col in poa_cols_tuple:
            if col is not None and col in df_chunk.columns:
                ser = pd.to_numeric(df_chunk[col], errors="coerce")
                comps.append(ser.fillna(0.0))
                present_mask.append(~ser.isna())
            else:
                comps.append(pd.Series(0.0, index=df_chunk.index))
                present_mask.append(pd.Series(False, index=df_chunk.index))
        ghi = comps[0] + comps[1] + comps[2] + comps[3]
        any_present = present_mask[0] | present_mask[1] | present_mask[2] | present_mask[3]
        ghi.loc[~any_present] = np.nan
        return ghi

    # Process the first chunk and then subsequent chunks with progress bar
    processed = 0
    # Compute GHI for first chunk
    _print_info("Processing chunks and writing output with progress bar...")
    first_chunk["GHI"] = compute_ghi_chunk(first_chunk, poa_cols)
    # Append to output
    first_chunk.to_csv(OUTPUT_PATH, mode="a", index=False, header=False)
    processed += len(first_chunk)

    # If we have an estimated total, initialize tqdm with total_rows; else leave total=None
    pbar = tqdm(total=total_rows if total_rows else None, unit="rows", desc="Rows processed", ncols=100)
    pbar.update(len(first_chunk))

    # Iterate remaining chunks
    for chunk in it:
        chunk.columns = [c.strip() for c in chunk.columns]
        chunk["GHI"] = compute_ghi_chunk(chunk, poa_cols)
        chunk.to_csv(OUTPUT_PATH, mode="a", index=False, header=False)
        processed += len(chunk)
        pbar.update(len(chunk))

    pbar.close()
    _print_ok(f"Finished. Processed {processed:,} rows. Output saved to: {OUTPUT_PATH}")

    # Quick stats summary
    try:
        out_df_sample = pd.read_csv(OUTPUT_PATH, nrows=1000)
        nan_ghi_sample = out_df_sample["GHI"].isna().sum()
        _print_info(f"Sample check (first 1000 rows): GHI NaNs = {nan_ghi_sample}")
    except Exception:
        pass

if __name__ == "__main__":
    main()
