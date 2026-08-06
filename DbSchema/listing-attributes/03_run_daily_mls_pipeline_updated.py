"""
Run the MLS ETL pipeline step-by-step.

Manual step before running:
1) Export MLS CSV files into prod/data/raw/

Then run from project root:
python prod/scripts/run_daily_mls_pipeline.py
"""

import subprocess
import sys
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = PROJECT_ROOT / "prod" / "scripts"


STEPS = [
    {
        "name": "Clean MLS CSV",
        "script": SCRIPT_DIR / "csv_mls_clean.py",
    },
    {
        "name": "Load property dimension",
        "script": SCRIPT_DIR / "dw_load_prprty.py",
    },
    {
        "name": "Load listing dimension",
        "script": SCRIPT_DIR / "dw_load_lstng.py",
    },
    {
        "name": "Load current listing attributes",
        "script": SCRIPT_DIR / "dw_load_lstng_attribute.py",
    },
    {
        "name": "Load status changes",
        "script": SCRIPT_DIR / "dw_load_stts_chg.py",
    },
    {
        "name": "Load closed sales",
        "script": SCRIPT_DIR / "dw_load_clsd_sale.py",
    },
    {
        "name": "Load price history",
        "script": SCRIPT_DIR / "dw_load_prc_hstry.py",
    },
    {
        "name": "Load inventory snapshot",
        "script": SCRIPT_DIR / "dw_load_invntry_snap.py",
        "needs_snapshot_date": True,
    },
    {
        "name": "Load geo property boundaries geo.bndry",
        "script": SCRIPT_DIR / "geo_nearby" / "load_geo_prprty_bndry.py",
    },
    {
        "name": "Synchronize geo entities",
        "script": SCRIPT_DIR / "geo" / "03_sync_geo_entities.py",
    },
]


def run_step(step_number, step, snapshot_date=None):
    print("\n" + "=" * 70)
    print(f"STEP {step_number}: {step['name']}")
    print(f"Running: {step['script']}")
    print("=" * 70)

    cmd = [sys.executable, str(step["script"])]

    if step.get("needs_snapshot_date"):
        cmd.extend(["--snapshot-date", snapshot_date])

    result = subprocess.run(
        cmd,
        cwd=PROJECT_ROOT,
        text=True,
        capture_output=True,
    )

    if result.stdout:
        print(result.stdout)

    if result.stderr:
        print("ERROR OUTPUT:")
        print(result.stderr)

    if result.returncode != 0:
        print(f"\nFAILED: {step['name']}")
        print("Pipeline stopped.")
        sys.exit(result.returncode)

    print(f"SUCCESS: {step['name']}")


def ask_to_continue():
    answer = input("\nContinue to next step? [Y/n]: ").strip().lower()
    if answer in ["n", "no"]:
        print("Pipeline stopped by user.")
        sys.exit(0)


def get_snapshot_date():
    while True:
        snapshot_date = input("\nEnter inventory snapshot date (YYYY-MM-DD): ").strip()
        try:
            datetime.strptime(snapshot_date, "%Y-%m-%d")
            return snapshot_date
        except ValueError:
            print("Invalid date format. Please use YYYY-MM-DD.")


def main():
    print("\nMLS ETL PIPELINE STARTED")
    print(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    snapshot_date = get_snapshot_date()
    print(f"\nInventory Snapshot Date: {snapshot_date}")

    for index, step in enumerate(STEPS, start=1):
        run_step(index, step, snapshot_date=snapshot_date)
        if index < len(STEPS):
            ask_to_continue()

    print("\n" + "=" * 70)
    print("MLS ETL PIPELINE COMPLETED SUCCESSFULLY")
    print(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 70)


if __name__ == "__main__":
    main()
