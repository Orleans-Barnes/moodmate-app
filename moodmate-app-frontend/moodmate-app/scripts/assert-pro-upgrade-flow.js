const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const helperPath = 'src/utils/openProUpgrade.ts';
if (!fs.existsSync(path.join(root, helperPath))) {
  throw new Error(`${helperPath} is missing. Pro feature taps need one shared upgrade route.`);
}

const helper = read(helperPath);
if (!/export function openProUpgrade/.test(helper) || !/navigate\(['"]Pro['"]\)/.test(helper)) {
  throw new Error('openProUpgrade must export a helper that navigates to the Pro payment screen.');
}

const requiredScreens = [
  'src/screens/home/HomeScreen.tsx',
  'src/screens/explore/ExploreScreen.tsx',
  'src/screens/insights/InsightsScreen.tsx',
  'src/screens/modals/BubblePopScreen.tsx',
  'src/screens/modals/ProfileScreen.tsx',
  'src/screens/modals/ShopScreen.tsx',
  'src/screens/stories/StoryPacksScreen.tsx',
];

for (const screen of requiredScreens) {
  const source = read(screen);
  if (!source.includes("openProUpgrade")) {
    throw new Error(`${screen} must use openProUpgrade for Pro-only taps.`);
  }
  if (/navigate\(['"]Pro['"]/.test(source)) {
    throw new Error(`${screen} still directly navigates to Pro instead of using openProUpgrade.`);
  }
}

const proScreen = read('src/screens/modals/ProScreen.tsx');
if (!/startCheckout/.test(proScreen) || !/Linking\.openURL/.test(proScreen)) {
  throw new Error('ProScreen must keep opening the hosted checkout URL.');
}

console.log('Pro upgrade flow is centralized and connected to checkout.');
