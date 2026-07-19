import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/useAuthStore';
import { getAppointmentMeeting, getCounsellorAppointmentMeeting } from '@/api/support';
import { ApiRequestError } from '@/api/client';
import type { MeetingWindowView } from '@/api/types';
import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

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
  <style>html, body, #jaas-container { height: 100%; margin: 0; padding: 0; background: #16103A; }</style>
</head>
<body>
  <div id="jaas-container"></div>
  <script>
    function boot() {
      try {
        var api = new JitsiMeetExternalAPI("8x8.vc", {
          roomName: "${safeRoom}",
          parentNode: document.querySelector('#jaas-container'),
          userInfo: { displayName: "${safeName}" },
          configOverwrite: { prejoinPageEnabled: false, disableDeepLinking: true },
          interfaceConfigOverwrite: { MOBILE_APP_PROMO: false }
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchWindow = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const result = role === 'COUNSELLOR'
        ? await getCounsellorAppointmentMeeting(token, appointmentId)
        : await getAppointmentMeeting(token, appointmentId);
      setMeeting(result);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not check the session status.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, role, appointmentId]);

  useFocusEffect(useCallback(() => {
    fetchWindow();
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
  }, []);

  function handleWebViewMessage(nativeEvent: { data: string }) {
    if (nativeEvent.data === 'CALL_ENDED' || nativeEvent.data === 'CALL_LOAD_ERROR') {
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
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.root}>
        {headerBar}
        <View style={s.centerBox}>
          <Text style={s.stateEmoji}>⚠️</Text>
          <Text style={s.stateTitle}>Couldn't load this session</Text>
          <Text style={s.stateSub}>{error}</Text>
          <Pressable style={s.retryBtn} onPress={() => fetchWindow()}>
            <Text style={s.retryTxt}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!meeting?.open) {
    const reasonEmoji = meeting?.reason === 'EXPIRED' ? '⏱️' : meeting?.reason === 'NOT_CONFIRMED' ? '🕓' : '⏳';
    return (
      <View style={s.root}>
        {headerBar}
        <View style={s.centerBox}>
          <Text style={s.stateEmoji}>{reasonEmoji}</Text>
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
      <WebView
        style={s.webview}
        source={{ html: buildJitsiHtml(meeting.roomName!, displayName) }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        onMessage={(event) => handleWebViewMessage(event.nativeEvent)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#16103A' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingBottom: 14,
  },
  backBtn: { padding: 4 },
  backTxt: { fontSize: 28, color: '#FFFFFF', lineHeight: 32 },
  headerMeta: { flex: 1 },
  headerTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#FFFFFF' },
  headerSub: { fontFamily: fonts.bodyMedium, fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  webview: { flex: 1, backgroundColor: '#16103A' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: 8 },
  stateEmoji: { fontSize: 40, marginBottom: 4 },
  stateTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#FFFFFF', textAlign: 'center' },
  stateSub: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
  retryBtn: {
    marginTop: 16, backgroundColor: colors.coral, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14,
  },
  retryTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#FFFFFF' },
});
