# Identidade do PagManager

O símbolo original reúne linhas de lançamentos e uma confirmação de recebimento.
As formas largas e o contraste verde/branco mantêm a marca legível em tamanhos
pequenos. A palavra PagManager usa o token `text-ink`, acompanhando o tema da interface.

- Fonte editável: `apps/web/public/brand-mark.svg` (grade 64 × 64).
- Componente compartilhado: `apps/web/src/components/brand/brand-logo.tsx`.
- PNGs de instalação: 192 e 512 px; Apple Touch Icon: 180 px.
- Favicon ICO: imagens PNG de 16, 32 e 64 px no mesmo arquivo.

Os ícones raster são derivados do SVG, sem fontes ou recursos externos. Para
regenerá-los em Docker, execute a partir da raiz do projeto:

```sh
docker compose -p pagmanager-brand-assets -f compose.dev.yaml run --rm --no-deps --entrypoint /bin/sh tools -c 'mkdir -p /tmp/logo-render && cd /tmp/logo-render && npm install --no-save @resvg/resvg-js@2.6.2 && node /app/scripts/render-brand-icons.mjs'
```

O pacote de renderização é temporário no container e não altera o lockfile.
