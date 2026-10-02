# Heavier — owner's manual

Written 2026-09-30, for Sami, to be read cold after a break.
Rewritten 2026-10-01, when the architecture was reverted to a bundled site.

This is the one document to open first. It covers what the project now does,
how to put it on a VPS, how the passwords work, how to use the admin panel, and
what to check when something looks wrong. It assumes you remember nothing.

- `README.md` — how the code is built. Read it before changing anything.
- `DEPLOY.md` — the terse config reference. This manual points at it.
- `CLAUDE.md` — working notes and the backlog, for a future coding session.

---

## 1. What this is, in one screen

A web game: two objects, which is heavier, eight rounds, then a score. Five
languages (EN / TR / ES / DE / FR), kg-or-lbs toggle, 67 objects with hand-drawn
SVG silhouettes.

It now also has an **admin panel** — a page of the site itself, at one long
URL, behind a username-and-password login — where you can:

- add an object (id, weight in grams, category, SVG, five names);
- edit an object's weight, category and names;
- create a category — which also creates its SVG folder;
- decide which categories get a card on the homepage;
- see which objects players keep reporting as having the wrong weight.

Everything you change is written **straight to the VPS filesystem** —
`items.json`, `data/categories.json` and the `svg_files/` folders.

### Three things that are true and worth remembering

**A change is not live until you rebuild.** The game reads the dataset and the
artwork out of its own JavaScript bundle, which is built once by `npm run
build`. Nothing is fetched while the page is running. So after you add or edit
an object, run:

```bash
npm run build && sudo systemctl restart heavier
```

The panel reminds you of this on every screen. This is the deliberate trade for
a site that loads nothing from anywhere at runtime — not a font, not an icon,
not a row of data.

**Your data lives on the server, not in this folder.** Objects you add through
the panel exist only on the VPS. If you later copy the project down to your
laptop, you will not have them. Back up the server (section 9).

**There is no git here.** This folder is not a repository. The panel's writes are
the exception — every change copies the old file into `data/backups/` first —
but there is no undo for anything you edit by hand.

---

## 2. What changed most recently

**2026-10-01 — the architecture was reverted to a bundled site.** Three things
are different from what you may remember, and nothing about the gameplay
changed: the eight questions, the weight-ratio rule, scoring, the languages and
the units are all exactly as they were.

1. **Nothing is fetched at runtime any more.** The dataset, the artwork and both
   fonts are compiled into the build. Space Grotesk used to come from Google's
   servers on every visit; it is now a file in this project. The practical
   consequence is the rebuild described above.
2. **The admin panel is a page of the site**, not a second app with its own
   bundle and its own API client. Same port, same build, one URL.
3. **The login changed.** No `.env`, no password hash to paste, no session
   cookie, no rate limiter: one generated username and password, with only a
   SHA-256 verifier stored. Section 5 explains it, including what it does not
   protect you from.

Everything below this point describes the current state.

### The admin panel

- One Node process serves the game, the panel and the five write endpoints on
  **one port**. No second app, no second port, no separate API service.
- The panel is a **page of the site**, at the long URL in section 4, matched in
  the browser like any other route. Its code is a lazy chunk players never
  download — but the URL itself is in the players' bundle, so **treat it as
  public**. The login is what protects the panel, not the address.
- There is no `.env` and no session. The login's SHA-256 verifier lives in
  `admin-credentials.json`; signing in derives a key in your browser and every
  save carries it. Closing the tab signs you out.
- The dataset is now **fetched at runtime** instead of being compiled into the
  bundle. That is what makes your edits live without a rebuild.
- Player weight reports ("this looks too heavy") now go to the server instead of
  each player's own browser, which is what makes the analytics page possible.

### Category visibility

- Every category carries a `showOnHome` flag. The four original ones are on;
  a category you create starts **off**, because a card with no objects shows an
  empty balance.
- In the panel's Categories tab there is a **Show on homepage** checkbox per
  row. It saves the moment you click it — there is no Save button, and the box
  reverts if the write fails.
- The homepage grid filters on the flag and picks its column count from how many
  cards there are, so five cards read as 3 + 2 rather than 4 + 1. With the
  original four shown it looks exactly as it did before.
- **Hiding a category only removes its card.** Its objects stay in the question
  pool — question generation compares weights and never looks at a category.

### Keeping an object out of the random modes

- Every object in `items.json` now carries an **`include_random`** flag, and
  **every one of them is `true`** — nothing was switched off, so the game plays
  exactly as it did.
- `true` means the object can come up in the two modes that draw from the whole
  dataset: Heavier/Lighter and Guess the Weight. `false` keeps it to its own
  category — its homepage card, and any category game that gets built later.
- In the panel it is an **Include in the random modes** checkbox, on both
  **Add object** and **Edit**. A new object is ticked by default. Unlike the
  category checkbox, this one saves with the form's Save button, not on click.
- An object switched off is listed as **category only** in the Objects tab, so
  you can see at a glance which ones are out.
- Switching one off changes how many valid question pairs exist, which is the
  one thing to keep in mind: the pool is 67 objects and 153 pairs today.

### Sharing, and a web address per language

- **Every language now has its own URL.** English stays at `/`; the others are
  `/es/`, `/tr/`, `/fr/` and `/de/`. Send someone `/tr/` and the game opens in
  Turkish on their machine, whatever their browser is set to. Changing the
  language in the header changes the address to match, and the Back button
  undoes it.
- This is what lets Google list the site five times instead of once — before,
  all five languages lived at one address and only the English one could be
  found.
- **A "Share result" button** on both score screens. It copies three lines: the
  score, one coloured mark per round, and a link to the game in the language it
  was played in. On a phone it opens the normal share sheet instead. It gives
  nothing away — no object and no weight appears, so posting it cannot spoil a
  round for whoever reads it.
- **Link previews.** Posting the link anywhere now shows a proper card with a
  picture instead of a bare grey URL.
  **One thing to do before going live:** the address in those tags is a
  placeholder (`heavier.example.com`) and has to be changed to your real
  domain. It is one `sed` command; DEPLOY.md's "One thing to edit before going
  live" has it. The Twitter handle in there (`@heaviergame`) is a placeholder
  too — change it if you register one, or delete those two lines.
- The picture itself is `public/og-image.jpg`. Replace that file to change it.

### Playing with the keyboard

- In the Heavier/Lighter game, **← and → pick a side** and **Enter moves to the
  next round**. In Guess the Weight, Enter moves on once the answer is shown;
  typing a guess and pressing Enter still submits it as before.
- The mouse works exactly as it did. Nothing was taken away.

---

## 3. Before you deploy: what you need

| | |
|---|---|
| A VPS | Any Linux box. 1 vCPU / 512 MB is plenty. |
| Node.js | **22 LTS or newer** (20.19+ also works). Vite 7 requires it. |
| A domain | Pointed at the VPS, with an A record. **Also write it into `index.html`** — see section 2, the link-preview tags ship with a placeholder. |
| TLS | Let's Encrypt via certbot, or Caddy. **Not optional** — section 6. |
| A password manager | For the admin username and password. They are shown once and stored nowhere. |

Check Node on the box before anything else:

```bash
node -v      # must be v20.19+ or v22.12+
```

---

## 4. Deploying, step by step

Run these on the VPS. `/srv/heavier` is used throughout; use any path you like
and stay consistent.

### 4.1 Get the code onto the box

```bash
sudo mkdir -p /srv/heavier
sudo chown "$USER":"$USER" /srv/heavier
# then copy the project in — rsync from your laptop is simplest:
#   rsync -av --exclude node_modules --exclude dist \
#     ~/Desktop/WeightGame/ user@your-server:/srv/heavier/
cd /srv/heavier
```

Make sure `items.json`, `svg_files/` and `audex/` came across. They are the
game's content; without them there is nothing to play.

### 4.2 Install and build

```bash
npm ci
npm run build
```

`npm run build` type-checks and then builds the site into `dist/` — one entry,
with the admin panel as a lazily-loaded chunk of it. This is also the step that
bundles `items.json`, the artwork and the fonts, so **you will run it again
every time you change something in the panel**. If you skip it entirely, every
URL answers with a "not been built" message.

### 4.3 Generate your credentials

```bash
npm run admin:credentials
```

It prints a username and a password **once**:

```
  New admin credentials — shown once, stored nowhere:

    Username:  heavier-xxxxxxxxxx
    Password:  xxxxxxxxxxxxxxxxxxxxxxxx
```

Put both in your password manager **now**. Nothing in this project can recover
them: what gets written to disk is `admin-credentials.json`, which holds one
SHA-256 digest and no plaintext. If you lose them you re-run this command and
get a new pair.

Then rebuild, because that digest is bundled into the panel:

```bash
npm run build
```

### 4.4 There is no `.env`

The old build wanted a secrets file. This one does not: the only configuration
is three environment variables, all with working defaults, and you will normally
set them in the systemd unit rather than a file.

| Variable | Meaning | If unset |
|---|---|---|
| `PORT` | Port the process listens on. | `8080`. |
| `HOST` | Interface to bind. Use `127.0.0.1` behind nginx. | `0.0.0.0` — reachable from the internet directly. Set it. |
| `DATA_ROOT` | Optional. Put `items.json`, `data/` and `svg_files/` on one volume. | The project directory. |

There is a fourth, `ADMIN_VERIFIER`, which overrides `admin-credentials.json` if
you would rather keep the digest in the systemd unit than on disk. You do not
need it.

**The panel's address** is fixed in the code
(`src/admin/route.ts`), and it is this:

```
/4095824095823fs9a04fd823hb9d05s7d340g5b8f23s9df4s845g9h2sd8d37sdf484h039h8sd52e0sd8ff3g94h5823
```

Save it in your password manager for convenience, but understand that it is
**not a secret**: the browser is what matches it, so it is in the JavaScript
every player downloads. Anyone who looks will find it. What stops them is the
login.

### 4.5 Check it before wiring anything up

```bash
HOST=127.0.0.1 npm start
```

From another terminal on the box:

```bash
ADMIN_URL=/4095824095823fs9a04fd823hb9d05s7d340g5b8f23s9df4s845g9h2sd8d37sdf484h039h8sd52e0sd8ff3g94h5823

curl -s localhost:8080/ | grep -c 'id="root"'                            # expect 1
curl -s "localhost:8080$ADMIN_URL" | grep -c 'id="root"'                 # expect 1
curl -so /dev/null -w '%{http_code}\n' localhost:8080/api/admin/data     # expect 401
curl -so /dev/null -w '%{http_code}\n' localhost:8080/api/objects        # expect 404
```

Then `Ctrl-C`. If all four behave, the app is sound and what remains is
plumbing: the site is being served, the panel's URL serves the same app (the
panel is a page of it, chosen in the browser), writes are walled off behind the
key, and there is no public dataset endpoint left to expose.

### 4.6 Run it as a service

`sudo nano /etc/systemd/system/heavier.service`:

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

ProtectSystem=strict
ReadWritePaths=/srv/heavier/items.json /srv/heavier/data /srv/heavier/svg_files
PrivateTmp=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Create the user and hand it the three writable paths — the panel cannot save
anything it does not own:

```bash
sudo useradd -r -s /usr/sbin/nologin heavier
sudo mkdir -p /srv/heavier/data
sudo chown -R heavier:heavier /srv/heavier/items.json /srv/heavier/data /srv/heavier/svg_files

sudo systemctl daemon-reload
sudo systemctl enable --now heavier
sudo systemctl status heavier
sudo journalctl -u heavier -f
```

On a healthy start the log says where it is serving, and warns if
`admin-credentials.json` has no usable verifier.

### 4.7 nginx and TLS

`sudo nano /etc/nginx/sites-available/heavier`:

```nginx
server {
  listen 80;
  server_name heavier.example;

  client_max_body_size 1m;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/heavier /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d heavier.example      # adds the 443 block and redirect
```

`DEPLOY.md` has the explicit 443 block if you would rather write it by hand.

### 4.8 Final check

```bash
cd /srv/heavier
npm run verify:admin
```

72 checks against a freshly started server — the key wall on every write
endpoint, atomic writes, backups, SVG rejection, the visibility toggle, the
random-modes flag, the dispute pipeline, and the build output. It runs against a
**throwaway copy** of your dataset in `/tmp` and a throwaway credential, and
never touches the live ones, so it is safe on production.

Then open `https://heavier.example` and the panel's URL, and sign in.

---

## 5. The login

### Changing the username and password

```bash
cd /srv/heavier
npm run admin:credentials     # prints a NEW username and password, once
npm run build                 # the digest is bundled into the panel
sudo systemctl restart heavier
```

The rebuild is not optional. The panel checks the digest in its own JavaScript,
so until you rebuild, a browser with the page open is still checking the old
one.

### If you forget them

There is no reset flow and no recovery — only a digest is stored anywhere. Run
the two commands above and you have a new pair. Your data is untouched.

### How the login actually protects you

`admin-credentials.json` holds exactly one value and it is not a password:

```
verifier = sha256(key)        key = sha256("username:password")
```

| | |
|---|---|
| Signing in | Your typing is hashed into `key` in the browser, and `sha256(key)` is compared with the verifier. No request is made, so there is nothing to rate-limit and no way to probe whether a username exists. |
| Saving | Every write carries `key` in an `X-Admin-Key` header. The server hashes it and compares it with the same verifier, in constant time. |
| Why hash twice | The verifier is published — it is in the bundle and on disk. Being one hash *past* the key means it cannot be replayed as one: an attacker who reads it still faces a 24-character password. |
| Session | There isn't one. The key lives in the tab's memory. Closing the tab is the logout, and a restart signs out nobody. |
| Every write endpoint | Returns `401` before the request body is read or any file is opened. |

Two things this does **not** do, stated plainly:

- **The panel's URL is not a secret.** It is in the JavaScript every player
  downloads, because the browser is what matches it. Assume it is known.
- **It depends entirely on HTTPS.** The key crosses the wire on every save. And
  `crypto.subtle`, which the login needs to hash anything, is only available to
  a browser on HTTPS or localhost — over plain HTTP to an IP address the login
  does not merely leak, it does not work.

---

## 6. Using the admin panel

Open `https://your-domain` + the panel path from section 4.4 and sign in. Four
tabs.

Every screen carries the same reminder, and it is the thing to remember:
**saves land on disk immediately, and reach players at the next
`npm run build`.**

### Objects

Every object, searchable by id or by a name in any language. **Edit** opens a
row for weight (grams), category, the random-modes checkbox and all five names.
A row marked **category only** is one you have switched out of the random
modes.

The SVG path is shown but not editable, and this is deliberate: **moving an
object to another category does not move its artwork.** A pear moved to `guns`
keeps `foods_svg/pear.svg`. The game reads the category from the data field and
the picture from the path, so both stay correct. Nothing breaks; the folder name
just stops matching.

There is no delete. It would leave an orphaned SVG and quietly change how many
valid question pairs exist.

### Add object

| Field | Notes |
|---|---|
| Id | Lowercase letters, digits, dashes. Also becomes the filename. Must be unique. |
| Weight | **In grams.** 4 kg is `4000`. This is the game's one canonical unit. |
| Category | Picks the folder the SVG goes into. |
| SVG | A plain silhouette like the existing artwork. Max 256 KB. |
| Names | All five languages, required, typed by you. No translation service is involved. |
| Include in the random modes | Ticked by default. Untick it to keep the object out of Heavier/Lighter and Guess the Weight, leaving it to its own category. |

Every language is required on purpose: a blank one would silently fall back to
English for those players, which is the kind of gap nobody notices later.

The file is saved as `<category folder>/<id>.svg` on the server at once — but
the picture is bundled into the game at build time, so **the object shows up for
players after `npm run build`**, not before. Until then the panel lists it
without a thumbnail, which is the same thing seen from the other side.

An SVG containing a
`<script>`, an `on…` handler, an external reference or an `<!ENTITY>`
declaration is **refused with a reason**, not quietly cleaned up — the file is
served from your own domain, so it is treated as markup, not as a picture.

For the object to appear in questions it needs a partner within the weight
ratio: the heavier of any pair may be at most ~54% heavier than the lighter.
An object far from everything else in the dataset simply never comes up. Two
existing ones are already in that position (`sperm-whale`, `cherry`). Unticking
**Include in the random modes** is the deliberate version of the same thing, and
it also removes the object from Guess the Weight, which has no ratio rule.

### Categories

A table of every category with its key, English name, folder, object count, and
the **Show on homepage** checkbox.

- Clicking the checkbox saves immediately. The box moves at once and reverts if
  the write fails, so it never shows a state the file does not have.
- Creating a category also creates `svg_files/<key>_svg/`. The original four
  have irregular folders (`animal` → `animals_svg`, but `vehicle` →
  `vehicle_svg`); new ones follow `<key>_svg`.
- A new category starts hidden. A card needs **two** objects to draw its
  balance; switch it on once you have some, and the panel warns you if you do it
  early.
- Hiding a category removes only its card. Its objects stay in the game.
- Categories cannot be renamed or removed — both would have to rewrite every
  object pointing at them.

If you hide every category, the whole homepage section disappears cleanly rather
than leaving a heading with nothing under it.

### Analytics

Objects players have reported, most-reported first: total reports, how many said
"heavier", how many said "lighter", the current weight, when that object was
last reported, and a link straight to that object's edit form. Above the table
is the window's own total — how many reports on how many objects, and the date
of the oldest one still kept.

This is the flag button players see after an answer is revealed. Nothing adjusts
a weight automatically — the page tells you where to look, you decide.

**Everything on this page is the last 30 days.** A report is kept for 30 days
and then deleted from `data/disputes.json` outright — not archived, not
summarised, not counted any more. So a number here can fall as well as rise, and
the log can never grow without bound. The sweep runs when you open the panel and
once when the server starts, so what you see and what is on disk are the same
set. If you want to keep a result, write it down before it ages out.

Reports only started accumulating on the server when this shipped. Anything
players filed before that stayed in their own browsers and is not recoverable.
The table stays empty until players actually use the button.

---

## 7. Endpoint reference

Five, and that is all of them.

| Method | Path | Auth | What it does |
|---|---|---|---|
| `POST` | `/api/disputes` | public | A player's weight report. Write-only; returns nothing readable. |
| `GET` | `/api/admin/data` | key | Items, categories and the dispute log in one response. |
| `POST` | `/api/admin/objects` | key | Create. `{ id, weight, category, names, svg }`, plus optional `include_random` (default `true`). |
| `PUT` | `/api/admin/objects/:id` | key | Edit `{ weight, category, names }`, plus optional `include_random` (omitted keeps the stored value). `path` is carried over untouched. |
| `POST` | `/api/admin/categories` | key | Create. `{ key, names, showOnHome }`. |
| `PATCH` | `/api/admin/categories/:key` | key | `{ showOnHome }` — the only field a category update may change. |

Everything under `/api/admin/` returns `401` with no detail unless the request
carries the right `X-Admin-Key`, checked before the body is read or any file is
opened.

**There is no endpoint serving the dataset and none serving artwork.** The game
reads both from its own bundle, which is why a change needs a rebuild — and why
the only thing a player's browser ever sends to this server is a dispute.

Limits, in one place: request body 512 KB · SVG 256 KB · 50 backups kept ·
20,000 disputes kept · disputes deleted after 30 days.

---

## 8. Which files are data and which are code

| Path | |
|---|---|
| `items.json` | **Data.** The objects, each with its `include_random` flag. Rewritten by the panel on every add or edit. |
| `svg_files/` | **Data.** All artwork, including uploads. |
| `data/categories.json` | **Data.** Categories, folders, names, `showOnHome`. Created on first run. |
| `data/disputes.json` | **Data.** Player reports, kept 30 days and then deleted. |
| `data/backups/` | **Data.** The last 50 copies of `items.json` and `categories.json`. |
| `dist/` | Build output. Disposable; regenerate with `npm run build`. |
| `src/`, `server/`, `scripts/` | Code. |
| `admin-credentials.json` | The login's SHA-256 verifier. No password in it, so it is safe to commit and to copy around — but losing it means generating a new login. |

A rebuild never touches the data. Objects you add survive a deploy.

It does read it, though: `items.json`, `data/categories.json` and `svg_files/`
are compiled into the bundle by `npm run build`, which is the one thing to keep
in mind when something you changed is not showing up.

---

## 9. Backups, and how to undo a mistake

**Back up three paths:** `items.json`, `svg_files/`, `data/` — plus
`admin-credentials.json`, which is one line and is your login. Set `DATA_ROOT`
in the systemd unit if you would rather have the three on one volume you can
snapshot.

A nightly copy, for example:

```bash
sudo tar czf "/var/backups/heavier-$(date +%F).tgz" \
  -C /srv/heavier items.json svg_files data
```

### Rolling back a bad edit

Before every write, the server copies the current file into `data/backups/` with
a timestamp. To undo:

```bash
ls -t /srv/heavier/data/backups/ | head
sudo systemctl stop heavier
sudo cp /srv/heavier/data/backups/items-2026-09-30T12-00-00-000Z.json \
        /srv/heavier/items.json
sudo chown heavier:heavier /srv/heavier/items.json
sudo systemctl start heavier
```

Only the last 50 are kept, and they are **not** a substitute for an off-host
backup — they live on the same disk as the thing they protect.

An SVG you uploaded is not backed up by that mechanism. If you overwrite
artwork, only your own backups will have the original.

---

## 10. Troubleshooting

| What you see | Why | Fix |
|---|---|---|
| **An edit does not show up for players** | Expected until you rebuild — the game reads the dataset out of its bundle. | `npm run build && sudo systemctl restart heavier` |
| Any URL shows "The app has not been built" | No `dist/`. | `npm run build` |
| The panel's URL shows the game instead of the panel | The URL does not match exactly — one character off, or a trailing path. | Copy it from section 4.4. |
| Sign in does nothing, or the page errors on submit | You are on plain HTTP, so `crypto.subtle` is missing and the login cannot hash anything. | Finish TLS. It works on `localhost` without it. |
| "That username and password do not match" and you are sure they do | The bundle is older than the credentials. | `npm run build`, restart, hard-reload. |
| Every save returns 401 | The server's verifier does not match the bundle's, or `admin-credentials.json` is missing. | Re-copy the file, or `npm run admin:credentials` + `npm run build`. |
| Saving fails with a server error | The service user cannot write. | `sudo chown -R heavier:heavier items.json data svg_files` |
| A new object has no picture, in the game or the panel | Expected before a rebuild — the artwork is bundled. | `npm run build` |
| A new object still has no picture after a rebuild | The SVG did not land, or the id and path disagree. | `ls svg_files/<folder>/`; check `journalctl -u heavier`. |
| New object never appears in a question | No other object within the ~1.54 weight ratio. | Add something closer in weight, or adjust the weight. |
| Homepage has no category cards | Everything is toggled off. | Categories tab, switch some on. |
| You are signed out when you come back | Expected — the key lives in the tab. | Sign in again. |
| `npm ci` fails on the box | Node too old. | Node 22 LTS or newer. |

Logs: `sudo journalctl -u heavier -f`. Every server message is prefixed
`[weight-game]` — that prefix is an old internal identifier, not a stale product
name, and is left alone deliberately.

---

## 11. What is deliberately not built

So you do not go looking for it:

- **No object deletion**, no category rename or removal.
- **No URLs for pages.** The category pages are not linkable or bookmarkable,
  and the browser Back button does not leave them.
- **No coffee page.** The Buy Me a Coffee card in the home screen's bento grid
  links straight out to `https://buymeacoffee.com/sam10` in a new tab. If that
  handle ever changes, the address is in `src/components/BentoGrid.tsx` and
  nowhere else. The app's own blank coffee page is no longer reachable.
- **Category pages are blank.** A `guns` card opens a page that says nothing
  about guns — every category page is the same empty placeholder.
- **The panel is English-only**, on the grounds that it has one user.
- **No category quiz modes, daily questions, leaderboards, accounts, ads, XP or
  streaks.**
- A featured category with fewer than two objects shows an **empty balance** on
  its card. The card still lines up with its neighbours; it is just blank.

`CLAUDE.md` holds the full backlog with the reasoning, including the small things
that were offered and left alone (the "Objects" vs "Stuff" label, the unreachable
`cherry`, the unused tagline string).

---

## 12. How this was verified — and what was not

Honest accounting, because it affects how much you should trust it.

**Checked automatically:** `npm run typecheck` and `npm run build` pass; 67
end-to-end checks pass against a real running server, covering the key wall on
every write endpoint (no key, wrong key, malformed key), that adding an object
appends exactly one entry, that a refused SVG writes no file and leaves no
orphan behind, that a category change leaves the SVG path alone, that every
write leaves a restorable backup, that the visibility toggle reaches the file
without disturbing another category, that `include_random` defaults to true,
stores false when you ask for it and survives an edit that does not mention it,
and that a player's report reaches the panel's data. The last group checks the
build itself: the artwork and both fonts are emitted as bundled files, nothing
in the page loads from another origin, and the panel is not inside the bundle
players download.

**Checked in a browser**, on the real built site served by the real server
against a throwaway copy of the dataset: the homepage in Turkish with every
silhouette and both fonts rendering and **zero requests to any outside origin**;
a round of Heavier/Lighter played through to its reveal; a weight reported with
the flag button; signing into the panel with the generated credentials; editing
an object's weight and confirming the new value in `items.json` with a backup
written beside it; all four panel tabs; and that report appearing in Analytics.
Also confirmed: the game page loads one JavaScript file and never the panel's.

**Not checked:** an upload of a real SVG through the panel's file picker (the
server's own SVG rules are covered by the automated checks, but the browser
side of that form was not exercised), and the panel at phone width.

---

## 13. Quick reference

```bash
# on the VPS, in /srv/heavier
npm ci                    # install
npm run build             # REQUIRED after any panel edit, as well as code changes
sudo systemctl restart heavier
sudo journalctl -u heavier -f

npm run admin:credentials # new username + password, printed once (then rebuild)
npm run verify:admin      # 72 checks, safe on production
npm run typecheck         # covers src/, server/ and scripts/
```

```bash
# on your laptop
npm run dev               # the whole game at http://localhost:5173, no server needed
```

`npm run dev` has no API, so **the panel loads but cannot save** — it will say
the server did not respond. To work on the panel locally, `npm run build && npm
start` and use `http://localhost:8080` instead; `localhost` is a secure context,
so the login works there without TLS. Remember you are then editing your local
`items.json`, not the VPS's.

The panel's URL is the same everywhere — it is in the code, not in config:

```
/4095824095823fs9a04fd823hb9d05s7d340g5b8f23s9df4s845g9h2sd8d37sdf484h039h8sd52e0sd8ff3g94h5823
```

Keep in your password manager: the domain, the admin username and the admin
password. The URL is convenient to keep too, but it is not a secret.
