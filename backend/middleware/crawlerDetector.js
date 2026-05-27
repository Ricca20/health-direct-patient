// backend/middleware/crawlerDetector.js
const crawlerUserAgents = [
  'facebookexternalhit', 'Twitterbot', 'WhatsApp', 'LinkedInBot',
  'Slackbot', 'Googlebot', 'Pinterest', 'Discordbot', 'TelegramBot',
  'baiduspider', 'YandexBot', 'bingbot', 'DuckDuckBot'
];

const isCrawler = (userAgent) => {
  if (!userAgent) return false;
  return crawlerUserAgents.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
};


module.exports = { isCrawler };