// ─── MoodMate curated music tracks ──────────────────────────────────────────
// Replaces old ambient soundscapes with Quabble-style curated music.

export interface MusicTrack {
  id: string;
  name: string;
  emoji: string;
  genre: string;
  description: string;
  color: string;
  asset: number;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'moonlight',
    name: 'Moonlight',
    emoji: '🌙',
    genre: 'Sleep · Piano',
    description: 'Gentle piano arpeggios — great for winding down before sleep',
    color: '#818CF8',
    asset: require('../../assets/music/moonlight.mp3'),
  },
  {
    id: 'serenity',
    name: 'Serenity',
    emoji: '☁️',
    genre: 'Focus · Lo-fi',
    description: 'Soft lo-fi beats to keep you calm and focused',
    color: '#60A5FA',
    asset: require('../../assets/music/serenity.mp3'),
  },
  {
    id: 'binaural_calm',
    name: 'Binaural Calm',
    emoji: '🌊',
    genre: 'Calm · Theta 7Hz',
    description: 'Binaural beats at 7Hz theta — reduces anxiety, promotes calm',
    color: '#34D399',
    asset: require('../../assets/music/binaural_calm.mp3'),
  },
  {
    id: 'morning_bloom',
    name: 'Morning Bloom',
    emoji: '🌅',
    genre: 'Morning · Acoustic',
    description: 'Uplifting acoustic strings to start your day with intention',
    color: '#FBBF24',
    asset: require('../../assets/music/morning_bloom.mp3'),
  },
  {
    id: 'deep_space',
    name: 'Deep Space',
    emoji: '🔮',
    genre: 'Meditation · Drone',
    description: 'Ambient harmonic drone — perfect for deep meditation sessions',
    color: '#C084FC',
    asset: require('../../assets/music/deep_space.mp3'),
  },
  {
    id: 'lullaby',
    name: 'Lullaby',
    emoji: '🎀',
    genre: 'Sleep · Music Box',
    description: 'Gentle music-box melody on a pentatonic scale for restful sleep',
    color: '#F9A8D4',
    asset: require('../../assets/music/lullaby.mp3'),
  },
  {
    id: 'brown_noise',
    name: 'Brown Noise',
    emoji: '🟤',
    genre: 'Focus · Noise',
    description: 'Deep brown noise for studying, blocking distractions and ADHD focus',
    color: '#92400E',
    asset: require('../../assets/music/brown_noise.mp3'),
  },
  {
    id: 'adhd_focus',
    name: 'Focus 40Hz',
    emoji: '🧠',
    genre: 'ADHD · Gamma',
    description: '40 Hz gamma binaural beats — clinically studied for concentration and cognitive clarity',
    color: '#4F46E5',
    asset: require('../../assets/music/adhd_focus.mp3'),
  },
  {
    id: 'rain_focus',
    name: 'Rain Ambience',
    emoji: '🌧️',
    genre: 'Focus · Nature',
    description: 'Gentle rainfall with low rumble — perfect for calm focus sessions',
    color: '#0369A1',
    asset: require('../../assets/music/rain_focus.mp3'),
  },
  {
    id: 'white_noise',
    name: 'White Noise',
    emoji: '⬜',
    genre: 'Sleep · Noise',
    description: 'Pure white noise to mask background sounds and improve sleep quality',
    color: '#6B7280',
    asset: require('../../assets/music/white_noise.mp3'),
  },
];

export function getTrack(id: string): MusicTrack | undefined {
  return MUSIC_TRACKS.find((t) => t.id === id);
}
