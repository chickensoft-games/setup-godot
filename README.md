# Setup Godot

Setup Godot for headless use with macOS, Windows, and Linux CI/CD runners.

- ✅ Godot 4 Only.
- ✅ Setup and run Godot on the OS you are developing for.
- ✅ Caches Godot 4 installation for speedier workflows.
- ✅ Adds environment variables (`GODOT4`, `GODOT`) to the system path.
- ✅ Installs Godot on the runner — do whatever you want with it afterwards!

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

      - uses: chickensoft-games/setup-godot
        name: 🤖 Setup Godot
        with:
          # Version must include major, minor, and patch, and be >= 4.0.0
          # Pre-release label is optional.
          version: 4.0.0-beta16

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
