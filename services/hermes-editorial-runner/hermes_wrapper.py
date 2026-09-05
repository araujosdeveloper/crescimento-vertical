#!/opt/hermes/.venv/bin/python
"""Entry point do Hermes com logging efêmero exclusivo do runner.

O CLI do Hermes 0.20.4 fixa os handlers em ``get_hermes_home()/logs`` e não
expõe um argumento ou variável para trocar apenas esse destino. Este wrapper
injeta o parâmetro oficial ``hermes_logging.setup_logging(hermes_home=...)``
antes de importar o CLI. HERMES_HOME continua apontando ao perfil read-only.
"""

from pathlib import Path
import os

import hermes_logging

os.umask(0o077)

_setup_logging = hermes_logging.setup_logging


def _setup_ephemeral_logging(*args, **kwargs):
    kwargs["hermes_home"] = Path("/opt/data")
    kwargs["max_size_mb"] = 1
    kwargs["backup_count"] = 1
    return _setup_logging(*args, **kwargs)


hermes_logging.setup_logging = _setup_ephemeral_logging

from hermes_cli.main import main  # noqa: E402


if __name__ == "__main__":
    main()
