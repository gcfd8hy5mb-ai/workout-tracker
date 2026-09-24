# Workout Tracker

A mobile-friendly, installable workout tracker that stores workout logs and progress in the browser.

## GitHub Pages

The site uses relative URLs, so it works from a GitHub Pages project path. The included Pages workflow deploys the repository as a static site whenever changes are pushed to `main`, and it can also be started manually from the Actions tab.

In the repository's **Settings → Pages**, select **GitHub Actions** as the source. No build step or secrets are required.

## Run locally

Service workers require an HTTP origin, so serve the repository instead of opening `index.html` directly:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Test

```sh
python3 -m unittest discover -s tests
```
