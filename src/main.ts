import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as toolsCache from '@actions/tool-cache'
import * as fs from 'fs'
import * as os from 'os'
import path from 'path'

import {
  findExecutablesRecursively,
  getExportTemplatePath,
  getGodotFilenameFromVersionString,
  getGodotUrl,
  getPlatform,
  Platform
} from './utils'

async function run(platform: Platform): Promise<void> {
  // Get action inputs
  const pathRelative = core.getInput('path').replace(/\s/g, '')
  const downloadsRelativePath = core
    .getInput('downloads-path')
    .replace(/\s/g, '')
  let version = core.getInput('version').replace(/\s/g, '')
  const useDotnet = core.getBooleanInput('use-dotnet')
  const binRelativePath = core.getInput('bin-path').replace(/\s/g, '')
  const godotSharpRelease = core.getBooleanInput('godot-sharp-release')
  const checkoutDirectory = process.env['GITHUB_WORKSPACE'] ?? ''

  const userDir = os.homedir()
  const downloadsDir = path.join(userDir, downloadsRelativePath)
  const installationDir = path.join(userDir, pathRelative)

  // Log values
  core.startGroup('🏝 Environment Information')
  core.info(`📁 Checkout directory: ${checkoutDirectory}`)

  // See if Godot version needs to be inferred from a global.json file.
  if (version.toLowerCase().includes('global')) {
    const globalJsonPath = path.join(checkoutDirectory, version)
    const hasGlobalJsonFile = fs.existsSync(globalJsonPath)
    core.info(`📢 Inferring Godot version from global.json file.`)
    core.info(`🌐 global.json file path: ${globalJsonPath}`)
    core.info(`🌐 global.json file exists: ${hasGlobalJsonFile}`)
    if (!hasGlobalJsonFile) {
      throw new Error(
        `🚨 Cannot find global.json file to infer the Godot version from.`
      )
    }
    const globalJsonFileContents = fs.readFileSync(globalJsonPath, 'utf8')
    core.info(`🖨 global.json contents: ${globalJsonFileContents}`)
    const globalJson = JSON.parse(globalJsonFileContents) ?? {}
    core.info(
      `🖨 global.json parsed contents: ${JSON.stringify(
        globalJsonFileContents,
        null,
        2
      )}`
    )
    version = globalJson['msbuild-sdks']['Godot.NET.Sdk'] ?? ''
  }

  // Compute derived information from Godot version.
  const versionName = getGodotFilenameFromVersionString(
    version,
    platform,
    useDotnet
  )
  const godotUrl = getGodotUrl(version, platform, useDotnet, false)
  const godotDownloadPath = path.join(downloadsDir, `${versionName}.zip`)
  const godotInstallationPath = platform.getUnzippedPath(
    installationDir,
    versionName,
    useDotnet
  )
  const binDir = path.join(userDir, binRelativePath)

  const exportTemplateUrl = getGodotUrl(version, platform, useDotnet, true)
  const exportTemplatePath = getExportTemplatePath(version, platform, useDotnet)
  const exportTemplateDownloadPath = path.join(
    downloadsDir,
    'export_templates.zip'
  )

  core.info(`🤖 Godot version: ${version}`)
  core.info(`🤖 Godot version name: ${versionName}`)
  core.info(`🟣 Use .NET: ${useDotnet}`)
  core.info(`🤖 Godot download url: ${godotUrl}`)
  core.info(`🧑‍💼 User directory: ${userDir}`)
  core.info(`🌏 Downloads directory: ${downloadsDir}`)
  core.info(`📥 Godot download path: ${godotDownloadPath}`)
  core.info(`📦 Godot installation directory: ${installationDir}`)
  core.info(`🤖 Godot installation path: ${godotInstallationPath}`)
  core.info(`🤖 Export Template url: ${exportTemplateUrl}`)
  core.info(`📥 Export Template download path: ${exportTemplateDownloadPath}`)
  core.info(`🤖 Export Template Path: ${exportTemplatePath}`)
  core.info(`📂 Bin directory: ${binDir}`)
  core.info(`🤖 GodotSharp release: ${godotSharpRelease}`)
  core.endGroup()

  try {
    // Ensure paths we are using exist.
    core.startGroup(`📂 Ensuring working directories exist...`)
    fs.mkdirSync(downloadsDir, {recursive: true})
    fs.mkdirSync(installationDir, {recursive: true})
    fs.mkdirSync(binDir, {recursive: true})
    core.info(`✅ Working directories exist`)
    core.endGroup()

    // See if Godot is already installed.
    core.startGroup(`🤔 Checking if Godot is already in cache...`)
    const cached = await cache.restoreCache(
      [godotInstallationPath, exportTemplatePath],
      godotUrl
    )

    let executables: string[]
    if (!cached) {
      // Download Godot
      core.info(`🙃 Previous Godot download not found in cache`)
      core.endGroup()

      core.startGroup(`📥 Downloading Godot to ${godotDownloadPath}...`)
      const godotDownloadedPath = await toolsCache.downloadTool(
        godotUrl,
        godotDownloadPath
      )
      core.info(`✅ Godot downloaded to ${godotDownloadedPath}`)
      core.endGroup()

      core.startGroup(
        `📥 Downloading Export Templates to ${exportTemplateDownloadPath}...`
      )
      const templateDownloadedPath = await toolsCache.downloadTool(
        exportTemplateUrl,
        exportTemplateDownloadPath
      )
      core.info(`✅ Export Templates downloaded to ${templateDownloadedPath}`)
      core.endGroup()

      // Extract Godot
      core.startGroup(`📦 Extracting Godot to ${installationDir}...`)
      const godotExtractedPath = await toolsCache.extractZip(
        godotDownloadedPath,
        installationDir
      )
      core.info(`✅ Godot extracted to ${godotExtractedPath}`)
      core.endGroup()

      // Show extracted Godot files recursively and list executables.
      core.startGroup(`📄 Showing extracted files recursively...`)
      executables = await findExecutablesRecursively(
        platform,
        installationDir,
        ''
      )
      core.info(`✅ Files shown`)
      core.endGroup()

      core.startGroup(
        `📦 Extracting Export Templates to ${exportTemplatePath}...`
      )
      const exportTemplateExtractedPath = await toolsCache.extractZip(
        templateDownloadedPath,
        path.dirname(exportTemplatePath)
      )
      core.info(
        `✅ Export Templates extracted to ${exportTemplateExtractedPath}`
      )
      fs.renameSync(
        path.join(exportTemplateExtractedPath, 'templates'),
        exportTemplatePath
      )
      core.info(
        `✅ ${path.join(
          path.dirname(exportTemplateExtractedPath),
          'templates'
        )} moved to ${exportTemplatePath}`
      )
      core.endGroup()

      // Show extracted Export Template files recursively
      core.startGroup(`📄 Showing extracted files recursively...`)
      await findExecutablesRecursively(platform, exportTemplatePath, '')
      core.info(`✅ Files shown`)
      core.endGroup()

      // Save extracted Godot contents to cache
      core.startGroup(`💾 Saving extracted Godot download to cache...`)
      await cache.saveCache(
        [godotInstallationPath, exportTemplatePath],
        godotUrl
      )
      core.info(`✅ Godot saved to cache`)
      core.endGroup()
    } else {
      core.info(`🎉 Previous Godot download found in cache!`)
      core.endGroup()

      core.startGroup(`📄 Showing cached files recursively...`)
      executables = await findExecutablesRecursively(
        platform,
        installationDir,
        ''
      )
      await findExecutablesRecursively(platform, exportTemplatePath, '')
      core.info(`✅ Files shown`)
      core.endGroup()
    }

    core.startGroup(`🚀 Executables:`)
    for (const executable of executables) {
      core.info(`  🚀 ${executable}`)
    }
    core.info(`✅ Executables shown`)
    core.endGroup()

    const godotExecutable = executables.find(exe =>
      platform.isGodotExecutable(path.basename(exe))
    )
    const godotSharp = executables.find(exe => {
      const file = exe.toLowerCase()
      return (
        file.endsWith('godotsharp.dll') &&
        (godotSharpRelease ? file.includes('release') : file.includes('debug'))
      )
    })!

    if (!godotExecutable) {
      throw new Error('🚨 No Godot executable found!')
    }

    if (!godotSharp && useDotnet) {
      throw new Error('🚨 No GodotSharp.dll found!')
    }

    core.startGroup(`🚀 Resolve Godot Executables:`)
    core.info(`🚀 Godot executable found at ${godotExecutable}`)
    if (useDotnet) {
      core.info(`🚀 GodotSharp.dll found at ${godotSharp}`)
    }
    core.endGroup()

    // Add bin directory to PATH
    core.startGroup(`🔦 Update PATH...`)
    core.addPath(binDir)
    core.info(`🔦 Added Bin Directory to PATH: ${binDir}`)
    // Add path containing GodotSharp.dll to PATH
    core.endGroup()

    // Create symlink to Godot executable
    const godotAlias = path.join(binDir, 'godot')
    core.startGroup(`🔗 Creating symlinks to executables...`)
    fs.linkSync(godotExecutable, godotAlias)
    core.info(`✅ Symlink to Godot created`)
    const godotSharpDirAlias = path.join(binDir, 'GodotSharp')
    if (useDotnet) {
      // Create symlink to GodotSharp directory
      const godotSharpDir = path.join(path.dirname(godotSharp), '../..')
      fs.symlinkSync(godotSharpDir, godotSharpDirAlias)
      core.info(`✅ Symlink to GodotSharp created at ${godotSharpDirAlias}`)
    }
    core.endGroup()

    // Add environment variables
    core.startGroup(`🔧 Adding environment variables... - redirecting directly to godot Executable`)
    core.exportVariable('GODOT', godotExecutable)
    core.info(`  GODOT=${godotExecutable}`)
    core.exportVariable('GODOT4', godotExecutable)
    core.info(`  GODOT4=${godotExecutable}`)
    core.info(`✅ Environment variables added`)
    core.endGroup()

    core.info(`✅ Finished!`)
  } catch (error) {
    const message = `${error}`
    core.setFailed(message)
  }
}

run(getPlatform(process.platform))
