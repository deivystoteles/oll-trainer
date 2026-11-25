create table perfil (
  usuario_id   uuid primary key references auth.users(id) on delete cascade,
  color_arriba text not null default 'yellow'
    check (color_arriba in ('white','yellow','green','blue','red','orange'))
);

create table progreso_caso (
  usuario_id  uuid     not null references auth.users(id) on delete cascade,
  oll_num     smallint not null check (oll_num between 1 and 57),
  peso        smallint not null default 4 check (peso between 1 and 16),
  actualizado timestamptz not null default now(),
  primary key (usuario_id, oll_num)
);

alter table perfil         enable row level security;
alter table progreso_caso  enable row level security;

create policy "mi perfil" on perfil
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create policy "mi progreso" on progreso_caso
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);