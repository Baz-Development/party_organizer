-- Cor de destaque e fundo personalizados, além dos 4 temas prontos
-- (`theme_key`).
--
-- `accent_color`/`accent_text_color` sobrescrevem o preset de `theme_key`
-- quando presentes (a UI do editor limpa `theme_key` de volta a um preset
-- não muda estas colunas — quem decide qual vale é o app: presente = cor
-- personalizada). `background_color` sobrescreve só o fundo da tela, atrás
-- do cartão de conteúdo, e vale independente de haver cor de destaque
-- personalizada.
--
-- Hex `#rrggbb` — o formato que `<input type="color">` produz — validado
-- por check constraint, como os demais campos de texto controlado da tabela.

alter table public.events
  add column accent_color      text,
  add column accent_text_color text,
  add column background_color  text,
  add constraint events_accent_color_format
    check (accent_color is null or accent_color ~ '^#[0-9a-fA-F]{6}$'),
  add constraint events_accent_text_color_format
    check (accent_text_color is null or accent_text_color ~ '^#[0-9a-fA-F]{6}$'),
  add constraint events_background_color_format
    check (background_color is null or background_color ~ '^#[0-9a-fA-F]{6}$');
