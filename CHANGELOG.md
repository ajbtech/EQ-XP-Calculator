# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Contributor and community files: `CONTRIBUTING.md`, `SECURITY.md`,
  `CODE_OF_CONDUCT.md`, GitHub issue templates, and a pull request template.
- `repository`, `homepage`, and `bugs` metadata in `package.json`.

## [0.1.0] - 2026-05-28

Initial public release.

### Added

- XP-per-mob calculator for EverQuest Project 1999: base mob XP, ZEM, group
  bonus and XP share, 11% per-mob cap, hell-level modifiers, race modifiers,
  and consider-color scaling.
- Pure formula engine (`src/xp.js`) with golden-value tests, DOM UI layer
  (`src/ui.js`), and community ZEM data (`data/`).
- CI running lint, format check, and tests; GitHub Pages deployment.
