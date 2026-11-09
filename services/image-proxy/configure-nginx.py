"""Add the proxy location to the existing HTTPS vhost, with rollback on failure."""

from datetime import datetime, timezone
from pathlib import Path
import os
import shutil
import subprocess
import sys
import tempfile

config = Path('/etc/nginx/sites-available/ecs.zingspark.tech.conf')
marker = '    # ---- common headers ---------------------------------------------------'
include = '    include snippets/ecs.zingspark.tech/30-botc-image-proxy.conf;'
original = config.read_text(encoding='utf-8')
if include in original:
    print('Proxy include already present; no change made.')
    sys.exit(0)
if original.count(marker) != 1:
    raise SystemExit('The expected HTTPS server marker was not found exactly once; no change made.')

backup = Path('/opt/botc-image-proxy') / ('nginx-backup-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '.conf')
shutil.copy2(config, backup)
new_text = original.replace(marker, include + '\n\n' + marker, 1)


def atomic_write(text):
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=config.parent, delete=False) as tmp:
        tmp.write(text)
        name = tmp.name
    shutil.copymode(config, name)
    os.replace(name, config)


atomic_write(new_text)
check = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
if check.returncode:
    atomic_write(original)
    sys.stderr.write(check.stderr)
    raise SystemExit('Nginx validation failed; the original configuration was restored.')
reload = subprocess.run(['systemctl', 'reload', 'nginx'], capture_output=True, text=True)
if reload.returncode:
    atomic_write(original)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=False)
    sys.stderr.write(reload.stderr)
    raise SystemExit('Nginx reload failed; the original configuration was restored.')
print('Proxy enabled. Nginx configuration backup:', backup)
