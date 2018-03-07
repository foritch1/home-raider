const koa     = require('koa');
const app     = new koa();
const debug   = require('debug')('koa');
const port    = process.env.PORT || 3000;

const Router        = require('koa-router');
const router        = Router();

const searchRouters = require('./routes/search');
router.use('/api', searchRouters.routes(), searchRouters.allowedMethods());

app.use(router.routes());

app.listen(port);
debug(`Listen on port ${port}`);

const { ESAPI } = require('./lib/es-api');
es = new ESAPI();

es.query({})
//es.drop({})
  .then(console.log)
  .catch((err) => {
    console.log(err);
  });

module.exports = app;
