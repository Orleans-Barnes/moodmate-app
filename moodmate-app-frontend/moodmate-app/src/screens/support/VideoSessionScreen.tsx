import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { completeAppointment, getAppointmentMeeting, getCounsellorAppointmentMeeting } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import type { MeetingWindowView } from '@/api/types';
import { colors, fonts, fontSizes, spacing, radii, calm } from '@/theme/tokens';
import { ensureVideoPermissions } from '@/utils/videoPermissions';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoSession'>;

// Re-checks the join window every 20s while it's not yet open, so a participant who opens this
// screen ahead of time (the "Join Session" button appears from 15 min before, same as the window
// itself opens) gets dropped straight into the call the moment it becomes available, with no
// manual refresh needed. Stops polling once open - the WebView takes over from there.
const POLL_INTERVAL_MS = 20000;

function escapeForJs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Phase 1F-B - embeds 8x8's JaaS external_api.js exactly as their own "Sample App" snippet does,
// scoped to our AppID via `roomName` (format "{appId}/{roomSuffix}", supplied by the backend - see
// MeetingWindowView). No JWT is passed: no real JaaS API key is configured yet (deliberate scope
// decision, see MASTER_IMPLEMENTATION_TRACKER.md Phase 1F-B), so this is an unauthenticated join,
// same security model as a plain meet.jit.si room - the backend withholding `roomName` outside the
// authorized window/identity is what actually gates access, not anything in this page.
function buildJitsiHtml(roomName: string, displayName: string): string {
  const appId = roomName.split('/')[0];
  const safeRoom = escapeForJs(roomName);
  const safeName = escapeForJs(displayName);
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <script src="https://8x8.vc/${appId}/external_api.js"></script>
  <style>
    html, body, #jaas-container { height: 100%; margin: 0; padding: 0; background: #16103A; }
    #connection-indicator {
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 107, 107, 0.95);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      font-weight: 600;
      z-index: 9999;
      display: none;
    }
  </style>
</head>
<body>
  <div id="connection-indicator">Reconnecting...</div>
  <div id="jaas-container"></div>
  <script>
    function boot() {
      try {
        var api = new JitsiMeetExternalAPI("8x8.vc", {
          roomName: "${safeRoom}",
          parentNode: document.querySelector('#jaas-container'),
          userInfo: { displayName: "${safeName}" },
          configOverwrite: {
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableNoAudioDetection: true,
            enableNoisyMicDetection: true
          },
          interfaceConfigOverwrite: { MOBILE_APP_PROMO: false }
        });
        
        var indicator = document.getElementById('connection-indicator');
        var poorConnectionTimeout = null;
        
        // Connection quality monitoring - show indicator on sustained poor quality
        api.addEventListener('connectionQualityChanged', function(event) {
          if (event && event.connectionQuality < 50) {
            if (poorConnectionTimeout) clearTimeout(poorConnectionTimeout);
            poorConnectionTimeout = setTimeout(function() {
              indicator.textContent = 'Poor connection';
              indicator.style.display = 'block';
            }, 2000); // Only show after 2s of poor quality to avoid flicker
          } else if (event && event.connectionQuality >= 50) {
            if (poorConnectionTimeout) clearTimeout(poorConnectionTimeout);
            indicator.style.display = 'none';
          }
        });
        
        api.addEventListener('readyToClose', function () {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage('CALL_ENDED');
        });
      } catch (e) {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage('CALL_LOAD_ERROR');
      }
    }
    if (document.readyState === 'complete') { boot(); } else { window.addEventListener('load', boot); }
  </script>
</body>
</html>`;
}

function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Phase 1F-B - the actual "Secure Counselling Session" screen. Fetches a time- and
 * identity-gated join window from the backend (student vs counsellor endpoint, chosen by the
 * logged-in role) rather than ever storing a room name client-side. Three states: loading the
 * window, window closed (shows the reason + opens-at time, polls until open), window open (renders
 * the WebView call). */
export function VideoSessionScreen({ route, navigation }: Props) {
  const { appointmentId, otherPartyName } = route.params;
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role);
  const displayName = useAuthStore((s) => s.user?.fullName) ?? 'MoodMate user';

  const [meeting, setMeeting] = useState<MeetingWindowView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(false);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [webViewReloadKey, setWebViewReloadKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWindow = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const result = role === 'COUNSELLOR'
        ? await getCounsellorAppointmentMeeting(token, appointmentId)
        : await getAppointmentMeeting(token, appointmentId);
      setMeeting(result);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      // Phase 1F-B - Enhanced error handling with specific, actionable messages
      let errorMessage = 'Could not check the session status.';
      
      if (err instanceof ApiRequestError) {
        if (err.message.includes('not found') || err.message.includes('404')) {
          errorMessage = 'This appointment could not be found. It may have been cancelled.';
        } else if (err.message.includes('unauthorized') || err.message.includes('403')) {
          errorMessage = 'You don\'t have permission to access this session.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Auto-retry with exponential backoff for network errors (max 3 attempts)
      if (errorMessage.includes('Network error') && retryCount < 3) {
        const delayMs = Math.min(1000 * Math.pow(2, retryCount), 8000); // 1s, 2s, 4s
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchWindow(true);
        }, delayMs);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, role, appointmentId, retryCount]);

  useFocusEffect(useCallback(() => {
    // Phase 1F-B - Permission pre-flight: check camera/mic permissions before fetching the join
    // window. If denied, shows the permissionDenied state with Settings deep-link guidance.
    async function checkPermissionsAndFetch() {
      const granted = await ensureVideoPermissions();
      if (!granted) {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }
      setPermissionDenied(false);
      fetchWindow();
    }
    checkPermissionsAndFetch();
  }, [fetchWindow]));

  useEffect(() => {
    if (meeting && !meeting.open) {
      pollRef.current = setInterval(() => fetchWindow(true), POLL_INTERVAL_MS);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return undefined;
  }, [meeting, fetchWindow]);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
  }, []);

  function handleWebViewMessage(nativeEvent: { data: string }) {
    if (nativeEvent.data === 'CALL_LOAD_ERROR') {
      setWebViewError('Video session failed to initialize. Please try again.');
      return;
    }

    if (nativeEvent.data === 'CALL_ENDED') {
      // Counsellor Platform (Milestone 4) - call-end auto-complete. Only the counsellor side
      // triggers this (a student ending the call shouldn't unilaterally mark it complete); fire-
      // and-forget with a swallowed error so a stale/edge-case appointment state (e.g. already
      // COMPLETED, or was never actually CONFIRMED) never blocks navigating back.
      if (role === 'COUNSELLOR' && token) {
        completeAppointment(token, appointmentId).catch(() => {});
      }
      navigation.goBack();
    }
  }

  const headerBar = (
    <View style={[s.header, { paddingTop: insets.top + 10 }]}>
      <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
        <Text style={s.backTxt}>‹</Text>
      </Pressable>
      <View style={s.headerMeta}>
        <Text style={s.headerTitle}>Secure Counselling Session</Text>
        <Text style={s.headerSub}>with {otherPartyName}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={s.root}>
        {headerBar}
        <View style={s.centerBox}>
          <ActivityIndicator color={calm.primary} size="large" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.root}>
        {headerBar}
        <View style={s.centerBox}>
          <Ionicons name="warning-outline" size={40} color={calm.rust} />
          <Text style={s.stateTitle}>Couldn't load this session</Text>
          <Text style={s.stateSub}>{error}</Text>
          <Pressable style={s.retryBtn} onPress={() => fetchWindow()}>
            <Text style={s.retryTxt}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={s.root}>
        {headerBar}
        <View style={s.centerBox}>
          <Ionicons name="videocam-off-outline" size={40} color={calm.rust} />
          <Text style={s.stateTitle}>Camera & Microphone Required</Text>
          <Text style={s.stateSub}>
            Video sessions need camera and microphone access. Please enable them in your device settings and try again.
          </Text>
          <Pressable style={s.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={s.retryTxt}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!meeting?.open) {
    const reasonIcon = meeting?.reason === 'EXPIRED' ? 'time-outline' : meeting?.reason === 'NOT_CONFIRMED' ? 'help-circle-outline' : 'hourglass-outline';
    return (
      <View style={s.root}>
        {headerBar}
        <View style={s.centerBox}>
          <Ionicons name={reasonIcon} size={40} color={calm.primary} />
          <Text style={s.stateTitle}>{meeting?.message ?? 'Session not available yet'}</Text>
          {meeting?.reason === 'TOO_EARLY' && (
            <Text style={s.stateSub}>Opens at {formatClockTime(meeting.windowOpensAt)}</Text>
          )}
          <Pressable style={s.retryBtn} onPress={() => fetchWindow()}>
            <Text style={s.retryTxt}>Check again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {headerBar}
      {webViewError ? (
        <View style={s.centerBox}>
          <Ionicons name="warning-outline" size={40} color={calm.rust} />
          <Text style={s.stateTitle}>Video session failed to load</Text>
          <Text style={s.stateSub}>{webViewError}</Text>
          <Pressable
            style={s.retryBtn}
            onPress={() => {
              setWebViewError(null);
              setWebViewLoading(true);
              setWebViewReloadKey((key) => key + 1);
            }}
          >
            <Text style={s.retryTxt}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={s.webviewWrapper}>
          {webViewLoading && (
            <View style={s.webviewLoader} pointerEvents="none">
              <ActivityIndicator color={calm.primary} size="large" />
            </View>
          )}
          <WebView
            key={`${meeting.roomName}-${webViewReloadKey}`}
            style={s.webview}
            source={{ html: buildJitsiHtml(meeting.roomName!, displayName) }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            onLoadStart={() => {
              setWebViewLoading(true);
              setWebViewError(null);
            }}
            onLoadEnd={() => setWebViewLoading(false)}
            onError={() => setWebViewError('Unable to load the video session. Please check your connection and try again.')}
            onHttpError={({ nativeEvent }) => setWebViewError(
              `Video session could not load (${nativeEvent.statusCode}). Please try again.`
            )}
            onMessage={(event) => handleWebViewMessage(event.nativeEvent)}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingBottom: 14,
  },
  backBtn: { padding: 4 },
  backTxt: { fontSize: 28, color: calm.forest, lineHeight: 32 },
  headerMeta: { flex: 1 },
  headerTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: calm.forest },
  headerSub: { fontFamily: fonts.bodyMedium, fontSize: 11, color: calm.muted },
  // The embedded Jitsi HTML sets its own dark background — that's the video-call vendor's UI, not
  // ours to restyle, so the WebView container matches it here to avoid a color flash at load.
  webview: { flex: 1, backgroundColor: '#16103A' },
  webviewWrapper: { flex: 1, backgroundColor: '#16103A' },
  webviewLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 16, 58, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: 8 },
  stateTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: calm.forest, textAlign: 'center', marginTop: 4 },
  stateSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: calm.muted, textAlign: 'center' },
  retryBtn: {
    marginTop: 16, backgroundColor: colors.coral, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radii.pill,
  },
  retryTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#FFFFFF' },
});
