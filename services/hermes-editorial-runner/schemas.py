"""Validação de JSON Schema (Draft 2020-12) para requisição e dossiê."""

import json
import os

from jsonschema import Draft202012Validator, FormatChecker

import config

_REQUEST_SCHEMA = None
_DOSSIER_SCHEMA = None


def _load(name: str) -> dict:
    path = os.path.join(config.SCHEMAS_DIR, name)
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def get_request_schema() -> dict:
    global _REQUEST_SCHEMA
    if _REQUEST_SCHEMA is None:
        _REQUEST_SCHEMA = _load("editorial-research-request.v1.schema.json")
    return _REQUEST_SCHEMA


def get_dossier_schema() -> dict:
    global _DOSSIER_SCHEMA
    if _DOSSIER_SCHEMA is None:
        _DOSSIER_SCHEMA = _load("editorial-dossier.v1.schema.json")
    return _DOSSIER_SCHEMA


def validate_request(instance) -> list:
    return list(
        Draft202012Validator(get_request_schema(), format_checker=FormatChecker()).iter_errors(instance)
    )


def validate_dossier(instance) -> list:
    return list(Draft202012Validator(get_dossier_schema(), format_checker=FormatChecker()).iter_errors(instance))
