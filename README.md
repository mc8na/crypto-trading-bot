# crypto-trading-bot
Arbitrage trading bot for crypto exchanges

This repo contains code to perform crypto trades using a trading bot connected to exchanges through the API key. The API and secret keys from the exchanges must be loaded into the .env file, which is not included for security reasons.

Inside the trading-bot folder are files setting up the general crypto trading functions such as fetching market data from an exchange, fetching information about a specific coin from an exchange, fetching the user coin balances from an exchange, and finally placing buy and sell orders on an exchange using the API.

The arbitrage folder contains a program to perform arbitrage trading by connecting to all exchanges specified by the user and comparing prices of coins between exchanges to determine if there is an arbitrage opportunity. The program takes into account the fees required to transfer coins between exchanges and sets a minimum profit in order to perform an arbitrage trade.

If an arbitrage opportunity exists, the program logs the information about the exchanges, coins, and amounts to be traded in a green color. If no arbitrage opportunity exists, the program logs the coin pair and expected loss in a red color.

The file arbitrage-output contains sample output from running the arbitrage application.

For further use, this application can be run continuously using pm2 or heroku.
