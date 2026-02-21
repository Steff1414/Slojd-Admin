# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a04141be-8665-41c1-927e-21557624dce2

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a04141be-8665-41c1-927e-21557624dce2) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a04141be-8665-41c1-927e-21557624dce2) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Norce Commerce setup (instance-specific)

`norce-proxy` can now derive API endpoints from a Norce admin URL.

Set these Supabase Edge Function secrets:

- `NORCE_CLIENT_ID`
- `NORCE_CLIENT_SECRET`
- `NORCE_ADMIN_URL` (your admin URL)
- `NORCE_SCOPE` (`prod`, `stage`, or `playground`)
- `NORCE_DEFAULT_APP_ID` (your Norce Application ID)

Optional overrides:

- `NORCE_TOKEN_URL`
- `NORCE_QUERY_BASE`

Frontend env (local build/runtime):

- `VITE_NORCE_APPLICATION_ID` (defaults to `1042`)

### Example: Slojddetaljer production

- `NORCE_ADMIN_URL=https://slojddetaljer.admin-se.norce.tech`
- `NORCE_SCOPE=prod`

### Example: Norce Open Demo (playground)

- `NORCE_ADMIN_URL=https://norce-open-demo.admin-se.playground.norce.tech`
- `NORCE_SCOPE=playground`
