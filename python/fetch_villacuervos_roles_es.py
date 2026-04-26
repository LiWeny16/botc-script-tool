#!/usr/bin/env python3
"""Fetch Spanish role names and abilities from Villacuervos.

Villacuervos pages are rendered by a SPA. The visible role pages are backed by
the same-origin JSON endpoint used here, so the script stays dependency-free
and repeatable while still sourcing Villacuervos page data.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "src" / "data" / "roles.json"
DEFAULT_OUTPUT = ROOT / "src" / "data" / "rolesEs.json"
DEFAULT_MISSING_LOG = ROOT / "python" / "villacuervos_missing_pages.txt"
VILLACUERVOS_API = "https://villacuervos.es/api/roles/with-filters/"
VILLACUERVOS_PAGE = "https://villacuervos.es/wiki/personaje/"
USER_AGENT = "botc-script-generator-modern/1.0 (+https://villacuervos.es/)"


def normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def role_keys(role: dict) -> list[str]:
    role_id = str(role.get("id") or "").strip()
    candidates = [role_id, normalize_key(role_id)]

    seen: set[str] = set()
    keys: list[str] = []
    for candidate in candidates:
        if candidate and candidate not in seen:
            keys.append(candidate)
            seen.add(candidate)
    return keys


def read_json(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array")
    return data


def fetch_villacuervos_roles(timeout: float) -> list[dict]:
    request = Request(
        VILLACUERVOS_API,
        headers={
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            payload = response.read().decode(charset, errors="replace")
    except HTTPError as exc:
        raise RuntimeError(f"Villacuervos API returned HTTP {exc.code}") from exc
    except URLError as exc:
        raise RuntimeError(f"Could not reach Villacuervos API: {exc.reason}") from exc

    data = json.loads(payload)
    if not isinstance(data, list):
        raise ValueError("Villacuervos API returned an unexpected payload")
    return data


def build_villacuervos_index(items: list[dict]) -> dict[str, dict]:
    index: dict[str, dict] = {}
    for item in items:
        key = str(item.get("key") or "").strip()
        if not key:
            continue
        # Keep the first item for a key. The endpoint currently returns unique
        # keys, but this avoids unstable output if that changes.
        index.setdefault(key, item)
        index.setdefault(normalize_key(key), item)
    return index


def extract_translation(item: dict) -> tuple[str, str]:
    translation = item.get("translation") or {}
    name = str(translation.get("name") or "").strip()
    ability = str(translation.get("ability") or "").strip()
    return name, ability


def build_payload(roles: list[dict], villacuervos: dict[str, dict]) -> tuple[list[dict], list[str]]:
    output: list[dict] = []
    missing: list[str] = []

    for role in roles:
        role_id = str(role.get("id") or "").strip()
        fallback_name = str(role.get("name") or role_id).strip()
        item = next((villacuervos.get(key) for key in role_keys(role) if villacuervos.get(key)), None)

        if not item:
            missing.append(f"{role_id}\t{fallback_name}\tmissing Villacuervos page/data")
            continue

        name, ability = extract_translation(item)
        if not name or not ability:
            missing.append(f"{role_id}\t{fallback_name}\tincomplete Spanish name/ability")
            continue

        key = str(item.get("key") or role_id)
        output.append(
            {
                "id": role_id,
                "name": name,
                "ability": ability,
                "source": VILLACUERVOS_PAGE + key,
            }
        )

    return output, missing


def write_json(path: Path, payload: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")


def write_missing_log(path: Path, missing: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = "\n".join(missing)
    path.write_text(f"{text}\n" if text else "", encoding="utf-8")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--missing-log", type=Path, default=DEFAULT_MISSING_LOG)
    parser.add_argument("--timeout", type=float, default=60.0)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])

    roles = read_json(args.input)
    villacuervos_items = fetch_villacuervos_roles(args.timeout)
    villacuervos_index = build_villacuervos_index(villacuervos_items)
    payload, missing = build_payload(roles, villacuervos_index)

    write_json(args.output, payload)
    write_missing_log(args.missing_log, missing)

    print(f"Loaded {len(roles)} roles from {args.input}")
    print(f"Loaded {len(villacuervos_items)} Villacuervos roles from {VILLACUERVOS_API}")
    print(f"Wrote {len(payload)} translated roles -> {args.output}")
    print(f"Recorded {len(missing)} missing/incomplete roles -> {args.missing_log}")
    return 0 if payload else 1


if __name__ == "__main__":
    raise SystemExit(main())
