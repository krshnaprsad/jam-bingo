# Jam Bingo

Bingo with friends, with a twist: you can freeze their squares.

Made by [Zero3](https://www.zero3creatives.net/).

## Why I built Jam Bingo

Playing normal bingo is normal. I thought it would be fun to add a feature where you can jam the other player, which makes the game a bit harder. It is not just for two people either, any number can play. I felt that was a really fun option, so I made a game like Jam Bingo.

## What it does

I wanted a bingo game I could send to friends without anyone making an account or me paying for a server. So I built one.

Everyone gets a card. A number is called every few seconds. Tap it on your card once it has been called. First full line wins, so press BINGO fast.

The twist is the Jam. Each player gets 3. Hit JAM, then tap an unmarked square on a rival's card. If that square's number was already called, the square is out for the rest of the round. If not, it is frozen for 2 calls, and if its number gets called while it is frozen, it is out too. A square that is out can never be marked, so it cannot count towards a line.

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

I made this and it is free to use, including for paid work. What it is not free to do is be copied: please don't republish, redistribute or sell the code, or build your own version from it. The full terms are in [LICENSE](LICENSE). Versions published before 19 October 2026 were MIT and stay that way. The Zero3 name and logo are not part of the licence.
