# 🐸 LogFrog

What do frogs know about logs...

LogFrog is a lightweight browser-based log viewer for JSON, LOG, TXT, and ZIP files.

It was primarily built for NLog output and its level tags such as `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, and `FATAL`.
It runs out of the box: just double-click `index.html` and start browsing logs.

## Features

- Load a single log file or a ZIP archive with multiple log files
- Filter by NLog-style levels/tags
- Filter by one or two message keywords
- Expand any entry to inspect the raw JSON payload
- Works entirely in the browser
- No build step, no installation, no backend, no problems

## Notes

- Large files are limited by browser memory, since LogFrog reads files client-side.
- ZIP archives are unpacked in memory before parsing.
