const redis = require("redis");
const moment = require("moment");
const { promisify } = require("util");
const { isWeekend, nonTickerCommand } = require("./validator");

const redisClient = redis.createClient(
  {
    url: "redis://default:RIarTozHTSGKk4L15Sboq4y3keMMPaSf@redis-17125.c295.ap-southeast-1-1.ec2.cloud.redislabs.com:17125"
    // url: "redis://172.16.25.93:6379"
  },
  {
    retry_strategy: function (options) {
      if (options.error && options.error.code === "ECONNREFUSED") {
        // End reconnecting on a specific error and flush all commands with
        // a individual error
        return new Error("The server refused the connection");
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        // End reconnecting after a specific timeout and flush all commands
        // with a individual error
        return new Error("Retry time exhausted");
      }
      if (options.attempt > 10) {
        // End reconnecting with built in error
        return undefined;
      }
      // reconnect after
      return Math.min(options.attempt * 100, 3000);
    },
  });

// Create a separate Redis client for subscribing to channels
const subscriberClient = redis.createClient(
  {
    url: "redis://default:RIarTozHTSGKk4L15Sboq4y3keMMPaSf@redis-17125.c295.ap-southeast-1-1.ec2.cloud.redislabs.com:17125"
    // url: "redis://172.16.25.93:6379"
  },
  {
    retry_strategy: function (options) {
      if (options.error && options.error.code === "ECONNREFUSED") {
        // End reconnecting on a specific error and flush all commands with
        // a individual error
        return new Error("The server refused the connection");
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        // End reconnecting after a specific timeout and flush all commands
        // with a individual error
        return new Error("Retry time exhausted");
      }
      if (options.attempt > 10) {
        // End reconnecting with built in error
        return undefined;
      }
      // reconnect after
      return Math.min(options.attempt * 100, 3000);
    },
  });


const getRedis = promisify(redisClient.get).bind(redisClient);
const sMembersRedis = promisify(redisClient.smembers).bind(redisClient);
const zRangeRedis = promisify(redisClient.zrange).bind(redisClient);
const delRedis = promisify(redisClient.del).bind(redisClient);
const setRedis = promisify(redisClient.set).bind(redisClient);
const expireAtRedis = promisify(redisClient.expireat).bind(redisClient);

redisClient.on("error", function (err) {
  console.error("Redis Error " + err);
});

const redisBDKey = (ticker, fromDate, toDate) => {
  return `BD:${ticker}_${fromDate}_${toDate}`;
};

const redisAccDistKey = (type) => {
  return "AccDist:" + type;
};

const redisBDSKey = (broker, type, tf) => {
  return `BDS:${broker}_${type}_${tf}`;
};

const redisOWKey = (broker, type) => {
  return "OW:" + broker + type;
};

const redisOWSKey = (broker, type) => {
  return "OWS:" + broker + type;
};

const redisMDKey = (today) => {
  return `MD:${today}`;
};

const redisIndexKey = (region) => {
  return `Index:${region}`;
};

const redisInfoKey = (ticker) => {
  return `Info:${ticker}`;
};

const redisCommKey = () => {
  const today = moment().format("YYYYMMDD");
  return `Comm:${today}`;
};

const redisChartKey = (type, ticker, interval) => {
  return interval
    ? `${type}:${ticker.toUpperCase()}-${interval.toUpperCase()}`
    : `${type}:${ticker.toUpperCase()}`;
};

const redisUserDataKey = (user_id) => {
  return `UserData:${user_id}`;
};

const redisScrBdKey = (tf, ad, number) => {
  return `ScrBD-${tf}_${ad}_${number}`;
};

const redisLiquidKey = (ticker) => {
  return `Liquid:${ticker}`;
};

const redisExpiry = () => {
  const tomorrowDay = moment()
    .add(1, "days")
    .startOf("day")
    .add(510, "minutes");
  const today = moment().startOf("day").add(510, "minutes");
  const nextWeek = moment()
    .add(1, "weeks")
    .startOf("isoWeek")
    .add(510, "minutes");

  return { tomorrowDay, today, nextWeek };
};

const saveToRedisCache = (key, value) => {
  const finalKey = key.replace("undefined", "");
  const { tomorrowDay, today, nextWeek } = redisExpiry();
  if (
    moment().isBetween(
      moment("18:30:00", "HH:mm:ss"),
      moment("23:59:59", "HH:mm:ss")
    )
  ) {
    redisClient.set(finalKey, value.toString());
    redisClient.expire(finalKey, tomorrowDay.diff(moment(), "seconds"));
  } else if (
    moment().isBetween(
      moment("00:00:00", "HH:mm:ss"),
      moment("08:00:00", "HH:mm:ss")
    )
  ) {
    redisClient.set(finalKey, value.toString());
    redisClient.expire(finalKey, today.diff(moment(), "seconds"));
  } else if (isWeekend()) {
    redisClient.set(finalKey, value.toString());
    redisClient.expire(finalKey, nextWeek.diff(moment(), "seconds"));
  }
};

const saveToRedisCacheOW = (key, value) => {
  const finalKey = key.replace("undefined", "");
  const startOfMonth = moment().startOf("month");
  const endOfMonth = moment().endOf("month");

  if (moment().isBetween(startOfMonth, endOfMonth)) {
    redisClient.set(finalKey, value.toString());
    redisClient.expire(finalKey, endOfMonth.diff(moment(), "seconds"));
  }
};

const saveToRedisCacheMD = (key, value) => {
  const finalKey = key.replace("undefined", "");

  redisClient.set(finalKey, value.toString());
  redisClient.expire(finalKey, 3600);
};

const saveToRedisCacheIndex = (region) => {
  const now = moment();

  if (region == "ASIA") {
    if (
      now.isBetween(
        moment("00:00:00", "HH:mm:ss"),
        moment("06:00:00", "HH:mm:ss")
      ) ||
      now.isBetween(
        moment("18:00:00", "HH:mm:ss"),
        moment("23:59:59", "HH:mm:ss")
      )
    ) {
      redisClient.set(region, region.toString());
      redisClient.expire(finalKey, 3600);
    }
  } else if (region == "US") {
    if (
      now.isBetween(
        moment("03:30:00", "HH:mm:ss"),
        moment("19:30:00", "HH:mm:ss")
      )
    ) {
      redisClient.set(region, region.toString());
      redisClient.expire(finalKey, 3600);
    }
  } else if (region == "EU") {
    if (
      now.isBetween(
        moment("23:00:00", "HH:mm:ss"),
        moment("23:59:59", "HH:mm:ss")
      ) ||
      now.isBetween(
        moment("00:00:00", "HH:mm:ss"),
        moment("13:00:00", "HH:mm:ss")
      )
    ) {
      redisClient.set(region, region.toString());
      redisClient.expire(finalKey, 3600);
    }
  }
};

const saveToRedisCacheComm = () => { };

const checkRedisCache = (key) => {
  return getRedis(key);
};

const setMaintenance = () => {
  redisClient.set("Maintenance", true);
};

const unsetMaintenance = () => {
  redisClient.del("Maintenance");
};

const setFallback = () => {
  redisClient.set("Fallback", true);
};

const unsetFallback = () => {
  redisClient.del("Fallback");
};

const setUserData = (user_id, command, args) => {
  if (!nonTickerCommand(command)) {
    const ticker = args[0].toUpperCase();
    const endOfDay = moment().endOf("day");
    redisClient.sadd(redisUserDataKey(user_id.toString()), ticker);
    redisClient.expire(
      redisUserDataKey(user_id.toString),
      endOfDay.diff(moment(), "seconds")
    );
  }
};

const setSBD = (key, value, score) => {
  const index = score / 10;
  const { tomorrowDay, today, nextWeek } = redisExpiry();
  if (
    moment().isBetween(
      moment("21:00:00", "HH:mm:ss"),
      moment("23:59:59", "HH:mm:ss")
    )
  ) {
    redisClient.zadd(key, index, value);
    redisClient.expire(key, tomorrowDay.diff(moment(), "seconds"));
  } else if (
    moment().isBetween(
      moment("00:00:00", "HH:mm:ss"),
      moment("08:00:00", "HH:mm:ss")
    )
  ) {
    redisClient.zadd(key, index, value);
    redisClient.expire(key, today.diff(moment(), "seconds"));
  } else if (isWeekend()) {
    redisClient.zadd(key, index, value);
    redisClient.expire(key, nextWeek.diff(moment(), "seconds"));
  }
};

const setRedisCache = (key, value) => {
  return redisClient.set(key, value);
};
const removeRedisCache = (key) => {
  return redisClient.del(key);
};

async function getUserData(user_id) {
  const response = await sMembersRedis(redisUserDataKey(user_id.toString()));
  return {
    count: response.length,
    ticker: response,
  };
}

async function getSBD(key) {
  return await zRangeRedis(key, "0", "-1");
}

const flushRedis = () => {
  return redisClient.flushall();
};

const saveTokenToRedis = (token, refreshToken, tokenExpiry, refreshTokenExpiry) => {
  const tokenExpirySeconds = moment(tokenExpiry).diff(moment(), 'seconds');
  const refreshTokenExpirySeconds = moment(refreshTokenExpiry).diff(moment(), 'seconds');

  redisClient.set("access_token", token);
  redisClient.set("refresh_token", refreshToken);
  redisClient.expire("access_token", tokenExpirySeconds);
  redisClient.expire("refresh_token", refreshTokenExpirySeconds);
};

const getTokenFromRedis = async () => {
  const token = await getRedis("access_token");
  const refreshToken = await getRedis("refresh_token");
  return { token, refreshToken };
};

const publish = (channel, message) => {
  redisClient.publish(channel, message);
};

const subscribe = (channel) => {
  subscriberClient.subscribe(channel);
};

const onMessage = (callback) => {
  subscriberClient.on('message', callback);
};

const setRedisWithTTL = async (key, value) => {
  await setRedis(key, value);

  const now = moment();
  const sixPM = moment().hour(18).minute(0).second(0);
  let expiry;

  if (now.isAfter(sixPM)) {
    // If it's after 6PM, set the TTL to the end of the day
    expiry = moment().endOf('day');
  } else {
    // If it's before 6PM, set the TTL to 6PM
    expiry = sixPM;
  }

  await expireAtRedis(key, expiry.unix());
};

const deleteRedis = async (key) => {
  await delRedis(key);
};

module.exports = {
  redisBDKey,
  redisAccDistKey,
  redisBDSKey,
  redisCommKey,
  redisIndexKey,
  redisMDKey,
  redisOWKey,
  redisOWSKey,
  redisInfoKey,
  redisChartKey,
  redisLiquidKey,
  saveToRedisCache,
  saveToRedisCacheMD,
  saveToRedisCacheOW,
  saveToRedisCacheIndex,
  saveToRedisCacheComm,
  checkRedisCache,
  setMaintenance,
  unsetMaintenance,
  setUserData,
  getUserData,
  redisScrBdKey,
  setRedisCache,
  removeRedisCache,
  setSBD,
  getSBD,
  setFallback,
  unsetFallback,
  flushRedis,
  saveTokenToRedis,
  getTokenFromRedis,
  publish,
  subscribe,
  onMessage,
  deleteRedis,
  setRedisWithTTL,
};
