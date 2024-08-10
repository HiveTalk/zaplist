# zaplist

Generate a grid of who sent you zaps, so you can thank them for contributing to a project. Inspired by contrib.rocks

- currently gets zaps from all relays for a specific user in the last X days
- generates a grid that can be downloaded as a .html file

<img width="1087" alt="Screenshot 2024-08-04 at 12 27 32 PM" src="https://github.com/user-attachments/assets/12a2681b-fed5-4eb0-a0f8-b2e92583dfba">

## How to run 

node.js 18+ required

```
npm install
npm run start
```

visit http://localhost:3000

## Good First issues (Todo Items)

- accept both hex and npub as inputs
- Add a nostr NIP-07 login
- grab all avatar images and replaces links with a local copy that you can download as a zip file
- add optional image download instead of html
- Allow user to pick from a calendar instead of X days


## Contributing

- New contributors welcome, this is a good micro project to get your feet wet with foss.

