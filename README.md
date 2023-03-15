# 🤖 Setup Godot

[![Chickensoft Badge][chickensoft-badge]][chickensoft-website] [![Discord][discord-badge]][discord] [![Read the docs][read-the-docs-badge]][docs]

Setup Godot for use with (or without) .NET on macOS, Windows, and Linux CI/CD runners.

- ✅ Godot 4.x
- ✅ C# supported using .NET version of Godot.
- ✅ Versions **without** .NET are also supported.
- ✅ Installs Godot directly on the CI/CD runner.
- ✅ Caches Godot installation for speedier workflows.
- ✅ Adds environment variables (`GODOT4`, `GODOT`) to the system path.
- ✅ Runs on macOS Github Actions runner.
- ✅ Runs on Windows Github Actions runner.
- ✅ Runs on Ubuntu Github Actions runner.

> **Godot 3.x and below are not supported.**

## Usage

Example workflow:

```yaml
name: 🚥 Status Checks
on: push

jobs:
  tests:
    name: 👀 Evaluate on ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    strategy:
      # Don't cancel other OS runners if one fails.
      fail-fast: false
      matrix:
        # Put the operating systems you want to run on here.
        os: [ubuntu-latest, macos-latest, windows-latest]
    env:
      DOTNET_CLI_TELEMETRY_OPTOUT: true
      DOTNET_NOLOGO: true
    defaults:
      run:
        # Use bash shells on all platforms.
        shell: bash
    steps:
      - uses: actions/checkout@v3
        name: 🧾 Checkout

      - uses: actions/setup-dotnet@v3
        name: 💽 Setup .NET SDK
        with:
          # Use the .NET SDK from global.json in the root of the repository.
          global-json-file: global.json

      - name: 📦 Restore Dependencies
        run: dotnet restore

      - uses: chickensoft-games/setup-godot@v1
        name: 🤖 Setup Godot
        with:
          # Version must include major, minor, and patch, and be >= 4.0.0
          # Pre-release label is optional.
          version: 4.0.0-beta16 # also valid: 4.0.0.rc1 or 4.0.0, etc
          # Use .NET-enabled version of Godot (the default is also true).
          use-dotnet: true

      - name: 🔬 Verify Setup
        run: |
          dotnet --version
          godot --version

      - name: 🧑‍🔬 Generate .NET Bindings
        run: godot --headless --build-solutions --quit || exit 0

      - name: 🦺 Build Projects
        run: dotnet build

      # Do whatever you want!
```

## Inputs

See [action.yml][action] for information about the action's inputs.

[chickensoft-badge]: https://raw.githubusercontent.com/chickensoft-games/chickensoft_site/main/static/img/badges/chickensoft_badge.svg
[chickensoft-website]: https://chickensoft.games
[discord-badge]: https://raw.githubusercontent.com/chickensoft-games/chickensoft_site/main/static/img/badges/discord_badge.svg
[discord]: https://discord.gg/gSjaPgMmYW
[read-the-docs-badge]: https://raw.githubusercontent.com/chickensoft-games/chickensoft_site/main/static/img/badges/read_the_docs_badge.svg
[docs]: https://chickensoft.games/docs
[action]: ./action.yml
