// Phase 1F-B - Camera/microphone permission pre-flight checks for video sessions. Requests both
// permissions before entering VideoSessionScreen, surfaces denial state with actionable guidance.
// Using expo-camera for both (it handles mic when requesting camera permissions for video).

import { Platform, Linking, Alert } from 'react-native';

type CameraModule = typeof import('expo-camera');

let cameraModule: CameraModule | null | undefined;

function getCameraModule(): CameraModule | null {
  if (cameraModule !== undefined) return cameraModule;

  try {
    cameraModule = require('expo-camera') as CameraModule;
  } catch {
    cameraModule = null;
  }

  return cameraModule;
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface VideoPermissionResult {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  bothGranted: boolean;
}

/**
 * Check current permission status without requesting. Useful for determining whether to show
 * a pre-request explanation or go straight to the system prompt.
 */
export async function checkVideoPermissions(): Promise<VideoPermissionResult> {
  const camera = getCameraModule();
  if (!camera) {
    return { camera: 'denied', microphone: 'denied', bothGranted: false };
  }

  const cameraStatus = await camera.Camera.getCameraPermissionsAsync();
  const micStatus = await camera.Camera.getMicrophonePermissionsAsync();

  return {
    camera: cameraStatus.status === 'granted' ? 'granted' : cameraStatus.status === 'denied' ? 'denied' : 'undetermined',
    microphone: micStatus.status === 'granted' ? 'granted' : micStatus.status === 'denied' ? 'denied' : 'undetermined',
    bothGranted: cameraStatus.granted && micStatus.granted,
  };
}

/**
 * Request camera and microphone permissions. If denied, shows platform-specific guidance for
 * enabling in Settings. Returns true only if BOTH permissions are granted.
 */
export async function requestVideoPermissions(): Promise<boolean> {
  const camera = getCameraModule();
  if (!camera) {
    Alert.alert(
      'Camera Feature Unavailable',
      'Please update Expo Go or install a new MoodMate development build before starting a video session.'
    );
    return false;
  }

  // Request camera first (video calls need video)
  const cameraResult = await camera.Camera.requestCameraPermissionsAsync();
  
  if (!cameraResult.granted) {
    showPermissionDeniedAlert('camera');
    return false;
  }

  // Request microphone (audio is required for counselling sessions)
  const micResult = await camera.Camera.requestMicrophonePermissionsAsync();
  
  if (!micResult.granted) {
    showPermissionDeniedAlert('microphone');
    return false;
  }

  return true;
}

/**
 * Platform-specific alert guiding users to Settings when permissions are denied. On iOS, can
 * deep-link directly to app settings; on Android, opens system settings (user must navigate).
 */
function showPermissionDeniedAlert(type: 'camera' | 'microphone') {
  const permission = type === 'camera' ? 'Camera' : 'Microphone';
  const message = Platform.select({
    ios: `${permission} access is required for video sessions. Please enable it in Settings → MoodMate → ${permission}.`,
    android: `${permission} access is required for video sessions. Please enable it in your device settings.`,
    default: `${permission} access is required for video sessions.`,
  });

  Alert.alert(
    `${permission} Permission Required`,
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.openSettings();
          }
        },
      },
    ]
  );
}

/**
 * Validation guard for VideoSessionScreen - checks permissions, requests if needed, blocks
 * navigation if denied. Returns true only if user grants (or has already granted) both.
 */
export async function ensureVideoPermissions(): Promise<boolean> {
  const current = await checkVideoPermissions();
  
  // Already granted - proceed immediately
  if (current.bothGranted) {
    return true;
  }

  // One or both denied previously - show alert and don't re-request (system won't show prompt)
  if (current.camera === 'denied' || current.microphone === 'denied') {
    const deniedType = current.camera === 'denied' ? 'camera' : 'microphone';
    showPermissionDeniedAlert(deniedType);
    return false;
  }

  // Undetermined - request now
  return requestVideoPermissions();
}
