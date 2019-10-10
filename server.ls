require! {
    \superagent : { get }
    \fs : { read-file-sync, write-file-sync, exists-sync }
    \express
    \./template.json
    \fetch-base64
}

get-file = (name, cb)->
    data = read-file-sync name, \utf8
    obj = JSON.parse data
    cb null, obj

save-file = (name, data, cb)->
    str = JSON.stringify data
    write-file-sync name, str
    cb null

get-cached = (url, cb)->
    name = \./cache/ + url.replace(/\//g, '_')
    return get-file name, cb if exists-sync name
    err, data <- get url .end
    return cb err if err?
    err <- save-file name, data.body
    return cb err if err?
    cb null, data.body
base = "https://api.coingecko.com/api/v3"

get-token = (contract_address, cb)->
    err, data <- get-cached "#{base}/coins/ethereum/contract/#{contract_address}"
    info = { ...template }
    image <- fetch-base64.remote data.image.small .then
    info.image = image
    info.token = data.symbol
    SYMBOL = data.symbol.to-upper-case!
    usd-url = "https://min-api.cryptocompare.com/data/pricemulti?fsyms=#{SYMBOL}&tsyms=USD"
    err, data <- get-cached usd-url
    info.usd-info = 
        | not err? => "url(#{usd-url}).#{SYMBOL}.USD"
        | _ => "0.01"
    info.mainnet.address = contract_address
    err, token-info <- get-cached "http://api.ethplorer.io/getTokenInfo/#{contract_address}?apiKey=freekey"
    return cb err if err?
    info.mainnet.decimals = +token-info.decimals
    cb null, info

get-cached-token = (contract_address, cb)->
    name = \./cache/ + contract_address
    return get-file name, cb if exists-sync name
    err, data <- get-token contract_address
    return cb err if err?
    err <- save-file name, data
    return cb err if err?
    cb null, data
    
app = express!

app.get \/token/:contract_address , (req, res)->
    err, data <- get-cached-token req.params.contract_address #"0x83984d6142934bb535793a82adb0a46ef0f66b6d"
    return res.status(400).send("#err") if err?
    res.send data

app.listen 8888





