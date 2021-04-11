CREATE TABLE news (
  title text,
  summary text,
  printed boolean default false,
  added timestamp default (datetime('now'))
);
