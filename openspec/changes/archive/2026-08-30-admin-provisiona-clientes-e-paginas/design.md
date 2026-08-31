## Contexto

Hoje `handle_new_user` cria o perfil no primeiro login e `events_insert` exige
`host_profile_id = auth.uid()`. Precisamos inverter: o perfil do cliente nasce
por ação do admin, e o evento é criado pelo admin com o anfitrião apontado.

## Decisões

### Perfil provisionado por e-mail, casado no primeiro login

Não dá para inserir em `auth.users` sem a pessoa existir no GoTrue. Duas opções:

1. **Convite do Supabase Auth** (`auth.admin.inviteUserByEmail`) — cria o usuário
   de auth já, dispara e-mail; `handle_new_user` cria o perfil. Admin só informa
   e-mail/nome (nome vai em `raw_user_meta_data.display_name`).
2. Tabela `client_invites (email, display_name, created_by, consumed_at)` e
   `handle_new_user` consulta por e-mail para herdar o nome e marcar consumido.

Escolha: **opção 1**, menos estado próprio. `admin_provision_client` é uma rota
server-only que usa o client `service-role` (`src/lib/supabase/admin.ts`) para
`inviteUserByEmail`. A listagem de clientes lê `profiles where role = 'cliente'`
com `last_sign_in_at` de `auth.users` (via view `security definer`) para a
situação "aguardando/ativa".

```sql
-- <ts>_admin_client_listing.sql
create view public.client_accounts
with (security_invoker = off) as
  select p.id, p.email, p.display_name, u.last_sign_in_at,
         (select count(*) from public.events e where e.host_profile_id = p.id) as event_count
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'cliente';

revoke all on public.client_accounts from anon, authenticated;
-- Leitura só via função security definer checando is_platform_admin().
create function public.list_client_accounts()
returns setof public.client_accounts
language sql stable security definer set search_path = '' as $$
  select * from public.client_accounts where public.is_platform_admin();
$$;
grant execute on function public.list_client_accounts() to authenticated;
```

### `events_insert` só admin

```sql
drop policy events_insert on public.events;
create policy events_insert on public.events
for insert to authenticated
with check (
  public.is_platform_admin()
  and exists (select 1 from public.profiles p
              where p.id = host_profile_id and p.role = 'cliente')
);
```

`events_update` / `can_manage_event` ficam como no change anterior — o cliente
anfitrião continua administrando o próprio evento.

### `/onboarding`

Vira tela informativa. `src/app/onboarding/OnboardingFlow.tsx` perde o formulário
de criação; `POST` de criação sai de `/api/eventos` para exigir admin.
`/painel` quando o cliente não tem evento: card "Sua página está sendo
preparada pela equipe".

### `requireSession`

Passa a recusar (403 com tela dedicada) quando `profile.role = 'cliente'` e o
cliente não é anfitrião de nenhum evento e não foi provisionado — evita que um
e-mail aleatório com link mágico veja um painel vazio.

## Variáveis de ambiente

Nenhuma nova. Usa `SUPABASE_SERVICE_ROLE_KEY` já existente, só em
`src/lib/supabase/admin.ts`.
