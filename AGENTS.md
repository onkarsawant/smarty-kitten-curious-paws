<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Docker builds (`Dockerfile`) must set `NITRO_PRESET=node-server` before `bun run build` and run `.output/server/index.mjs` — the default build targets Cloudflare Workers, which cannot run in a plain Node container.

