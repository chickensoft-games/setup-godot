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
  const customUrl = core.getInput('custom-url').replace(/\s/g, '')
  const useDotnet = core.getBooleanInput('use-dotnet')
  const binRelativePath = core.getInput('bin-path').replace(/\s/g, '')
  const godotSharpRelease = core.getBooleanInput('godot-sharp-release')
  const checkoutDirectory = process.env['GITHUB_WORKSPACE'] ?? ''
  let includeTemplates = core.getBooleanInput('include-templates')
  const useCache = core.getBooleanInput('cache')

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

  // Определяем значения для godotUrl, versionName и exportTemplateUrl
  let versionName = ''
  let godotUrl = ''
  let exportTemplateUrl = ''
  core.info(`Using custom url ${customUrl}`)
  if (customUrl.length > 0) {
    // Если задан customUrl, используем его вместо вычислений по версии
    core.info(`😎 Using custom Godot build from ${customUrl}`)
    versionName = 'custom_godot'
    godotUrl = customUrl

    // При использовании customUrl определить экспортные шаблоны нельзя (по умолчанию их нет)
    // Можно либо запретить, либо проигнорировать includeTemplates.
    // Тут просто отключаем.
    if (includeTemplates) {
      core.info(`⚠️  Templates are not supported with custom builds. Skipping templates.`)
    }
    includeTemplates = false
    exportTemplateUrl = ''
  } else {
    // Стандартная логика
    versionName = getGodotFilenameFromVersionString(
      version,
      platform,
      useDotnet
    )
    godotUrl = getGodotUrl(version, platform, useDotnet, false)
    exportTemplateUrl = includeTemplates
      ? getGodotUrl(version, platform, useDotnet, true)
      : ''
  }

  const godotDownloadPath = path.join(downloadsDir, `${versionName}.zip`)
  const godotInstallationPath = platform.getUnzippedPath(
    installationDir,
    versionName,
    useDotnet
  )
  const binDir = path.join(userDir, binRelativePath)
  const exportTemplatePath = includeTemplates
    ? getExportTemplatePath(version, platform, useDotnet)
    : ''
  const exportTemplateDownloadPath = includeTemplates
    ? path.join(downloadsDir, 'export_templates.zip')
    : ''

  core.info(`🤖 Godot version: ${version}`)
  core.info(`🤖 Godot version name: ${versionName}`)
  core.info(`🟣 Use .NET: ${useDotnet}`)
  core.info(`🤖 Godot download url: ${godotUrl}`)
  core.info(`🧑‍💼 User directory: ${userDir}`)
  core.info(`🌏 Downloads directory: ${downloadsDir}`)
  core.info(`📥 Godot download path: ${godotDownloadPath}`)
  core.info(`📦 Godot installation directory: ${installationDir}`)
  core.info(`🤖 Godot installation path: ${godotInstallationPath}`)

  if (includeTemplates) {
    core.info(`🤖 Export Template url: ${exportTemplateUrl}`)
    core.info(`📥 Export Template download path: ${exportTemplateDownloadPath}`)
    core.info(`🤖 Export Template Path: ${exportTemplatePath}`)
  } else {
    core.info(`⏭️ Skipping Export Templates.`)
  }

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

    const cachedPaths = includeTemplates
      ? [godotInstallationPath, exportTemplatePath]
      : [godotInstallationPath]
    const cacheKey = includeTemplates ? godotUrl : `${godotUrl}-no-templates`
    let cached = undefined

    if (useCache) {
      cached = await cache.restoreCache(cachedPaths.slice(), cacheKey)
    } else {
      core.info(`⏭️ Not using cache`)
    }

    let executables: string[]
    if (!cached) {
      // Download Godot
      core.info(`🙃 Previous Godot download not found in cache`)
      core.endGroup()

      core.startGroup(`📥 Downloading Godot to ${godotDownloadPath}...`)

      // If the ZIP file already exists locally, delete it before downloading
      if (fs.existsSync(godotDownloadPath)) fs.rmSync(godotDownloadPath)

      const godotDownloadedPath = await toolsCache.downloadTool(
        godotUrl,
        godotDownloadPath
      )
      core.info(`✅ Godot downloaded to ${godotDownloadedPath}`)
      core.endGroup()

      // Extract Godot
      core.startGroup(`📦 Extracting Godot to ${installationDir}...`)

      // If the godot installation folder already exists, remove it before extracting the ZIP file. This will "uninstall" other installations (e.g. on version changes).
      if (fs.existsSync(installationDir))
        fs.rmdirSync(installationDir, {recursive: true})

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

      if (includeTemplates && exportTemplateUrl) {
        core.startGroup(
          `📥 Downloading Export Templates to ${exportTemplateDownloadPath}...`
        )

        // If the ZIP file already exists locally, delete it before downloading
        if (fs.existsSync(exportTemplateDownloadPath))
          fs.rmSync(exportTemplateDownloadPath)

        const templateDownloadedPath = await toolsCache.downloadTool(
          exportTemplateUrl,
          exportTemplateDownloadPath
        )
        core.info(`✅ Export Templates downloaded to ${templateDownloadedPath}`)
        core.endGroup()

        core.startGroup(
          `📦 Extracting Export Templates to ${exportTemplatePath}...`
        )

        // If the export template folder already exists, remove it before extracting the ZIP file. This will "uninstall" other installations (e.g. on version changes).
        if (fs.existsSync(exportTemplatePath))
          fs.rmdirSync(exportTemplatePath, {recursive: true})

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
          `✅ templates moved to ${exportTemplatePath}`
        )
        core.endGroup()

        // Show extracted Export Template files recursively
        core.startGroup(`📄 Showing extracted files recursively...`)
        await findExecutablesRecursively(platform, exportTemplatePath, '')
        core.info(`✅ Files shown`)
        core.endGroup()
      }

      if (useCache) {
        // Save extracted Godot contents to cache
        core.startGroup(`💾 Saving extracted Godot download to cache...`)
        await cache.saveCache(cachedPaths, cacheKey)
        core.info(`✅ Godot saved to cache`)
        core.endGroup()
      }
    } else {
      core.info(`🎉 Previous Godot download found in cache!`)
      core.endGroup()

      core.startGroup(`📄 Showing cached files recursively...`)
      executables = await findExecutablesRecursively(
        platform,
        installationDir,
        ''
      )
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

    // If an alias already exists, clear the bin folder before creating the new alias
    if (fs.existsSync(binDir)) {
      fs.rmSync(binDir, {recursive: true, force: true})
      fs.mkdirSync(binDir, {recursive: true})
    }

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
    core.startGroup(`🔧 Adding environment variables...`)
    core.exportVariable('GODOT', godotAlias)
    core.info(`  GODOT=${godotAlias}`)
    core.exportVariable('GODOT4', godotAlias)
    core.info(`  GODOT4=${godotAlias}`)
    core.info(`✅ Environment variables added`)
    core.endGroup()

    core.info(`✅ Finished!`)
  } catch (error) {
    const message = `${error}`
    core.setFailed(message)
  }
}

run(getPlatform(process.platform))
