-- Gerado por `npm run db:seed` a partir de src/lib/mock-data.ts.
-- Não edite à mão: rode o script de novo depois de mudar os mocks.
--
-- Dados de desenvolvimento. Todos os e-mails são de um domínio inexistente
-- (exemplo.local) e nenhuma senha é definida: entre pelo link mágico,
-- lendo a caixa de e-mail local.
--
-- Entre como admin@exemplo.local para ver o painel administrativo.

begin;

-- Rodar o seed duas vezes não pode duplicar nada. A ordem importa: eventos
-- antes de perfis, porque events.host_profile_id não tem cascade.
delete from public.events where id in (
  '2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid,
  '5c0389b7-8a5e-595c-970f-f245955c270c'::uuid,
  '2d7e36ed-890c-5aeb-8d2f-854c34721dac'::uuid,
  '62c92377-6935-54e8-b597-1c9f4f9bbc16'::uuid
);
delete from auth.users where id in (
  '09f235d8-b241-5023-a494-b841bd14ffac'::uuid,
  '98b63843-de06-51ec-823b-44e372c12b6b'::uuid,
  '07d8aca2-db49-5bfc-86d2-bf53a6a4aed9'::uuid,
  'd7ce8523-6863-50c2-910c-6d28b03a6b27'::uuid,
  '7043ae5b-163a-5f7e-9de9-7875ba9107eb'::uuid
);

-- ---------------------------------------------------------------------------
-- Identidades
-- ---------------------------------------------------------------------------

insert into auth.users (
  id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '09f235d8-b241-5023-a494-b841bd14ffac'::uuid, 'authenticated', 'authenticated', 'admin@exemplo.local', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Admin da plataforma"}'::jsonb,
    now(), now()
  ),
  (
    '98b63843-de06-51ec-823b-44e372c12b6b'::uuid, 'authenticated', 'authenticated', 'marina-e-thiago@exemplo.local', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Marina & Thiago"}'::jsonb,
    now(), now()
  ),
  (
    '07d8aca2-db49-5bfc-86d2-bf53a6a4aed9'::uuid, 'authenticated', 'authenticated', '15-anos-sofia@exemplo.local', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Sofia Andrade"}'::jsonb,
    now(), now()
  ),
  (
    'd7ce8523-6863-50c2-910c-6d28b03a6b27'::uuid, 'authenticated', 'authenticated', 'aniversario-do-bento@exemplo.local', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Família Ribeiro"}'::jsonb,
    now(), now()
  ),
  (
    '7043ae5b-163a-5f7e-9de9-7875ba9107eb'::uuid, 'authenticated', 'authenticated', 'convencao-nexus-2026@exemplo.local', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Nexus Tecnologia"}'::jsonb,
    now(), now()
  );

-- O trigger on_auth_user_created já criou os perfis; aqui definimos nome de
-- exibição e papel. O papel de admin nunca é atribuível pela aplicação — só
-- por seed ou operação administrativa, ambas sem sessão. As contas de cliente
-- entram como provisionadas pelo admin, refletindo o fluxo da ata (a Equipe
-- Villa Glam cadastra o cliente antes do primeiro acesso).
insert into public.profiles (id, email, display_name, role, provisioned)
values
  ('09f235d8-b241-5023-a494-b841bd14ffac'::uuid, 'admin@exemplo.local', 'Admin da plataforma', 'admin'::public.user_role, false),
  ('98b63843-de06-51ec-823b-44e372c12b6b'::uuid, 'marina-e-thiago@exemplo.local', 'Marina & Thiago', 'cliente'::public.user_role, true),
  ('07d8aca2-db49-5bfc-86d2-bf53a6a4aed9'::uuid, '15-anos-sofia@exemplo.local', 'Sofia Andrade', 'cliente'::public.user_role, true),
  ('d7ce8523-6863-50c2-910c-6d28b03a6b27'::uuid, 'aniversario-do-bento@exemplo.local', 'Família Ribeiro', 'cliente'::public.user_role, true),
  ('7043ae5b-163a-5f7e-9de9-7875ba9107eb'::uuid, 'convencao-nexus-2026@exemplo.local', 'Nexus Tecnologia', 'cliente'::public.user_role, true)
on conflict (id) do update
  set display_name = excluded.display_name,
      role = excluded.role,
      provisioned = excluded.provisioned;

-- ---------------------------------------------------------------------------
-- Eventos
--
-- Os quatro saem publicados, para que as telas do convidado fiquem navegáveis
-- logo depois do reset. (O mock trazia "aniversario-do-bento" em rascunho.)
-- ---------------------------------------------------------------------------

insert into public.events (
  id, slug, host_profile_id, kind, title, event_at,
  venue, city, hosts, eyebrow, welcome, theme_key, status
)
values
  (
    '2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 'marina-e-thiago',
    '98b63843-de06-51ec-823b-44e372c12b6b'::uuid,
    'casamento'::public.event_kind, 'Marina & Thiago',
    '2026-12-12T16:00:00-03:00'::timestamptz,
    'Fazenda Santa Clara', 'Itu – SP', 'Marina & Thiago',
    'Estamos casando', 'Com o coração transbordando, convidamos você para celebrar conosco o início de uma nova jornada. Sua presença é o presente que mais desejamos.',
    'terracota'::public.theme_key, 'publicado'::public.event_status
  ),
  (
    '5c0389b7-8a5e-595c-970f-f245955c270c'::uuid, '15-anos-sofia',
    '07d8aca2-db49-5bfc-86d2-bf53a6a4aed9'::uuid,
    'debutante'::public.event_kind, '15 Anos da Sofia',
    '2026-09-05T20:00:00-03:00'::timestamptz,
    'Espaço Villa Nova', 'Campinas – SP', 'Sofia Andrade',
    'Meus 15 anos', 'Chegou a hora de celebrar! Venha comigo viver uma noite inesquecível cheia de música, dança e muito brilho.',
    'dourado'::public.theme_key, 'publicado'::public.event_status
  ),
  (
    '2d7e36ed-890c-5aeb-8d2f-854c34721dac'::uuid, 'aniversario-do-bento',
    'd7ce8523-6863-50c2-910c-6d28b03a6b27'::uuid,
    'aniversario'::public.event_kind, 'Bento faz 5 anos',
    '2026-08-22T15:00:00-03:00'::timestamptz,
    'Buffet Mundo Mágico', 'São Paulo – SP', 'Família Ribeiro',
    'Festa do Bento', 'O Bento está fazendo 5 aninhos e quer muito comemorar com você! Vai ter bolo, brincadeira e bagunça boa.',
    'oliva'::public.theme_key, 'publicado'::public.event_status
  ),
  (
    '62c92377-6935-54e8-b597-1c9f4f9bbc16'::uuid, 'convencao-nexus-2026',
    '7043ae5b-163a-5f7e-9de9-7875ba9107eb'::uuid,
    'corporativo'::public.event_kind, 'Convenção Nexus 2026',
    '2026-10-14T09:00:00-03:00'::timestamptz,
    'Centro de Convenções Anhembi', 'São Paulo – SP', 'Nexus Tecnologia',
    'Encontro anual', 'Um dia inteiro de conteúdo, networking e celebração dos resultados do ano. Confirme sua presença e garanta seu crachá.',
    'marinho'::public.theme_key, 'publicado'::public.event_status
  );

insert into public.event_modules (event_id, module)
values
  ('2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 'rsvp'::public.module_id),
  ('2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 'cronograma'::public.module_id),
  ('2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 'local'::public.module_id),
  ('2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 'presentes'::public.module_id),
  ('2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 'galeria'::public.module_id),
  ('2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 'mural'::public.module_id),
  ('2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 'cardapio'::public.module_id),
  ('2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 'amigo-secreto'::public.module_id),
  ('5c0389b7-8a5e-595c-970f-f245955c270c'::uuid, 'rsvp'::public.module_id),
  ('5c0389b7-8a5e-595c-970f-f245955c270c'::uuid, 'cronograma'::public.module_id),
  ('5c0389b7-8a5e-595c-970f-f245955c270c'::uuid, 'local'::public.module_id),
  ('5c0389b7-8a5e-595c-970f-f245955c270c'::uuid, 'galeria'::public.module_id),
  ('5c0389b7-8a5e-595c-970f-f245955c270c'::uuid, 'mural'::public.module_id),
  ('5c0389b7-8a5e-595c-970f-f245955c270c'::uuid, 'cardapio'::public.module_id),
  ('2d7e36ed-890c-5aeb-8d2f-854c34721dac'::uuid, 'rsvp'::public.module_id),
  ('2d7e36ed-890c-5aeb-8d2f-854c34721dac'::uuid, 'cronograma'::public.module_id),
  ('2d7e36ed-890c-5aeb-8d2f-854c34721dac'::uuid, 'local'::public.module_id),
  ('2d7e36ed-890c-5aeb-8d2f-854c34721dac'::uuid, 'presentes'::public.module_id),
  ('2d7e36ed-890c-5aeb-8d2f-854c34721dac'::uuid, 'galeria'::public.module_id),
  ('62c92377-6935-54e8-b597-1c9f4f9bbc16'::uuid, 'rsvp'::public.module_id),
  ('62c92377-6935-54e8-b597-1c9f4f9bbc16'::uuid, 'cronograma'::public.module_id),
  ('62c92377-6935-54e8-b597-1c9f4f9bbc16'::uuid, 'local'::public.module_id),
  ('62c92377-6935-54e8-b597-1c9f4f9bbc16'::uuid, 'galeria'::public.module_id);

insert into public.schedule_items (event_id, position, time, title, description)
values
  ('2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 0, '16h00', 'Cerimônia', 'Capela Santa Clara'),
  ('2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 1, '17h30', 'Recepção', 'Jardim principal — coquetel'),
  ('2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 2, '19h00', 'Jantar', 'Salão principal'),
  ('2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 3, '21h00', 'Festa', 'Pista de dança até 02h'),
  ('5c0389b7-8a5e-595c-970f-f245955c270c'::uuid, 0, '20h00', 'Recepção', 'Coquetel de boas-vindas'),
  ('5c0389b7-8a5e-595c-970f-f245955c270c'::uuid, 1, '21h00', 'Valsa', 'Entrada da debutante'),
  ('5c0389b7-8a5e-595c-970f-f245955c270c'::uuid, 2, '22h00', 'Jantar', 'Buffet completo'),
  ('5c0389b7-8a5e-595c-970f-f245955c270c'::uuid, 3, '23h30', 'Balada', 'DJ até 03h'),
  ('2d7e36ed-890c-5aeb-8d2f-854c34721dac'::uuid, 0, '15h00', 'Abertura', 'Recepção e brinquedos'),
  ('2d7e36ed-890c-5aeb-8d2f-854c34721dac'::uuid, 1, '16h00', 'Show', 'Contação de histórias'),
  ('2d7e36ed-890c-5aeb-8d2f-854c34721dac'::uuid, 2, '17h00', 'Parabéns', 'Bolo e docinhos'),
  ('2d7e36ed-890c-5aeb-8d2f-854c34721dac'::uuid, 3, '18h30', 'Encerramento', 'Entrega das lembrancinhas'),
  ('62c92377-6935-54e8-b597-1c9f4f9bbc16'::uuid, 0, '09h00', 'Credenciamento', 'Café de boas-vindas'),
  ('62c92377-6935-54e8-b597-1c9f4f9bbc16'::uuid, 1, '10h00', 'Keynote', 'Abertura com a diretoria'),
  ('62c92377-6935-54e8-b597-1c9f4f9bbc16'::uuid, 2, '12h30', 'Almoço', 'Área externa'),
  ('62c92377-6935-54e8-b597-1c9f4f9bbc16'::uuid, 3, '14h00', 'Painéis', 'Três trilhas simultâneas');

commit;
