'use strict';
require("dotenv").config();
const ccxt = require('ccxt');
const fs = require('fs');

(async function () {
    //fs.writeFileSync("ccxt-exchanges.json", JSON.stringify(ccxt.exchanges))
    
    //get information for Binance.US exchange
    const exchangeId = 'binanceus'
    , exchangeClass = ccxt[exchangeId]
    , exchange = new exchangeClass({
        'apiKey': process.env.BINANCE_US_API_KEY,
        'secret': process.env.BINANCE_US_SECRET_KEY,
    })
    // load-market-data
    fs.writeFileSync("binanceus-market-data.json", JSON.stringify(await exchange.loadMarkets()))
    const markets = require("./binanceus-market-data.json");
    const marketsArr = Object.keys(markets).map(market=>market)
    fs.writeFileSync("binanceus-markets.json", JSON.stringify(marketsArr))

    //fetch token balances from Binance.US
    console.log("Binance US", await exchange.fetchBalance())
})();