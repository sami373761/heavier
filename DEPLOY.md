# Deploying Heavier

One Node process serves the game, the admin panel and the five write
endpoints on a single port. There is no second service and no second port to
open, and no `.env` file to fill in.

> This is the condensed config reference. **`MANUAL.md` walks the same
> deployment step by step** and adds how to use the panel, how the credentials
> work, and a troubleshooting table. Start there if you are doing this for the
> first time or coming back to it after a while.

```bash
npm ci
npm run build          # type-check + build into dist/
npm start              # node server/index.mjs
```

---

## Configuration

There are three environment variables and all of them have working defaults:

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `8080` | Port to listen on. |
| `HOST` | `0.0.0.0` | Interface to bind. Set `127.0.0.1` behind a reverse proxy. |
| `DATA_ROOT` | the project directory | Where `items.json`, `data/` and `svg_files/` live, if you want everything writable on one mountable volume. |

`ADMIN_VERIFIER` is a fourth, and optional: it overrides
`admin-credentials.json` for a deployment that would rather keep the value in
systemd than on disk. The verification script uses it to run against a
throwaway credential.

### The admin credentials

```bash
npm run admin:credentials
```

Prints a username and password **once** and writes `admin-credentials.json`,
which holds a single SHA-256 digest and no plaintext. Write the two down — this
project cannot recover them, by design. Run `npm run build` afterwards: the
digest is bundled into the panel, so until you rebuild, a browser still checks
the old one.

If `admin-credentials.json` is missing or empty the game serves normally, the
panel still loads, and every save is refused with a 401.

### The panel's address

```
/4095824095823fs9a04fd823hb9d05s7d340g5b8f23s9df4s845g9h2sd8d37sdf484h039h8sd52e0sd8ff3g94h5823
```

It is a route inside the app, matched in the browser, so the path is in the
JavaScript bundle and is **not a secret**. The login is what protects the panel.
Changing it means editing `src/admin/route.ts` and rebuilding.

---

## HTTPS is not optional

Two reasons, and the first is not negotiable. The panel derives its key with
`crypto.subtle`, which **browsers only expose on HTTPS or localhost** — over
plain HTTP to an IP address the login cannot work at all. And the key crosses
the wire in a header on every save, so without TLS it is readable in transit.
Put a terminator in front and never expose the Node port directly.

```nginx
server {
  listen 443 ssl http2;
  server_name heavier.example;

  ssl_certificate     /etc/letsencrypt/live/heavier.example/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/heavier.example/privkey.pem;

  # Uploaded SVGs are capped at 256 KB by the server; this just fails earlier.
  client_max_body_size 1m;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 80;
  server_name heavier.example;
  return 301 https://$host$request_uri;
}
```

With this in place set `HOST=127.0.0.1`.

---

## systemd

`/etc/systemd/system/heavier.service`:

```ini
[Unit]
Description=Heavier
After=network.target

[Service]
Type=simple
User=heavier
WorkingDirectory=/srv/heavier
ExecStart=/usr/bin/node server/index.mjs
Restart=on-failure
RestartSec=5

# The process writes items.json, data/ and svg_files/ and nothing else.
ProtectSystem=strict
ReadWritePaths=/srv/heavier/items.json /srv/heavier/data /srv/heavier/svg_files
PrivateTmp=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now heavier
sudo journalctl -u heavier -f
```

Restarting the service does not sign you out of anything, because there is
nothing to sign out of: the key lives in the panel tab's memory and closing the
tab is the logout.

---

## What to back up

Three paths hold everything the panel can change:

| Path | What it is |
|---|---|
| `items.json` | The dataset, each entry carrying its `include_random` flag. Rewritten on every object add or edit. |
| `svg_files/` | All artwork, including everything uploaded. |
| `data/` | The category registry, the dispute log (reports are deleted 30 days after they are filed), and `data/backups/`. |
| `admin-credentials.json` | The login's SHA-256 verifier. Losing it means running `npm run admin:credentials` again. |

`data/backups/` holds a timestamped copy of `items.json` and
`categories.json` from before each write (the last 50). **This project is not a
git repository**, so those copies are the only rollback that exists — restoring
one is a `cp` back over `items.json`. They are not a substitute for an off-host
backup of the three paths above.

Set `DATA_ROOT` if you want all three on a single volume.

---

## Updating

```bash
git pull                 # or however you get the code onto the box
npm ci
npm run build
sudo systemctl restart heavier
```

`items.json`, `data/` and `svg_files/` are data, not build output — a rebuild
does not touch them, and objects added through the panel survive a deploy.

**The game reads all three at build time**, though, so the opposite is also
true: a change made in the panel is on disk immediately but is not visible to
players until the next `npm run build`. That is the trade for having nothing
fetched at runtime. Adding an object therefore ends in:

```bash
npm run build
sudo systemctl restart heavier
```

---

## One thing to edit before going live: the domain

`index.html` carries the social-card and language tags that a scraper reads
without running any JavaScript, and every absolute URL in them is the
placeholder `https://heavier.example.com`. Replace it with the real origin —
ten tags plus the comment that explains them, all in one block near the top of
that file, and nothing else in the project refers to it:

```bash
sed -i '' 's#https://heavier\.example\.com#https://your-real-domain#g' index.html
npm run build
```

The same block has a placeholder Twitter handle, `@heaviergame`, on
`twitter:site` and `twitter:creator`. An account that does not exist costs only
the attribution line on the card; change it or drop the two tags.

In a real browser the canonical and `og:url` tags are rewritten to the origin
actually being served, so visitors and the share button are right either way —
it is scrapers, which do not run JavaScript, that read the static values.

The card image is `public/og-image.jpg`, served at `/og-image.jpg`. It is a
plain file in `public/`, not a bundled asset, so its URL does not change
between builds — which is what a social card needs. Replacing the picture means
replacing that file.

**Language paths.** `/`, `/es/`, `/tr/`, `/fr/` and `/de/` are all served by
the app itself; the SPA fallback already answers any unknown path with
`index.html`, so no rewrite rule is needed in nginx or Caddy. If you put a
cache in front, these are ordinary HTML responses and already carry
`Cache-Control: no-cache`.

---

## Checking a deployment

```bash
npm run verify:admin
```

Runs 72 checks against a freshly started server: the key wall on every write
endpoint, atomic writes, backups, SVG rejection, path stability across a
category change, homepage-visibility toggling, the `include_random` flag, the
dispute-to-analytics pipeline, and the build output — that the artwork and both
fonts are bundled, that nothing is loaded from a third-party origin, and that
the panel is not in the bundle players download. It works on a throwaway copy
of the dataset in `$TMPDIR`, with a throwaway credential, and never touches the
live ones.

Build first; the last group of checks reads `dist/`.
