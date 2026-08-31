-- Provisiona a conta de admin da plataforma para o e-mail real de quem toca o
-- projeto. Vale em qualquer ambiente (local, staging, produção) — diferente do
-- `admin@exemplo.local`, que só existe no seed de desenvolvimento.
--
-- A linha em `auth.users` é criada como a API admin do GoTrue faria: com
-- `instance_id`, colunas de token vazias (não NULL) e uma identidade
-- `provider = 'email'`. Sem isso o login por link mágico responde 500.
--
-- Idempotente: se a conta já existir (por e-mail), nada é recriado; apenas o
-- papel é garantido como `admin`.

do $$
declare
  v_email text := 'fbazmitsuishi@gmail.com';
  v_id    uuid := 'b29da8db-92bf-5d27-85f2-1ff337a83327';
begin
  select id into v_id from auth.users where email = v_email;

  if v_id is null then
    v_id := 'b29da8db-92bf-5d27-85f2-1ff337a83327';

    insert into auth.users (
      id, instance_id, aud, role, email, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token
    )
    values (
      v_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', v_email, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Felipe Baz"}'::jsonb,
      now(), now(),
      '', '', '', '', '', '', '', ''
    );

    -- O trigger on_auth_user_created já inseriu o perfil (como 'cliente').

    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    )
    values (
      v_id::text, v_id,
      jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    )
    on conflict do nothing;
  end if;

  -- auth.uid() é nulo numa migration, então prevent_role_escalation deixa passar.
  update public.profiles set role = 'admin' where id = v_id and role <> 'admin';
end $$;
