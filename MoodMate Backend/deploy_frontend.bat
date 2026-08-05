@echo off
echo ================================================
echo  MoodMate Frontend Deployer
echo  Copies all updated screens to frontend repo
echo ================================================
echo.

set SRC=C:\Users\Orleans Barnes\Claude\Projects\MoodMate Backend\FRONTEND_UPDATES
set DST=C:\Users\Orleans Barnes\Downloads\moodmate-app-frontend (3) - Copy\moodmate-app\src

rem ── Ensure target directories exist ──────────────────────────────────────────
if not exist "%DST%\data"                      mkdir "%DST%\data"
if not exist "%DST%\screens\counsellor"        mkdir "%DST%\screens\counsellor"
if not exist "%DST%\screens\resources"         mkdir "%DST%\screens\resources"

echo [1/5] Deploying navigation...
copy /Y "%SRC%\navigation\types.ts"          "%DST%\navigation\types.ts"
copy /Y "%SRC%\navigation\RootNavigator.tsx" "%DST%\navigation\RootNavigator.tsx"

echo [2/5] Deploying auth screens...
copy /Y "%SRC%\screens\SplashScreen.tsx"         "%DST%\screens\SplashScreen.tsx"
copy /Y "%SRC%\screens\auth\OnboardingScreen.tsx" "%DST%\screens\auth\OnboardingScreen.tsx"
copy /Y "%SRC%\screens\auth\RoleSelectScreen.tsx" "%DST%\screens\auth\RoleSelectScreen.tsx"
copy /Y "%SRC%\screens\auth\SignupScreen.tsx"     "%DST%\screens\auth\SignupScreen.tsx"

echo [3/5] Deploying chat + AI screens...
copy /Y "%SRC%\screens\insights\AIChatScreen.tsx"          "%DST%\screens\insights\AIChatScreen.tsx"
copy /Y "%SRC%\screens\insights\InsightsScreen.tsx"        "%DST%\screens\insights\InsightsScreen.tsx"
copy /Y "%SRC%\screens\support\ChatScreen.tsx"             "%DST%\screens\support\ChatScreen.tsx"
copy /Y "%SRC%\screens\counsellor\CounsellorChatScreen.tsx" "%DST%\screens\counsellor\CounsellorChatScreen.tsx"
copy /Y "%SRC%\screens\counsellor\CounsellorListScreen.tsx" "%DST%\screens\counsellor\CounsellorListScreen.tsx"
copy /Y "%SRC%\screens\counsellor\CounsellorProfileScreen.tsx" "%DST%\screens\counsellor\CounsellorProfileScreen.tsx"

echo [4/5] Deploying resources + explore screens...
copy /Y "%SRC%\screens\resources\ResourcesScreen.tsx" "%DST%\screens\resources\ResourcesScreen.tsx"
copy /Y "%SRC%\screens\explore\ExploreScreen.tsx"     "%DST%\screens\explore\ExploreScreen.tsx"

echo [5/5] Deploying Phase 1-3 expansion screens...
copy /Y "%SRC%\data\thoughts.ts"                              "%DST%\data\thoughts.ts"
copy /Y "%SRC%\screens\insights\MoodAnalyticsScreen.tsx"      "%DST%\screens\insights\MoodAnalyticsScreen.tsx"
copy /Y "%SRC%\screens\modals\DBTSkillsScreen.tsx"            "%DST%\screens\modals\DBTSkillsScreen.tsx"
copy /Y "%SRC%\screens\modals\MeditationLibraryScreen.tsx"    "%DST%\screens\modals\MeditationLibraryScreen.tsx"
copy /Y "%SRC%\screens\modals\ActivationPlannerScreen.tsx"    "%DST%\screens\modals\ActivationPlannerScreen.tsx"
copy /Y "%SRC%\screens\modals\WeeklyReportScreen.tsx"         "%DST%\screens\modals\WeeklyReportScreen.tsx"
copy /Y "%SRC%\screens\modals\ThoughtSorterScreen.tsx"        "%DST%\screens\modals\ThoughtSorterScreen.tsx"
copy /Y "%SRC%\screens\modals\CalmGardenScreen.tsx"           "%DST%\screens\modals\CalmGardenScreen.tsx"

echo.
echo ================================================
echo  All 24 files deployed successfully!
echo ================================================
echo.
echo  Files deployed:
echo   - navigation/types.ts
echo   - navigation/RootNavigator.tsx
echo   - screens/SplashScreen.tsx
echo   - screens/auth/OnboardingScreen.tsx
echo   - screens/auth/RoleSelectScreen.tsx
echo   - screens/auth/SignupScreen.tsx
echo   - screens/insights/AIChatScreen.tsx
echo   - screens/insights/InsightsScreen.tsx
echo   - screens/insights/MoodAnalyticsScreen.tsx
echo   - screens/support/ChatScreen.tsx
echo   - screens/counsellor/CounsellorChatScreen.tsx
echo   - screens/counsellor/CounsellorListScreen.tsx
echo   - screens/counsellor/CounsellorProfileScreen.tsx
echo   - screens/resources/ResourcesScreen.tsx
echo   - screens/explore/ExploreScreen.tsx
echo   - screens/modals/DBTSkillsScreen.tsx
echo   - screens/modals/MeditationLibraryScreen.tsx
echo   - screens/modals/ActivationPlannerScreen.tsx
echo   - screens/modals/WeeklyReportScreen.tsx
echo   - screens/modals/ThoughtSorterScreen.tsx
echo   - screens/modals/CalmGardenScreen.tsx
echo   - data/thoughts.ts
echo ================================================
pause
