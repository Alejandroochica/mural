# Mural website

A static, dependency-free website. The checked-in `dist` directory is the source and the deployable site.

## Preview

From this directory, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open <http://localhost:4173>. The headline rotates through six languages. The pause control stops the headline and background; the page also respects reduced motion.

## Release

The current download page links to the iPhone build guide while TestFlight is pending. Once Apple approves external testing, replace that page’s primary button with the verified public TestFlight link.

Before deploying to `mural.chat`, replace the preview origin in the HTML canonical, Open Graph and X tags, `robots.txt`, and `sitemap.xml` with `https://mural.chat`. Serve `dist` as the document root, with directory index support. No application server or database is required for this website.

The privacy and terms pages describe the current app using the user’s own API key. Revise them before enabling hosted accounts, trials or purchases. Hackmamba’s registered entity and country must be confirmed before the commercial launch.

The Allura signature font is self-hosted under its bundled SIL Open Font License. The Open Graph artwork was generated for Mural. The app wordmark, orb and warm palette supply the visual direction.
