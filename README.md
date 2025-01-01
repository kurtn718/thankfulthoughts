# Thankful Thoughts

This is the repository for the Thankful Thoughts app.   Thankful Thoughts helps you express gratitude effortlessly with AI-powered assistance. Create heartfelt thank you messages that truly convey your appreciation.

If you just want to use the app, you can go to [Thankful Thoughts](https://thankful-thoughts.com).

If you want to contribute to this app, you can do so by forking the repository and making changes to the app, pull requests are welsome and will be reviewed.

If you want to use this as a starting point for your own AI app - first of all awesome!! and secondly, you could start out by forking the basic chat app that I created on Github at [https://github.com/kurtn718/simple-chat-with-authentication](https://github.com/kurtn718/simple-chat-with-authentication) that I enhanced to create this app.

To build or run the app locally you will need to signup for accounts and get API keys for:

- [clerk.com](https://clerk.com)  - for authentication
- [openrouter.ai](https://openrouter.ai) - for the AI model(s)
- [vercel.com](https://vercel.com) - for deployment
- [prisma.io](https://prisma.io) - for the database
- [helicone.ai](https://helicone.ai) - for tracing and monitoring

Relax, these are all free to signup for and have free usage tiers.   The deployment at [Thankful Thoughts](https://thankful-thoughts.com) cost less than $20 total lifetime (which included ~$12 for the domain name and $5 for the OpenRouter AI credits - to have a backup model if the free model is down).

Once you have the API keys store them somewhere safe, and then create a .env.local file in the root of the project with these entries:



- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `OPENROUTER_API_KEY`
- `DATABASE_URL`
- `PULSE_API_KEY`
- `HELICONE_API_KEY`



Also add the following entries:

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chat`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/chat`

Then finally to run locally execute these commands:

npm install  
npm run dev

You should be able to navigate to http://localhost:3000 to get to the main page
