# zaplist

Generate a grid of who sent you zaps, so you can thank them for contributing to a project. Inspired by contrib.rocks

- currently gets zaps from all relays for a specific user in the last X days
- generates a grid that can be downloaded as a .html file

<img width="1087" alt="Screenshot 2024-08-04 at 12 27 32 PM" src="https://github.com/user-attachments/assets/12a2681b-fed5-4eb0-a0f8-b2e92583dfba">

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
- Allow user to pick from a calendar instead of X days
- Implement dark mode:
  - Ensure the application uses a dark color scheme
  - Prevent white-on-white text rendering when the user is logged in
- Improve download functionality:
  - Ensure HTML and ZIP downloads are working properly
  - Optimize download speed if possible
  - Add a "Downloading..." text while waiting for HTML, ZIP, and avatar results
- Fix avatar placeholder rendering:
  - Ensure the default avatar image extends to fill the borders of its circle, avoiding oval shapes

## Contributing

- New contributors welcome, this is a good micro project to get your feet wet with foss.

## Contributors

<a href="https://github.com/hivetalk/zaplist/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=hivetalk/zaplist" />
</a>

