export const CHECK_AND_DECR_STOCK_LUA = `
    local stock = redis.call('get', KEYS[1])
    if not stock then
        return -1
    end
    if tonumber(stock) <= 0 then
        return 0
    else
        return redis.call('decr', KEYS[1])
    end
`;