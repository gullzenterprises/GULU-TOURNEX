# GULU TOURNEX

Project workspace for the GULU TOURNEX website.

## Frontend structure

~~~text
frontend/
├── index.html
├── pages/
│   ├── account/
│   ├── legal/
│   ├── more/
│   └── tournament and platform pages
├── styles/
│   ├── style.css
│   └── pages/
│       └── one scoped stylesheet per page or page family
├── scripts/
│   ├── script.js
│   ├── auth.js
│   └── auth-config.js
└── tools/
    └── dev-server.mjs
~~~

styles/style.css contains the shared design system and site chrome. The homepage has its own styles/pages/home.css; other pages load their own scoped stylesheet. Browser scripts and the local preview server are kept away from page markup.

The earlier self-contained prototype is preserved at archive/legacy-demo.html. The active website starts at frontend/index.html.

## Authentication

The email/password, Google and Facebook auth flow is powered by Supabase. Follow [docs/auth-setup.md](docs/auth-setup.md) to apply the profile migration, configure OAuth, and run the local website.
## Publish with GitHub Pages

The `Deploy GULU TOURNEX to GitHub Pages` workflow publishes the contents of `frontend/` whenever changes are pushed to `main`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions** if it is not already enabled.

Expected project site URL: <https://gullzenterprises.github.io/GULU-TOURNEX/>. The URL becomes available after the first successful workflow deployment.
