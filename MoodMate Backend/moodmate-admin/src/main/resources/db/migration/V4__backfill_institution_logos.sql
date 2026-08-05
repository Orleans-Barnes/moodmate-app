-- Backfill institution websites and logo URLs for the live catalogue. The frontend already knows
-- how to render logo_url when present; this keeps the backend/public institution API from
-- replacing the bundled logo-enabled fallback with logo-less rows.
--
-- These URLs use each institution's official domain through Google's favicon endpoint. It gives
-- MoodMate a stable remote image source while preserving the initials fallback if a logo cannot be
-- fetched on-device.

UPDATE institutions SET
    website = 'https://www.knust.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=knust.edu.gh&sz=128'
WHERE LOWER(short_name) = 'knust';

UPDATE institutions SET
    website = 'https://www.ug.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=ug.edu.gh&sz=128'
WHERE LOWER(short_name) = 'ug';

UPDATE institutions SET
    website = 'https://www.ucc.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=ucc.edu.gh&sz=128'
WHERE LOWER(short_name) = 'ucc';

UPDATE institutions SET
    website = 'https://www.uds.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=uds.edu.gh&sz=128'
WHERE LOWER(short_name) = 'uds';

UPDATE institutions SET
    website = 'https://www.ashesi.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=ashesi.edu.gh&sz=128'
WHERE LOWER(short_name) = 'ashesi';

UPDATE institutions SET
    website = 'https://www.uenr.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=uenr.edu.gh&sz=128'
WHERE LOWER(short_name) = 'uenr';

UPDATE institutions SET
    website = 'https://www.uhas.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=uhas.edu.gh&sz=128'
WHERE LOWER(short_name) = 'uhas';

UPDATE institutions SET
    website = 'https://www.gctu.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=gctu.edu.gh&sz=128'
WHERE LOWER(short_name) = 'gctu';

UPDATE institutions SET
    website = 'https://acity.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=acity.edu.gh&sz=128'
WHERE LOWER(short_name) = 'acu';

UPDATE institutions SET
    website = 'https://central.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=central.edu.gh&sz=128'
WHERE LOWER(short_name) = 'central';

UPDATE institutions SET
    website = 'https://wiuc-ghana.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=wiuc-ghana.edu.gh&sz=128'
WHERE LOWER(short_name) = 'wiuc';

UPDATE institutions SET
    website = 'https://mug.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=mug.edu.gh&sz=128'
WHERE LOWER(short_name) = 'mug';

UPDATE institutions SET
    website = 'https://regent.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=regent.edu.gh&sz=128'
WHERE LOWER(short_name) = 'regent';

UPDATE institutions SET
    website = 'https://www.vvu.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=vvu.edu.gh&sz=128'
WHERE LOWER(short_name) = 'vvu';

UPDATE institutions SET
    website = 'https://cuc.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=cuc.edu.gh&sz=128'
WHERE LOWER(short_name) = 'cucg';

UPDATE institutions SET
    website = 'https://www.uew.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=uew.edu.gh&sz=128'
WHERE LOWER(short_name) = 'uew';

UPDATE institutions SET
    website = 'https://www.gimpa.edu.gh',
    logo_url = 'https://www.google.com/s2/favicons?domain=gimpa.edu.gh&sz=128'
WHERE LOWER(short_name) = 'gimpa';
