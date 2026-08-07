# Validation report

Generated: 2026-08-06

## Package checks

- Required root files exist.
- Required `assets/` files exist.
- Required `speed-lab/` pages exist.
- Every HTML page has a title, viewport metadata, and a main landmark.
- Every local stylesheet, image, and internal link resolves to an included file.
- Every support email link uses `mailto:perschinolabs@gmail.com`.
- No HTML page contains JavaScript.
- No HTML page loads remote JavaScript, remote CSS, analytics, or tracking code.
- No page contains TODO, `undefined`, or visible `null` placeholders.

## Render checks

The pages were rendered with Chromium from their final HTML and CSS content at desktop and mobile viewport sizes.

- Homepage rendered without console errors.
- Product page rendered without console errors.
- Privacy page rendered without console errors.
- Support page rendered without console errors.
- 404 page rendered without console errors.
- No tested page had horizontal overflow at 1280×800.
- No tested page had horizontal overflow at 375×812.
- The support FAQ `<details>` control opened through a normal click.
- Each tested page contained one main landmark and a skip link.

## Final live check

After GitHub Pages publishes the repository, open these URLs in an incognito window:

```text
https://GarrettPerschino.github.io/
https://GarrettPerschino.github.io/speed-lab/
https://GarrettPerschino.github.io/speed-lab/privacy.html
https://GarrettPerschino.github.io/speed-lab/support.html
```

The local package is complete. The only remaining validation is GitHub's live deployment.
