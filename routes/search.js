const Router = require('koa-router');
const router = Router();

const { ESAPI } = require('../lib/es-api');
es = new ESAPI();

/**
 * QueryStrings:
 *   - city
 *   - priceLow
 *   - priceHigh
 *   - name
 */
router.get('/v1/search', async function (ctx) {
  ctx.body = await  es.query({});
});

module.exports = router;
