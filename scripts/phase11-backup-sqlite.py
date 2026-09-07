#!/usr/bin/env python3
"""Backup consistente de um banco SQLite vivo (usando a API sqlite3.backup).

Uso:  phase11-backup-sqlite.py <arquivo.sqlite de origem> <destino.sqlite>
A origem é aberta em modo somente-leitura; o destino recebe uma cópia
consistente (incluindo WAL). Não modifica o banco de origem.
"""
import sqlite3
import sys


def main() -> int:
    if len(sys.argv) != 3:
        print("uso: phase11-backup-sqlite.py <origem> <destino>", file=sys.stderr)
        return 2
    src, dst = sys.argv[1], sys.argv[2]
    source = sqlite3.connect(f"file:{src}?mode=ro", uri=True, timeout=10)
    dest = sqlite3.connect(dst)
    try:
        source.backup(dest)
        print(f"backup sqlite ok: {dst}")
    finally:
        dest.close()
        source.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
