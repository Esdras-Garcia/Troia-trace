create table app_user (
    id uuid primary key,
    name varchar(120) not null,
    email varchar(180) not null unique,
    created_at timestamp with time zone not null default now()
);
