alter table app_user add column if not exists document varchar(32);
alter table app_user add column if not exists phone varchar(32);
alter table app_user add column if not exists address varchar(220);
alter table app_user add column if not exists plan varchar(80);
