const ccxt = require('ccxt');

(async function () {
    const exchange = new ccxt.binanceus();
    // or
    // const exchange = new ccxt.coinbase();

    //check price of Bitcoin vs US dollar
    const ticker = await exchange.fetchTicker("BTC/USD");
    console.log(ticker); //log info about BTC/USD price history

    //price of Bitcoin in 15 minute intervals for past 5 intervals
    //ohlc = open, high, low, closing
    const ohlc = await exchange.fetchOHLCV("BTC/USD","15m",undefined,5);

    //log the prices
    ohlc.forEach(candle => {
        console.log(candle)
    });
})();