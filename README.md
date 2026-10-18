# Jam Bingo

Bingo with friends, with a twist: you can freeze their squares.

Made by Zero3.

## What it does

I wanted a bingo game I could send to friends without anyone making an account or me paying for a server. So I built one.

Everyone gets a card. A number is called every few seconds. Tap it on your card once it has been called. First full line wins, so press BINGO fast.

The twist is the Jam. Each player gets 3. Hit JAM, then tap an unmarked square on a rival's card to freeze it for 2 calls. A frozen square cannot be marked until it thaws.

Up to 6 players. Two players is a duel. You can also play against a bot, or add bots to a room.

## Play

Open the game: https://krshnaprsad.github.io/jam-bingo/

Create a room, send the 4 letter code (or the invite link) to your friends, and start when everyone is in. Keep the host's tab open, it runs the game.

## Things to know

- Players connect straight to each other (WebRTC). There is no game server and nothing is stored. The free Trystero library uses public relays only to introduce the browsers to each other.
- Some work, school and mobile networks block direct connections. If a friend cannot join, try another network or a phone hotspot.
- If the host closes the tab, the round ends for everyone.
- If you see an old version, press Ctrl+F5.

## Run the tests

`node game.test.js` checks the card rules, calling, jams and winning.

## Licence

MIT, copyright Krishna Prasad. The Zero3 logo is not covered by the licence.
