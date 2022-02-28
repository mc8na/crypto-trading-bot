require('ansicolor').nice;
const {Command} = require('commander')
const ccxt = require('ccxt')
const asTable = require('as-table')
const log = require('ololog').configure({ locate: false, time:{yes:true, format:'utc'}})
const program = new Command();
var symbol_excluded = require('./config/symbol_excluded');
console.log("Symbol excluded {wallet update, deposit maintenance, bug, etc): ")
console.log(symbol_excluded)
program.version('0.0.1');

const printSupportedExchanges = () => {
    log('Supported exchanges', ccxt.exchanges.join(', ').green)
}

const printUsage = () => {
    log('Usgae: node', process.argv[1], 'id1'.green, 'id2'.yellow, 'id3'.blue, '...')
    printSupportedExchanges()
}

const compareAll = (oB, ids, symbol, exchanges) => {
    var spreadMax = 0, c = 0;
    let imax, jmax;

    //loop through all pairs of trading coins
    for (var i = 0; i < ids.length; i++) {
        for (var j = 0; j < ids.length; j++) {
            //make sure the coins are tradable
            if ((oB.orderbook[i] != null && oB.orderbook[j] != null)) {
                //make sure the coins are distinct
                if (i != j) {
                    //make sure we can trade the coins
                    if (oB.orderbook[i].bids != null && oB.orderbook[j].asks != null) {
                        if (oB.orderbook[i].bids[0] != null && oB.orderbook[j].asks[0] != null) {
                            if (oB.orderbook[i].bids[0][0] != null && oB.orderbook[j].asks[0][0] != null) {
                                if (oB.orderbook[j].asks[0][0] != 0) {
                                    //account for leverage
                                    if (i == 'kucoin') {
                                        oB.spreads[c] = oB.orderbook[i].asks[0][0] / oB.orderbook[j].asks[0][0]
                                    } else if (j == 'kucoin') {
                                        oB.spreads[c] = oB.orderbook[i].bids[0][0] / oB.orderbook[j].bids[0][0]
                                    } else {
                                        oB.spreads[c] = oB.orderbook[i].bids[0][0] / oB.orderbook[j].asks[0][0]
                                    }
                                    //find maximum spread
                                    if (oB.spreads[c] > spreadMax) {
                                        spreadMax = oB.spreads[c];
                                        imax = i;
                                        jmax = j;
                                    }

                                    c++
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    //calculate fees involved in the transaction
    if (imax != null && jmax != null) {
        if (exchanges[ids[imax]].fees.trading.taker != null && exchanges[ids[jmax]].fees.trading.taker != null) {
            var takerI = exchanges[ids[imax]].fees.trading.taker
            var takerJ = exchanges[ids[jmax]].fees.trading.taker
        }

        //look for at least a 0.6% profit
        if ((spreadMax - takerI - takerJ - 1) * 100 > 0.6) {
            if (!symbol_excluded.includes(symbol)) {
                var volume = Math.min(oB.orderbook[jamx].asks[0][1], oB.orderbook[imax].bids[0][1])
                //log the trade
                log((symbol + " : Buy of " + volume + " on " + ids[jmax] + " at price " + oB.orderbook[jmax].asks[0][0] + " fees : " + takerJ + " and sell on " + ids[imax] + " fees : " + takerJ + " at price " + oB.orderbook[imax].bids[0][0] + "  => Win of = " + Math.round((spreadMax - 1 - takerI - takerJ) * 100 * 100) / 100 + "%")).green
                if (ids[jmax] == 'exmo' || ids[imax] == 'exmo') {
                    const string_notification = symbol + " : Buy of " + volume + " on " + ids[jmax] + " at price " + oB.orderbook[jmax].asks[0][0] + " fees : " + takerJ + " and sell on " + ids[imax] + " fees: " + takerJ + " at price " + oB.orderbook[imax].bids[0][0] + "  => Win of = " + Math.round((spreadMax - 1 - takerI - takerJ) * 100 * 100) / 100 + "%"
                    log(string_notification.green)
                    // do arbitarge here
                    // sell the asset to taker's exchange for profit
                    // request.post('https://api.pushover.net/1/messages.json', { form: { token: config.apiKeyPushoverToken, user: config.apiKeyPushoverUser, message: string_notification}})
                    // console.log("Send notification")
                }
            }
        } else {
            //trade would not be profitable enough
            log((symbol + ": " + (spreadMax - 1 - takerI - takerJ) * 100 + "%").red)
        }
    }
}

let proxies = [
    '', // no proxy by default
    'https://crossorigin.me/',
    'https://cors-anywhere.herokuapp.com/'
];

program
    .name('Arbitrage bot')
    .arguments('[args...]')
    .passThroughOptions()
    .action(async (args) => {
        if (args.length > 1) {
            let ids = process.argv.slice(2)
            let exchanges = {}

            log(ids.join(', ').yellow)

            //load all markets from all exchanges
            for (let id of ids) {
                //instantiate the exchange by id
                let exchange = new ccxt[id]()

                exchanges[id] = exchange
                
                let markets = await exchange.loadMarkets()

                let currentProxy = 0
                let maxRetries = proxies.length

                //try to connect to the exchanges
                for (let numRetries = 0; numRetries < maxRetries; numRetries++) {
                    try {
                        exchange.proxy = proxies[currentProxy]
                        await exchange.loadMarkets()
                    } catch (e) {
                        //error handling
                        if (e instanceof ccxt.DDoSProtection || e.message.includes('ECONNRESET')) {
                            log.bright.yellow('[DDoS Protection Error] ' + e.message)
                        } else if (e instanceof ccxt.RequestTimeout) {
                            log.bright.yellow('[Timeout Error] ' + e.message)
                        } else if (e instanceof ccxt.AuthenticationError) {
                            log.bright.yellow('[Authentication Error]' + e.message)
                        } else if (e instanceof ccxt.ExchangeNotAvailable) {
                            log.bright.yellow('[Exchange Not Available]' + e.message)
                        } else if (e instanceof ccxt.ExchangeError) {
                            log.bright.yellow('[Exchange Error]' + e.message)
                        } else {
                            throw e; // rethrow all other exceptions
                        }

                        // retry next proxy in round-robin fashion in case of error
                        currentProxy = ++currentProxy % proxies.length
                    }
                }
                log(id.green, 'loaded', `${exchange.symbols.length}`.green, 'markets')
            }

            log('Loaded all markets'.green)

            let uniqueSymbols = ccxt.unique(ccxt.flatten(ids.map(id => exchanges[id].symbols)))

            let arbitrableSymbols = uniqueSymbols
                .filter(symbol =>
                    ids.filter(id =>
                        (exchanges[id].symbols.indexOf(symbol) >= 0)).length > 1)
                .sort((id1,id2) => (id1 > id2) ? 1 : ((id2 > id1) ? -1 : 0))

            let table = arbitrableSymbols.map(symbol => {
                let row = { symbol }
                for (let id of ids) {
                    if (exchanges[id].symbols.indexOf(symbol) >= 0)
                        row[id] = id
                }
                return row
            })

            log(asTable.configure({ delimiter: ' | '})(table))

            var arbitrage = {};
            arbitrage.symbols = [];
            arbitrage.exchanges = [];
            for (var i = 0; i < arbitrableSymbols.length; i++) {
                arbitrage.symbols[i] = arbitrableSymbols[i]
                arbitrage.exchanges[i] = []
                arbitrage.exchanges[i].orderbook = [];
                arbitrage.exchanges[i].spreads = [];

                for (var j = 0; j < ids.length; j++) {
                    if (exchanges[ids[j]].symbols.indexOf(arbitrage.symbols[i]) >= 0) {
                        try {
                            var error = false;
                            arbitrage.exchanges[i].orderbook[j] = await exchanges[ids[j]].fetchOrderBook(arbitrage.symbols[i]);
                            if (!arbitrage.exchanges[i].orderbook[j]) console.error("No orderbook found");
                        } catch (e) {
                            console.error(e);
                            var error = true;
                        }
                    }
                }
                if (!error)
                    compareAll(arbitrage.exchanges[i], ids, arbitrage.symbols[i], exchanges)
            }
        } else {
            printUsage()
        }
    });

program.parse();
