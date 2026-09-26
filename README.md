# Centauri Carbon Bed Mesh Visualizer

A static, client-side visualizer for ELEGOO Centauri Carbon and Centauri Carbon 2 bed meshes.

This fork adds direct support for the `autosave.cfg` file included in the printer diagnostic-log export. It keeps compatibility with the legacy `printer.cfg` profiles supported by the original project.

## Use

1. Run Automatic Leveling on the printer.
2. Export the printer diagnostic log to a USB drive.
3. Extract the exported ZIP archive using password `16881688` ([community reference](https://www.lesimprimantes3d.fr/forum/topic/64967-elegoo-centauri-carbon-2-combo-la-d%C3%A9couverte/#comment-663354), originally shared in the [ELEGOO Official Discord](https://discord.com/channels/969282195552346202/1370827161107431546/1483838533109289090)).
4. Open the extracted log folder and locate `opt/usr/cfg/autosave.cfg`.
5. Open the visualizer and choose or drag `autosave.cfg` onto the page.

The archive password is community-reported and may change in future firmware versions.

The page detects every valid `[bed_mesh <profile>]` section, including `default` and `ADAPTIVE`. Processing happens entirely in the browser; the configuration file is not uploaded.

## Local development

No build step is required. Serve the repository root with any static web server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Run the parser tests with:

```bash
npm test
```

## GitHub Pages

Push the repository to GitHub, then open **Settings → Pages** and select:

- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/ (root)`

The site needs no GitHub Actions workflow or server-side component.

## Attribution

Based on [`suchmememanyskill/bens-claude-cc-mesh-visualiser`](https://github.com/suchmememanyskill/bens-claude-cc-mesh-visualiser), distributed under the MIT License.
