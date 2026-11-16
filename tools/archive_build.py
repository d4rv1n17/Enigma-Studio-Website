"""Greywood Archive: encrypts the dossiers into assets/archive/vault.json.

The plain text of the dossiers is NOT kept in this repository (it would spoil the
codes). Run:  python tools/archive_build.py path/to/dossiers.py

Each code turns into a key with PBKDF2-SHA256 (one salt for the whole vault, many
iterations so guessing is slow), and every dossier is sealed with AES-256-GCM under
the key of each code that opens it. The page derives the key from what the visitor
types and tries it on every sealed entry; only the right code opens anything.
"""
import base64, json, os, re, runpy, sys, unicodedata
from pathlib import Path
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ITER = 310_000
OUT = Path(__file__).resolve().parent.parent / "assets" / "archive" / "vault.json"
b64 = lambda b: base64.b64encode(b).decode()


def norm(code):
    # same rule as src/archive.js: upper case, Ё = Е, only letters and digits
    s = unicodedata.normalize("NFC", code).upper().replace("Ё", "Е")
    return re.sub(r"[^0-9A-ZА-ЯІЇЄҐ]", "", s)


def key(code, salt):
    return PBKDF2HMAC(hashes.SHA256(), 32, salt, ITER).derive(norm(code).encode("utf-8"))


def main(src):
    dossiers = runpy.run_path(src)["D"]
    salt = os.urandom(16)
    items = []
    for i, d in enumerate(dossiers):
        payload = json.dumps({"slot": i, "no": d["no"], "frag": d["frag"], "title": d["title"], "body": d["body"]}, ensure_ascii=False).encode()
        for code in dict.fromkeys(norm(c) for c in d["codes"]):
            iv = os.urandom(12)
            items.append({"iv": b64(iv), "ct": b64(AESGCM(key(code, salt)).encrypt(iv, payload, None))})
    import random
    random.shuffle(items)  # the order says nothing about which code opens what
    OUT.write_text(json.dumps({"v": 1, "kdf": "PBKDF2-SHA256", "iter": ITER, "salt": b64(salt), "items": items}), encoding="utf-8")
    print(f"{len(dossiers)} dossiers, {len(items)} sealed entries -> {OUT}")


if __name__ == "__main__":
    main(sys.argv[1])
