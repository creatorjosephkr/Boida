import ctypes
import json
import sys
import subprocess
from ctypes import c_void_p, c_uint32, c_float, byref, Structure, sizeof, create_string_buffer

class AudioObjectPropertyAddress(Structure):
    _fields_ = [
        ('mSelector', c_uint32),
        ('mScope', c_uint32),
        ('mElement', c_uint32)
    ]

kAudioObjectSystemObject = 1
kAudioHardwarePropertyDefaultOutputDevice = int.from_bytes(b'dOut', 'big')
kAudioHardwarePropertyDevices = int.from_bytes(b'dev#', 'big')
kAudioObjectPropertyScopeGlobal = int.from_bytes(b'glob', 'big')
kAudioObjectPropertyName = int.from_bytes(b'lnam', 'big')
kAudioDevicePropertyStreams = int.from_bytes(b'stm#', 'big')
kAudioObjectPropertyScopeOutput = int.from_bytes(b'outp', 'big')
kAudioDevicePropertyVolumeScalar = int.from_bytes(b'volm', 'big')
kAudioDevicePropertyMute = int.from_bytes(b'mute', 'big')

def load_libs():
    try:
        coreaudio = ctypes.cdll.LoadLibrary('/System/Library/Frameworks/CoreAudio.framework/CoreAudio')
        cf = ctypes.cdll.LoadLibrary('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')
        return coreaudio, cf
    except Exception:
        return None, None

def get_device_volume(coreaudio, dev_id):
    if not coreaudio or not dev_id:
        return None
    vol = c_float(0.0)
    s_vol = c_uint32(sizeof(vol))
    for elem in [0, 1]:
        addr = AudioObjectPropertyAddress(kAudioDevicePropertyVolumeScalar, kAudioObjectPropertyScopeOutput, elem)
        res = coreaudio.AudioObjectGetPropertyData(dev_id, byref(addr), 0, None, byref(s_vol), byref(vol))
        if res == 0:
            return round(vol.value * 100)
    return None

def set_device_volume(coreaudio, dev_id, percent):
    percent = max(0, min(100, int(percent)))
    val = c_float(percent / 100.0)
    success = False
    if coreaudio and dev_id:
        for elem in [0, 1]:
            addr = AudioObjectPropertyAddress(kAudioDevicePropertyVolumeScalar, kAudioObjectPropertyScopeOutput, elem)
            res = coreaudio.AudioObjectSetPropertyData(dev_id, byref(addr), 0, None, sizeof(val), byref(val))
            if res == 0:
                success = True
                break
    try:
        subprocess.run(['osascript', '-e', f'set volume output volume {percent}'], capture_output=True)
        success = True
    except Exception:
        pass
    return success

def get_device_mute(coreaudio, dev_id):
    if not coreaudio or not dev_id:
        return False
    mute = c_uint32(0)
    s_mute = c_uint32(sizeof(mute))
    for elem in [0, 1]:
        addr = AudioObjectPropertyAddress(kAudioDevicePropertyMute, kAudioObjectPropertyScopeOutput, elem)
        res = coreaudio.AudioObjectGetPropertyData(dev_id, byref(addr), 0, None, byref(s_mute), byref(mute))
        if res == 0:
            return bool(mute.value)
    return False

def set_device_mute(coreaudio, dev_id, muted):
    m = c_uint32(1 if muted else 0)
    success = False
    if coreaudio and dev_id:
        for elem in [0, 1]:
            addr = AudioObjectPropertyAddress(kAudioDevicePropertyMute, kAudioObjectPropertyScopeOutput, elem)
            res = coreaudio.AudioObjectSetPropertyData(dev_id, byref(addr), 0, None, sizeof(m), byref(m))
            if res == 0:
                success = True
                break
    try:
        subprocess.run(['osascript', '-e', f'set volume output muted {str(muted).lower()}'], capture_output=True)
        success = True
    except Exception:
        pass
    return success

def get_audio_devices(target_id=None):
    coreaudio, cf = load_libs()
    if not coreaudio or not cf:
        return {'defaultId': 0, 'volume': 70, 'isMuted': False, 'devices': []}

    addr_def = AudioObjectPropertyAddress(kAudioHardwarePropertyDefaultOutputDevice, kAudioObjectPropertyScopeGlobal, 0)
    def_id = c_uint32(0)
    s_def = c_uint32(sizeof(def_id))
    coreaudio.AudioObjectGetPropertyData(kAudioObjectSystemObject, byref(addr_def), 0, None, byref(s_def), byref(def_id))

    active_id = target_id if (target_id and target_id > 0) else def_id.value

    addr_devs = AudioObjectPropertyAddress(kAudioHardwarePropertyDevices, kAudioObjectPropertyScopeGlobal, 0)
    size_devs = c_uint32(0)
    coreaudio.AudioObjectGetPropertyDataSize(kAudioObjectSystemObject, byref(addr_devs), 0, None, byref(size_devs))
    num = size_devs.value // sizeof(c_uint32)
    dev_ids = (c_uint32 * num)()
    coreaudio.AudioObjectGetPropertyData(kAudioObjectSystemObject, byref(addr_devs), 0, None, byref(size_devs), byref(dev_ids))

    out_devs = []
    for d in dev_ids:
        addr_stm = AudioObjectPropertyAddress(kAudioDevicePropertyStreams, kAudioObjectPropertyScopeOutput, 0)
        s_stm = c_uint32(0)
        res = coreaudio.AudioObjectGetPropertyDataSize(d, byref(addr_stm), 0, None, byref(s_stm))
        if res != 0 or s_stm.value == 0:
            continue
        addr_name = AudioObjectPropertyAddress(kAudioObjectPropertyName, kAudioObjectPropertyScopeGlobal, 0)
        cfstr = c_void_p()
        s_name = c_uint32(sizeof(cfstr))
        coreaudio.AudioObjectGetPropertyData(d, byref(addr_name), 0, None, byref(s_name), byref(cfstr))
        buf = create_string_buffer(256)
        cf.CFStringGetCString(cfstr, buf, 256, 0x08000100)
        name = buf.value.decode('utf-8', 'ignore')
        out_devs.append({'id': int(d), 'name': name, 'isDefault': (d == def_id.value)})

    vol = get_device_volume(coreaudio, active_id)
    if vol is None and def_id.value != active_id:
        vol = get_device_volume(coreaudio, def_id.value)
    if vol is None:
        vol = 70  # fallback

    muted = get_device_mute(coreaudio, active_id)

    return {
        'defaultId': int(def_id.value),
        'volume': int(vol),
        'isMuted': bool(muted),
        'devices': out_devs
    }

if __name__ == '__main__':
    coreaudio, cf = load_libs()
    args = sys.argv[1:]
    if len(args) >= 3 and args[0] == 'set-volume':
        dev_id = int(args[1]) if args[1] != 'null' and args[1] != '0' else 0
        pct = int(args[2])
        ok = set_device_volume(coreaudio, dev_id, pct)
        print(json.dumps({'success': ok, 'volume': pct}))
    elif len(args) >= 3 and args[0] == 'set-mute':
        dev_id = int(args[1]) if args[1] != 'null' and args[1] != '0' else 0
        muted = args[2].lower() in ['1', 'true', 'yes']
        ok = set_device_mute(coreaudio, dev_id, muted)
        print(json.dumps({'success': ok, 'isMuted': muted}))
    else:
        target_id = int(args[0]) if (args and args[0].isdigit()) else None
        print(json.dumps(get_audio_devices(target_id)))
