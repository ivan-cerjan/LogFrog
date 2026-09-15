# 🐸 LogFrog

What do frogs know about logs... nothing, but at least they make 'em look nice.

LogFrog is a lightweight, idiot-proof, browser-based log viewer for JSON, LOG, TXT, and ZIP files that I threw together for personal use because staring at raw logs was getting old fast.

It was built by some Dutch tech nerd, mainly for NLog outputs and their level tags like `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, and `FATAL`.

Runs straight out of the box: no AI, no Docker, no Kubernetes, no extensions, no weird `.dll`s. Just double-click and start browsing your logs like a normal person.

## Features

- Load a single log file or a whole ZIP archive full of them
- Filter by NLog-style levels/tags
- Filter by one or two keywords in messages
- Expand any entry to peek at the raw JSON payload
- Runs entirely in the browser, no funny business
- No build step, no install, no backend, no problems 🙌

## Notes

- Big files are limited by however much memory your browser feels like giving you, since everything's parsed client-side.
- ZIP archives get unpacked in memory before parsing so don't feed it a 10GB archive and expect magic.
