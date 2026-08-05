-- Wellness Library - Books. A real, purchasable book catalogue alongside the (already-fixed)
-- article links in ResourcesScreen.tsx. Same shape as leaf_packs/user_owned_skins - see
-- entity.Book / entity.UserOwnedBook doc comments for why. Prices in GHS pesewas (subunit),
-- matching every other Paystack-priced table in this service.

CREATE TABLE books (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(30) NOT NULL UNIQUE,
    title           VARCHAR(150) NOT NULL,
    author          VARCHAR(100) NOT NULL,
    description     VARCHAR(500) NOT NULL,
    price_pesewas   INT NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0
);

-- Which books a user already owns, so re-visiting the Wellness Library never charges twice for
-- the same title. Mirrors user_owned_skins exactly (composite key, no surrogate id).
CREATE TABLE user_owned_books (
    user_id     BIGINT NOT NULL,
    book_id     BIGINT NOT NULL REFERENCES books(id),
    acquired_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, book_id)
);

INSERT INTO books (code, title, author, description, price_pesewas, sort_order) VALUES
    ('BOOK_ATOMIC_HABITS', 'Atomic Habits', 'James Clear',
        'A practical guide to building good habits and breaking bad ones, one small change at a time.',
        5500, 0),
    ('BOOK_ANXIETY_WORKBK', 'The Anxiety and Phobia Workbook', 'Edmund J. Bourne',
        'Step-by-step exercises and CBT techniques for managing anxiety, panic, and phobias.',
        6000, 1),
    ('BOOK_FEELING_GOOD', 'Feeling Good: The New Mood Therapy', 'David D. Burns',
        'A classic, research-backed introduction to cognitive behavioral therapy for depression.',
        5000, 2),
    ('BOOK_BODY_SCORE', 'The Body Keeps the Score', 'Bessel van der Kolk',
        'How trauma reshapes the body and mind, and the paths available for real recovery.',
        6000, 3),
    ('BOOK_WHY_WE_SLEEP', 'Why We Sleep', 'Matthew Walker',
        'The science of sleep and dreams, and why protecting your sleep matters for mind and body.',
        5500, 4),
    ('BOOK_GIFTS_IMPERFECT', 'The Gifts of Imperfection', 'Brene Brown',
        'Letting go of who you think you should be and embracing who you are.',
        4500, 5);
