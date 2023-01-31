import {describe, expect, test} from '@jest/globals'

import {getGodotUrl, getPlatform, parseVersion} from '../src/utils'

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
  test('4.0.0-beta1', () => {
    expect(getGodotUrl('4.0.0-beta1', getPlatform('linux'))).toEqual(
      'https://downloads.tuxfamily.org/godotengine/4.0/beta1/mono/Godot_v4.0-beta1_mono_linux_x86_64.zip'
    )
    expect(getGodotUrl('4.0.0-beta1', getPlatform('win32'))).toEqual(
      'https://downloads.tuxfamily.org/godotengine/4.0/beta1/mono/Godot_v4.0-beta1_mono_win64.zip'
    )
    expect(getGodotUrl('4.0.0-beta1', getPlatform('darwin'))).toEqual(
      'https://downloads.tuxfamily.org/godotengine/4.0/beta1/mono/Godot_v4.0-beta1_mono_macos.universal.zip'
    )
  })
  test('4.0.0-beta.16', () => {
    expect(getGodotUrl('4.0.0-beta.16', getPlatform('linux'))).toEqual(
      'https://downloads.tuxfamily.org/godotengine/4.0/beta16/mono/Godot_v4.0-beta16_mono_linux_x86_64.zip'
    )
    expect(getGodotUrl('4.0.0-beta.16', getPlatform('win32'))).toEqual(
      'https://downloads.tuxfamily.org/godotengine/4.0/beta16/mono/Godot_v4.0-beta16_mono_win64.zip'
    )
    expect(getGodotUrl('4.0.0-beta.16', getPlatform('darwin'))).toEqual(
      'https://downloads.tuxfamily.org/godotengine/4.0/beta16/mono/Godot_v4.0-beta16_mono_macos.universal.zip'
    )
  })
  test('4.0.0-beta8', () => {
    expect(getGodotUrl('4.0.0-beta8', getPlatform('linux'))).toEqual(
      'https://downloads.tuxfamily.org/godotengine/4.0/beta8/mono/Godot_v4.0-beta8_mono_linux_x86_64.zip'
    )
    expect(getGodotUrl('4.0.0-beta8', getPlatform('win32'))).toEqual(
      'https://downloads.tuxfamily.org/godotengine/4.0/beta8/mono/Godot_v4.0-beta8_mono_win64.zip'
    )
    expect(getGodotUrl('4.0.0-beta8', getPlatform('darwin'))).toEqual(
      'https://downloads.tuxfamily.org/godotengine/4.0/beta8/mono/Godot_v4.0-beta8_mono_macos.universal.zip'
    )
  })
  test('4.0.0', () => {
    expect(getGodotUrl('4.0.0', getPlatform('linux'))).toEqual(
      'https://downloads.tuxfamily.org/godotengine/4.0/mono/Godot_v4.0_mono_linux_x86_64.zip'
    )
    expect(getGodotUrl('4.0.0', getPlatform('win32'))).toEqual(
      'https://downloads.tuxfamily.org/godotengine/4.0/mono/Godot_v4.0_mono_win64.zip'
    )
    expect(getGodotUrl('4.0.0', getPlatform('darwin'))).toEqual(
      'https://downloads.tuxfamily.org/godotengine/4.0/mono/Godot_v4.0_mono_macos.universal.zip'
    )
  })
})
