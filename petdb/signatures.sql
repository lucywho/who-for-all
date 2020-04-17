DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS signatures, users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
    id SERIAL primary key,
    signature TEXT NOT NULL,
    user_id INTEGER NOT NUll REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


  CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  age INT,
  city VARCHAR(100),
  url VARCHAR(300),
  user_id INT REFERENCES users(id) NOT NULL UNIQUE
  );