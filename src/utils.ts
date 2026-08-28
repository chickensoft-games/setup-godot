import * as core from '@actions/core'
import normalize from 'normalize-path'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

export interface Platform {
  /** Godot installation filename suffix. */
  godotFilenameSuffix(useDotnet: boolean): string
  /**
   * Returns true if the given path is most likely the Godot executable for
   * the platform.
   * @param basename File basename to check.
   */
  isGodotExecutable(basename: string): boolean
  /**
   * Returns the path to the unzipped file for the platform.
   * @param installationDir Installation directory.
   * @param versionName Version name.
   */
  getUnzippedPath(
    installationDir: string,
    versionName: string,
    useDotnet: boolean
  ): string

  GODOT_EXPORT_TEMPLATE_BASE_PATH: string
}

export class Linux implements Platform {
  GODOT_EXPORT_TEMPLATE_BASE_PATH = path.join(
    os.homedir(),
    '.local/share/godot'
  )

  private readonly arch: string

  constructor(osArch: ReturnType<typeof os.arch>) {
    // According to: https://github.com/godotengine/godot-builds/releases
    const toGodotArchMapping: Record<string, string | undefined> = {
      arm64: 'arm64',
      x64: 'x86_64'
    }

    const mappedArch = toGodotArchMapping[osArch]

    if (mappedArch === undefined) {
      throw new Error(
        `⛔Unsupported Linux arch: ${osArch}, supported: arm64, x64`
      )
    }

    this.arch = mappedArch
  }

  godotFilenameSuffix(useDotnet: boolean): string {
    if (useDotnet) {
      return `_mono_linux_${this.arch}`
    }
    return `_linux.${this.arch}`
  }
  isGodotExecutable(basename: string): boolean {
    return basename.toLowerCase().endsWith(this.arch)
  }
  getUnzippedPath(
    installationDir: string,
    versionName: string,
    useDotnet: boolean
  ): string {
    return path.join(installationDir, versionName)
  }
}

export class Windows implements Platform {
  GODOT_EXPORT_TEMPLATE_BASE_PATH = path.normalize(
    path.join(os.homedir(), '\\AppData\\Roaming\\Godot')
  )

  private readonly arch: string

  constructor(osArch: ReturnType<typeof os.arch>) {
    // According to: https://github.com/godotengine/godot-builds/releases
    const toGodotArchMapping: Record<string, string | undefined> = {
      arm64: 'windows_arm64',
      x64: 'win64'
    }

    const mappedArch = toGodotArchMapping[osArch]

    if (mappedArch === undefined) {
      throw new Error(
        `⛔Unsupported Windows arch: ${osArch}, supported: arm64, x64`
      )
    }

    this.arch = mappedArch
  }

  godotFilenameSuffix(useDotnet: boolean): string {
    if (useDotnet) {
      return `_mono_${this.arch}`
    }
    return `_${this.arch}.exe`
  }
  isGodotExecutable(basename: string): boolean {
    return basename.toLowerCase().endsWith(`_${this.arch}.exe`)
  }
  getUnzippedPath(
    installationDir: string,
    versionName: string,
    useDotnet: boolean
  ): string {
    return path.join(installationDir, versionName)
  }
}

export class MacOS implements Platform {
  GODOT_EXPORT_TEMPLATE_BASE_PATH = path.join(
    os.homedir(),
    '/Library/Application Support/Godot/'
  )

  godotFilenameSuffix(useDotnet: boolean): string {
    return `${useDotnet ? '_mono' : ''}_macos.universal`
  }
  isGodotExecutable(basename: string): boolean {
    return basename.toLowerCase() === 'godot'
  }
  getUnzippedPath(
    installationDir: string,
    versionName: string,
    useDotnet: boolean
  ): string {
    return path.join(installationDir, `Godot${useDotnet ? '_mono' : ''}.app`)
  }
}

/** Semantic version representation */
interface SemanticVersion {
  /** Version major number */
  major: string
  /** Version minor number */
  minor: string
  /** Version patch number */
  patch: string
  /** Pre-release label (e.g., `beta.16`) */
  label: string
}

/** Godot download url prefix. */
const GODOT_URL_PREFIX =
  'https://github.com/godotengine/godot-builds/releases/download/'
/** Godot filename prefix. */
const GODOT_FILENAME_PREFIX = 'Godot_v'

/**
 * Official semantic version regex.
 * See https://semver.org
 */
const SEMANTIC_VERSION_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

export function parseVersion(version: string): SemanticVersion {
  const match = version.match(SEMANTIC_VERSION_REGEX)
  if (match === null) {
    throw new Error(`⛔️ Invalid version: ${version}`)
  }

  const major = match[1] || ''
  const minor = match[2] || ''
  const patch = match[3] || ''
  const label = match[4] || ''
  return {major, minor, patch, label}
}

/**
 * Returns the Godot download url for the given version and platform.
 * @param versionString Version string.
 * @param platform Current platform instance.
 * @param useDotnet True to use the .NET-enabled version of Godot.
 * @param isTemplate True to return the url for the template
 * @returns Godot binary download url.
 */
export function getGodotUrl(
  versionString: string,
  platform: Platform,
  useDotnet: boolean,
  isTemplate: boolean
): string {
  const version = parseVersion(versionString)
  const major = version.major
  const minor = version.minor
  const patch = version.patch
  const label = version.label.replace('.', '')

  let url = `${GODOT_URL_PREFIX + major}.${minor}`
  if (patch !== '' && patch !== '0') {
    url += `.${patch}`
  }

  if (label !== '') {
    url += `-${label}/`
  } else {
    url += '-stable/'
  }

  if (!isTemplate)
    return `${url}${getGodotFilename(version, platform, useDotnet)}.zip`

  return `${url}${getGodotFilenameBase(version)}${
    useDotnet ? '_mono' : ''
  }_export_templates.tpz`
}

/**
 * Returns the Godot export template local path
 * @param versionString Version string.
 * @param platform Current platform instance.
 * @param useDotnet True to use the .NET-enabled version of Godot.
 * @returns export template local path
 */
export function getExportTemplatePath(
  versionString: string,
  platform: Platform,
  useDotnet: boolean
): string {
  const version = parseVersion(versionString)
  const major = version.major
  const minor = version.minor
  const patch = version.patch
  const label = version.label.replace('.', '')

  let folderName = `${major}.${minor}`
  if (patch !== '' && patch !== '0') {
    folderName += `.${patch}`
  }
  if (label !== '') {
    folderName += `.${label}`
  } else {
    folderName += '.stable'
  }
  if (useDotnet) folderName += '.mono'

  return normalize(
    path.join(
      platform.GODOT_EXPORT_TEMPLATE_BASE_PATH,
      version.major === '4' ? 'export_templates' : 'templates',
      folderName
    )
  )
}

export function getGodotFilename(
  version: SemanticVersion,
  platform: Platform,
  useDotnet: boolean
): string {
  return getGodotFilenameBase(version) + platform.godotFilenameSuffix(useDotnet)
}

export function getGodotFilenameBase(version: SemanticVersion): string {
  const major = version.major
  const minor = version.minor
  const patch = version.patch
  const label = version.label.replace('.', '')

  let filename = GODOT_FILENAME_PREFIX + major

  if (minor !== '') {
    filename += `.${minor}`
  }
  if (patch !== '' && patch !== '0') {
    filename += `.${patch}`
  }
  if (label !== '') {
    filename += `-${label}`
  } else {
    filename += '-stable'
  }

  return filename
}

export function getGodotFilenameFromVersionString(
  versionString: string,
  platform: Platform,
  useDotnet: boolean
): string {
  return getGodotFilename(parseVersion(versionString), platform, useDotnet)
}

export function getPlatform(
  processPlatform: NodeJS.Platform,
  arch = os.arch()
): Platform {
  switch (processPlatform) {
    case 'linux':
      core.info('🐧 Running on Linux')
      return new Linux(arch)
    case 'win32':
      core.info('⧉ Running on Windows')
      return new Windows(arch)
    case 'darwin':
      core.info('🍏 Running on macOS')
      return new MacOS()
    default:
      throw new Error(`⛔️ Unrecognized platform: ${process.platform}`)
  }
}

export async function findExecutablesRecursively(
  platform: Platform,
  dir: string,
  indent: string
): Promise<string[]> {
  core.info(`${indent}📁 ${dir}`)
  let executables: string[] = []
  const files = await fs.promises.readdir(dir, {withFileTypes: true})
  for (const file of files) {
    const filePath = path.join(dir, file.name)
    if (file.isDirectory()) {
      const additionalExecutables = await findExecutablesRecursively(
        platform,
        filePath,
        `${indent}  `
      )
      executables = executables.concat(additionalExecutables)
    } else {
      // Test if file is executable. GodotSharp.dll is always considered an
      // executable.
      let isExecutable = file.name === 'GodotSharp.dll'
      if (!isExecutable) {
        if (platform instanceof Windows) {
          // fs.constants.X_OK doesn't seem to work on Windows.
          // Resort to checking the file extension.
          if (file.name.toLowerCase().endsWith('.exe')) {
            isExecutable = true
          }
        } else {
          try {
            fs.accessSync(filePath, fs.constants.X_OK)
            isExecutable = true
          } catch {
            // File is not executable.
          }
        }
      }

      if (isExecutable) {
        core.info(`${indent}  🚀 ${file.name}`)
        executables.push(filePath)
      } else {
        core.info(`${indent}  📄 ${file.name}`)
      }
    }
  }
  return executables
}
