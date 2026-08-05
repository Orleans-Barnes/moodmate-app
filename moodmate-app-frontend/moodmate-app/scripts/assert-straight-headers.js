const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const checks = [
  {
    file: 'src/components/HeroHeader.tsx',
    forbidden: [
      'outputRange: [36, 0]',
      'borderBottomLeftRadius: headerCornerRadius',
      'borderBottomRightRadius: headerCornerRadius',
    ],
  },
  {
    file: 'src/components/CurvedForestHeader.tsx',
    forbidden: [
      'borderBottomLeftRadius: 36',
      'borderBottomRightRadius: 36',
    ],
  },
  {
    file: 'src/screens/auth/RoleSelectScreen.tsx',
    forbidden: [
      'borderBottomLeftRadius: 36',
      'borderBottomRightRadius: 36',
    ],
  },
  {
    file: 'src/screens/support/CounsellorDetailScreen.tsx',
    forbidden: [
      'borderBottomLeftRadius: radii.headerCurve',
      'borderBottomRightRadius: radii.headerCurve',
    ],
  },
];

for (const check of checks) {
  const source = read(check.file);
  for (const token of check.forbidden) {
    if (source.includes(token)) {
      throw new Error(`${check.file} still contains curved header token: ${token}`);
    }
  }
}

console.log('Straight header edge checks passed.');
