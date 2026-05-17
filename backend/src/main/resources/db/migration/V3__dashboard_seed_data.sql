create table if not exists dashboard_seed_data (
    category varchar(80) not null,
    item_key varchar(120) not null,
    sort_order integer not null,
    payload text not null,
    primary key (category, item_key)
);
