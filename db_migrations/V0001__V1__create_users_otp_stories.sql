CREATE TABLE t_p9035596_messenger_altair_pro.users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT 'Пользователь',
  username VARCHAR(50) UNIQUE,
  status TEXT DEFAULT 'Привет! Я использую ALTAIR 👋',
  avatar_url TEXT,
  session_token VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p9035596_messenger_altair_pro.otp_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(8) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '10 minutes',
  used BOOLEAN DEFAULT FALSE
);

CREATE TABLE t_p9035596_messenger_altair_pro.stories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES t_p9035596_messenger_altair_pro.users(id),
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours'
);
