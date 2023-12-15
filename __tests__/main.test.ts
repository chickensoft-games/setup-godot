import {describe, expect, test} from '@jest/globals'
import * as os from 'os'
import * as path from 'path'

import {
  getExportTemplatePath,
  getGodotUrl,
  getPlatform,
  parseVersion
} from '../src/utils'
import normalizePath from 'normalize-path'

describe('parseVersion', () => {
  test('parses valid godot versions', () => {
    expect(parseVersion('3.5.2')).toEqual({
      major: '3',
      minor: '5',
      patch: '2',
      label: ''
    })

    expect(parseVersion('4.0.0-beta1')).toEqual({
      major: '4',
      minor: '0',
      patch: '0',
      label: 'beta1'
    })

    expect(parseVersion('4.0.0-beta.16')).toEqual({
      major: '4',
      minor: '0',
      patch: '0',
      label: 'beta.16'
    })
  })
})

describe('getGodotUrl', () => {
  describe('useDotnet = true', () => {
    test('4.0.0-beta1', () => {
      expect(
        getGodotUrl('4.0.0-beta1', getPlatform('linux'), true, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta1/Godot_v4.0-beta1_mono_linux_x86_64.zip'
      )
      expect(
        getGodotUrl('4.0.0-beta1', getPlatform('win32'), true, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta1/Godot_v4.0-beta1_mono_win64.zip'
      )
      expect(
        getGodotUrl('4.0.0-beta1', getPlatform('darwin'), true, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta1/Godot_v4.0-beta1_mono_macos.universal.zip'
      )
      expect(
        getGodotUrl('4.0.0-beta1', getPlatform('linux'), true, true)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta1/Godot_v4.0-beta1_mono_export_templates.tpz'
      )
    })
    test('4.0.0-beta.16', () => {
      expect(
        getGodotUrl('4.0.0-beta.16', getPlatform('linux'), true, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta16/Godot_v4.0-beta16_mono_linux_x86_64.zip'
      )
      expect(
        getGodotUrl('4.0.0-beta.16', getPlatform('win32'), true, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta16/Godot_v4.0-beta16_mono_win64.zip'
      )
      expect(
        getGodotUrl('4.0.0-beta.16', getPlatform('darwin'), true, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta16/Godot_v4.0-beta16_mono_macos.universal.zip'
      )
    })
    test('4.0.0-beta8', () => {
      expect(
        getGodotUrl('4.0.0-beta8', getPlatform('linux'), true, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta8/Godot_v4.0-beta8_mono_linux_x86_64.zip'
      )
      expect(
        getGodotUrl('4.0.0-beta8', getPlatform('win32'), true, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta8/Godot_v4.0-beta8_mono_win64.zip'
      )
      expect(
        getGodotUrl('4.0.0-beta8', getPlatform('darwin'), true, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta8/Godot_v4.0-beta8_mono_macos.universal.zip'
      )
    })
    test('4.0.0', () => {
      expect(getGodotUrl('4.0.0', getPlatform('linux'), true, false)).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-stable/Godot_v4.0-stable_mono_linux_x86_64.zip'
      )
      expect(getGodotUrl('4.0.0', getPlatform('win32'), true, false)).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-stable/Godot_v4.0-stable_mono_win64.zip'
      )
      expect(getGodotUrl('4.0.0', getPlatform('darwin'), true, false)).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-stable/Godot_v4.0-stable_mono_macos.universal.zip'
      )
      expect(getGodotUrl('4.0.0', getPlatform('linux'), true, true)).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-stable/Godot_v4.0-stable_mono_export_templates.tpz'
      )
    })
    test('3.5.2', () => {
      expect(getGodotUrl('3.5.2', getPlatform('linux'), true, true)).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/3.5.2-stable/Godot_v3.5.2-stable_mono_export_templates.tpz'
      )
    })
  })

  describe('useDotnet = false', () => {
    test('4.0.0-beta1', () => {
      expect(
        getGodotUrl('4.0.0-beta1', getPlatform('linux'), false, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta1/Godot_v4.0-beta1_linux.x86_64.zip'
      )
      expect(
        getGodotUrl('4.0.0-beta1', getPlatform('win32'), false, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta1/Godot_v4.0-beta1_win64.exe.zip'
      )
      expect(
        getGodotUrl('4.0.0-beta1', getPlatform('darwin'), false, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta1/Godot_v4.0-beta1_macos.universal.zip'
      )
      expect(
        getGodotUrl('4.0.0-beta1', getPlatform('darwin'), false, true)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta1/Godot_v4.0-beta1_export_templates.tpz'
      )
    })
    test('4.0.0-beta.16', () => {
      expect(
        getGodotUrl('4.0.0-beta.16', getPlatform('linux'), false, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta16/Godot_v4.0-beta16_linux.x86_64.zip'
      )
      expect(
        getGodotUrl('4.0.0-beta.16', getPlatform('win32'), false, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta16/Godot_v4.0-beta16_win64.exe.zip'
      )
      expect(
        getGodotUrl('4.0.0-beta.16', getPlatform('darwin'), false, false)
      ).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-beta16/Godot_v4.0-beta16_macos.universal.zip'
      )
    })
    test('4.0.0', () => {
      expect(getGodotUrl('4.0.0', getPlatform('linux'), false, true)).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/4.0-stable/Godot_v4.0-stable_export_templates.tpz'
      )
    })
    test('3.5.2', () => {
      expect(getGodotUrl('3.5.2', getPlatform('linux'), false, true)).toEqual(
        'https://github.com/godotengine/godot-builds/releases/download/3.5.2-stable/Godot_v3.5.2-stable_export_templates.tpz'
      )
    })
  })
})

describe('getExportTemplatePath', () => {
  describe('useDotnet = true', () => {
    test('4.0.0-beta1', () => {
      expect(
        getExportTemplatePath('4.0.0-beta1', getPlatform('linux'), true)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          '.local', 'share','godot','export_templates',
          '4.0.beta1.mono'
        ))
      )
      expect(
        getExportTemplatePath('4.0.0-beta1', getPlatform('win32'), true)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'AppData','Roaming','Godot','export_templates',
          '4.0.beta1.mono'
        ))
      )
      expect(
        getExportTemplatePath('4.0.0-beta1', getPlatform('darwin'), true)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'Library','Application Support','Godot','export_templates',
          '4.0.beta1.mono'
        ))
      )
    })
    test('4.0.0', () => {
      expect(
        getExportTemplatePath('4.0.0', getPlatform('linux'), true)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          '.local','share','godot','export_templates',
          '4.0.stable.mono'
        ))
      )
      expect(
        getExportTemplatePath('4.0.0', getPlatform('win32'), true)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'AppData','Roaming','Godot','export_templates',
          '4.0.stable.mono'
        ))
      )
      expect(
        getExportTemplatePath('4.0.0', getPlatform('darwin'), true)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'Library','Application Support','Godot','export_templates',
          '4.0.stable.mono'
        ))
      )
    })
    test('3.5.1', () => {
      expect(
        getExportTemplatePath('3.5.1', getPlatform('linux'), true)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          '.local','share','godot','templates',
          '3.5.1.stable.mono'
        ))
      )
      expect(
        getExportTemplatePath('3.5.1', getPlatform('win32'), true)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'AppData','Roaming','Godot','templates',
          '3.5.1.stable.mono'
        ))
      )
      expect(
        getExportTemplatePath('3.5.1', getPlatform('darwin'), true)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'Library','Application Support','Godot','templates',
          '3.5.1.stable.mono'
        ))
      )
    })
    test('3.5.0', () => {
      expect(
        getExportTemplatePath('3.5.0', getPlatform('linux'), true)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          '.local','share','godot','templates',
          '3.5.stable.mono'
        ))
      )
      expect(
        getExportTemplatePath('3.5.0', getPlatform('win32'), true)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'AppData','Roaming','Godot','templates',
          '3.5.stable.mono'
        ))
      )
      expect(
        getExportTemplatePath('3.5.0', getPlatform('darwin'), true)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'Library','Application Support','Godot','templates',
          '3.5.stable.mono'
        ))
      )
    })
  })

  describe('useDotnet = false', () => {
    test('4.0.0-beta1', () => {
      expect(
        getExportTemplatePath('4.0.0-beta1', getPlatform('linux'), false)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          '.local','share','godot','export_templates',
          '4.0.beta1'
        ))
      )
      expect(
        getExportTemplatePath('4.0.0-beta1', getPlatform('win32'), false)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'AppData','Roaming','Godot','export_templates',
          '4.0.beta1'
        ))
      )
      expect(
        getExportTemplatePath('4.0.0-beta1', getPlatform('darwin'), false)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'Library','Application Support','Godot','export_templates',
          '4.0.beta1'
        ))
      )
    })
    test('4.0.0', () => {
      expect(
        getExportTemplatePath('4.0.0', getPlatform('linux'), false)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          '.local','share','godot','export_templates',
          '4.0.stable'
        ))
      )
      expect(
        getExportTemplatePath('4.0.0', getPlatform('win32'), false)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'AppData','Roaming','Godot','export_templates',
          '4.0.stable'
        ))
      )
      expect(
        getExportTemplatePath('4.0.0', getPlatform('darwin'), false)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'Library','Application Support','Godot','export_templates',
          '4.0.stable'
        ))
      )
    })
    test('3.5.1', () => {
      expect(
        getExportTemplatePath('3.5.1', getPlatform('linux'), false)
      ).toEqual(
        normalizePath(path.join(os.homedir(), '.local','share','godot','templates', '3.5.1.stable'))
      )
      expect(
        getExportTemplatePath('3.5.1', getPlatform('win32'), false)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'AppData','Roaming','Godot','templates',
          '3.5.1.stable'
        ))
      )
      expect(
        getExportTemplatePath('3.5.1', getPlatform('darwin'), false)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'Library','Application Support','Godot','templates',
          '3.5.1.stable'
        ))
      )
    })
    test('3.5.0', () => {
      expect(
        getExportTemplatePath('3.5.0', getPlatform('linux'), false)
      ).toEqual(
        normalizePath(path.join(os.homedir(), '.local','share','godot','templates', '3.5.stable'))
      )
      expect(
        getExportTemplatePath('3.5.0', getPlatform('win32'), false)
      ).toEqual(
        normalizePath(path.join(os.homedir(), 'AppData','Roaming','Godot','templates', '3.5.stable'))
      )
      expect(
        getExportTemplatePath('3.5.0', getPlatform('darwin'), false)
      ).toEqual(
        normalizePath(path.join(
          os.homedir(),
          'Library','Application Support','Godot','templates',
          '3.5.stable'
        ))
      )
    })
  })
})
