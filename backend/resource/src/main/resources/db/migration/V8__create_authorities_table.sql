CREATE TABLE IF NOT EXISTS authorities (
  email VARCHAR(255) NOT NULL,
  authority VARCHAR(50) NOT NULL,
  CONSTRAINT fk_auth FOREIGN KEY(email) REFERENCES users(email),
  CONSTRAINT auth_unique UNIQUE (email, authority)
);