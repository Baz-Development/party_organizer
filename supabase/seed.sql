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
delete from public.organizations where id in (
  'fe9eeecc-7ad0-5a16-bc7f-1c41113c3bc7'::uuid,
  'e1a87020-cbcf-5622-9e73-21d87ebbe09c'::uuid,
  '546dcc3b-a388-50af-9f95-767ca6ed46b1'::uuid,
  '9938be27-1b65-593d-922f-34fea27895f5'::uuid
);
delete from auth.users where id in (
  '09f235d8-b241-5023-a494-b841bd14ffac'::uuid,
  '1fadecd9-b3fd-5317-8952-e9685d450b9c'::uuid,
  'f21b1b63-1223-50ed-9253-471d6853fe3e'::uuid,
  'e7ac7f73-a91f-5d39-838c-b7111341b578'::uuid,
  'b0b04bb0-1a54-5def-a7b1-8477ae22bb5b'::uuid,
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
    '1fadecd9-b3fd-5317-8952-e9685d450b9c'::uuid, 'authenticated', 'authenticated', 'contato@santaclara.com.br', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Equipe Fazenda Santa Clara"}'::jsonb,
    now(), now()
  ),
  (
    'f21b1b63-1223-50ed-9253-471d6853fe3e'::uuid, 'authenticated', 'authenticated', 'eventos@mundomagico.com.br', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Equipe Buffet Mundo Mágico"}'::jsonb,
    now(), now()
  ),
  (
    'e7ac7f73-a91f-5d39-838c-b7111341b578'::uuid, 'authenticated', 'authenticated', 'corp@nexus.com', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Equipe Nexus Eventos Corporativos"}'::jsonb,
    now(), now()
  ),
  (
    'b0b04bb0-1a54-5def-a7b1-8477ae22bb5b'::uuid, 'authenticated', 'authenticated', 'villa@nova.com.br', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Equipe Espaço Villa Nova"}'::jsonb,
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
-- por seed ou operação administrativa, ambas sem sessão.
insert into public.profiles (id, email, display_name, role)
values
  ('09f235d8-b241-5023-a494-b841bd14ffac'::uuid, 'admin@exemplo.local', 'Admin da plataforma', 'admin'::public.user_role),
  ('1fadecd9-b3fd-5317-8952-e9685d450b9c'::uuid, 'contato@santaclara.com.br', 'Equipe Fazenda Santa Clara', 'organizacao'::public.user_role),
  ('f21b1b63-1223-50ed-9253-471d6853fe3e'::uuid, 'eventos@mundomagico.com.br', 'Equipe Buffet Mundo Mágico', 'organizacao'::public.user_role),
  ('e7ac7f73-a91f-5d39-838c-b7111341b578'::uuid, 'corp@nexus.com', 'Equipe Nexus Eventos Corporativos', 'organizacao'::public.user_role),
  ('b0b04bb0-1a54-5def-a7b1-8477ae22bb5b'::uuid, 'villa@nova.com.br', 'Equipe Espaço Villa Nova', 'organizacao'::public.user_role),
  ('98b63843-de06-51ec-823b-44e372c12b6b'::uuid, 'marina-e-thiago@exemplo.local', 'Marina & Thiago', 'cliente'::public.user_role),
  ('07d8aca2-db49-5bfc-86d2-bf53a6a4aed9'::uuid, '15-anos-sofia@exemplo.local', 'Sofia Andrade', 'cliente'::public.user_role),
  ('d7ce8523-6863-50c2-910c-6d28b03a6b27'::uuid, 'aniversario-do-bento@exemplo.local', 'Família Ribeiro', 'cliente'::public.user_role),
  ('7043ae5b-163a-5f7e-9de9-7875ba9107eb'::uuid, 'convencao-nexus-2026@exemplo.local', 'Nexus Tecnologia', 'cliente'::public.user_role)
on conflict (id) do update
  set display_name = excluded.display_name,
      role = excluded.role;

-- ---------------------------------------------------------------------------
-- Organizações parceiras
-- ---------------------------------------------------------------------------

insert into public.organizations (id, name, city, plan, contact, since)
values
  ('fe9eeecc-7ad0-5a16-bc7f-1c41113c3bc7'::uuid, 'Fazenda Santa Clara', 'Itu – SP', 'premium'::public.org_plan, 'contato@santaclara.com.br', '2024-03-12'::date),
  ('e1a87020-cbcf-5622-9e73-21d87ebbe09c'::uuid, 'Buffet Mundo Mágico', 'São Paulo – SP', 'parceiro'::public.org_plan, 'eventos@mundomagico.com.br', '2023-08-01'::date),
  ('546dcc3b-a388-50af-9f95-767ca6ed46b1'::uuid, 'Nexus Eventos Corporativos', 'São Paulo – SP', 'enterprise'::public.org_plan, 'corp@nexus.com', '2025-01-20'::date),
  ('9938be27-1b65-593d-922f-34fea27895f5'::uuid, 'Espaço Villa Nova', 'Campinas – SP', 'parceiro'::public.org_plan, 'villa@nova.com.br', '2024-11-05'::date);

insert into public.organization_members (organization_id, profile_id, role)
values
  ('fe9eeecc-7ad0-5a16-bc7f-1c41113c3bc7'::uuid, '1fadecd9-b3fd-5317-8952-e9685d450b9c'::uuid, 'proprietario'::public.org_member_role),
  ('e1a87020-cbcf-5622-9e73-21d87ebbe09c'::uuid, 'f21b1b63-1223-50ed-9253-471d6853fe3e'::uuid, 'proprietario'::public.org_member_role),
  ('546dcc3b-a388-50af-9f95-767ca6ed46b1'::uuid, 'e7ac7f73-a91f-5d39-838c-b7111341b578'::uuid, 'proprietario'::public.org_member_role),
  ('9938be27-1b65-593d-922f-34fea27895f5'::uuid, 'b0b04bb0-1a54-5def-a7b1-8477ae22bb5b'::uuid, 'proprietario'::public.org_member_role);

-- ---------------------------------------------------------------------------
-- Eventos
--
-- Os quatro saem publicados, para que as telas do convidado fiquem navegáveis
-- logo depois do reset. (O mock trazia "aniversario-do-bento" em rascunho.)
-- ---------------------------------------------------------------------------

insert into public.events (
  id, slug, organization_id, host_profile_id, kind, title, event_at,
  venue, city, hosts, eyebrow, welcome, theme_key, status
)
values
  (
    '2fc14e5f-77df-5928-a780-4a78b8bf3262'::uuid, 'marina-e-thiago', 'fe9eeecc-7ad0-5a16-bc7f-1c41113c3bc7'::uuid,
    '98b63843-de06-51ec-823b-44e372c12b6b'::uuid,
    'casamento'::public.event_kind, 'Marina & Thiago',
    '2026-12-12T16:00:00-03:00'::timestamptz,
    'Fazenda Santa Clara', 'Itu – SP', 'Marina & Thiago',
    'Estamos casando', 'Com o coração transbordando, convidamos você para celebrar conosco o início de uma nova jornada. Sua presença é o presente que mais desejamos.',
    'terracota'::public.theme_key, 'publicado'::public.event_status
  ),
  (
    '5c0389b7-8a5e-595c-970f-f245955c270c'::uuid, '15-anos-sofia', 'fe9eeecc-7ad0-5a16-bc7f-1c41113c3bc7'::uuid,
    '07d8aca2-db49-5bfc-86d2-bf53a6a4aed9'::uuid,
    'debutante'::public.event_kind, '15 Anos da Sofia',
    '2026-09-05T20:00:00-03:00'::timestamptz,
    'Espaço Villa Nova', 'Campinas – SP', 'Sofia Andrade',
    'Meus 15 anos', 'Chegou a hora de celebrar! Venha comigo viver uma noite inesquecível cheia de música, dança e muito brilho.',
    'dourado'::public.theme_key, 'publicado'::public.event_status
  ),
  (
    '2d7e36ed-890c-5aeb-8d2f-854c34721dac'::uuid, 'aniversario-do-bento', 'e1a87020-cbcf-5622-9e73-21d87ebbe09c'::uuid,
    'd7ce8523-6863-50c2-910c-6d28b03a6b27'::uuid,
    'infantil'::public.event_kind, 'Bento faz 5 anos',
    '2026-08-22T15:00:00-03:00'::timestamptz,
    'Buffet Mundo Mágico', 'São Paulo – SP', 'Família Ribeiro',
    'Festa do Bento', 'O Bento está fazendo 5 aninhos e quer muito comemorar com você! Vai ter bolo, brincadeira e bagunça boa.',
    'oliva'::public.theme_key, 'publicado'::public.event_status
  ),
  (
    '62c92377-6935-54e8-b597-1c9f4f9bbc16'::uuid, 'convencao-nexus-2026', '546dcc3b-a388-50af-9f95-767ca6ed46b1'::uuid,
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
