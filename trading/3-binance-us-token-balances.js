'use strict';
require("dotenv").config();
const ccxt = require('ccxt');

(async function () {
    //connect to Binance.US
    const bus = new ccxt.binanceus({
        'apiKey': process.env.BINANCE_US_API_KEY,
        'secret': process.env.BINANCE_US_SECRET_KEY,
        timeout:30000,
        enableRateLimit:true
    })
    
    //connect to Kraken
    //const kkn = new ccxt.kraken ({
    //    'enableRateLimit': true,
    //    "apiKey": process.env.KRAKEN_API_KEY,
    //    "secret": process.env.KRAKEN_SECRET_KEY,
    //})

    //fetch and print balances from Binance.US
    let balances = await bus.fetchBalance()
    console.log(balances.info.balances)

    //fetch and print balances from Kraken
    //balances = await kkn.fetchBalance()
    //console.log(balances.info.balances)
})();
