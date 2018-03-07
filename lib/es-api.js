const debug         = require('debug')('es-api');
const request       = require('request');
const { getConfig } = require('./config');

class ESAPI {
  constructor() {}

  getBaseUrl() {
    if (this.baseUrl) {
      return Promise.resolve(this.baseUrl);
    }

    return getConfig()
      .then(cfg => {
        this.baseUrl = cfg.es.endpoint;
        return this.baseUrl;
      });
  }

  drop({ index = 'home_raider' }) {
    return this.getBaseUrl()
      .then(baseUrl => {
        return new Promise((resolve, reject) => {
          const url = `${baseUrl}/${index}`;
          const options = {
            url,
            method: 'DELETE',
          };

          debug(`Drop table @ ${url}`);
          return request(options, (err, resp, body) => {
            console.log(body);

            if (err) {
              return reject(err);
            } else if (resp.statusCode >= 200 && resp.statusCode < 300) {
              return resolve(body);
            }

            return reject(new Error(resp.statusCode));
          });
        });
      });
  }

  put({ index = 'home_raider', type = 'rent', id, doc }) {
    return this.getBaseUrl()
      .then(baseUrl => {
        return new Promise((resolve, reject) => {
          const url = `${baseUrl}/${index}/${type}/${id}`;
          const options = {
            url,
            method: 'PUT',
            json: true,
            body: doc,
          };

          debug(`Index document @ ${url}`);
          return request(options, (err, resp, body) => {
            if (err) {
              return reject(err);
            } else if (resp.statusCode >= 200 && resp.statusCode < 300) {
              return resolve(body);
            }

            return reject(new Error(body));
          });
        });
      });
  }

  query({ index = 'home_raider', type = 'rent', queryParams = {} }) {
    return this.getBaseUrl()
      .then(baseUrl => {
        return new Promise((resolve, reject) => {
          const options = {
            url: `${this.baseUrl}/${index}/${type}/_search`,
            method: 'GET',
            json: true,
            body: {
              query: { match_all: {}},

              /*
              query: {
                bool: {
                  must: [
                    { match: { 'linkman': '蔡小姐' } },
                  ],
                }
              }
              */
            },
          };

          return request(options, (err, resp, body) => {
            console.log(resp);
            console.log(body);

            if (err) {
              return reject(err);
            } else if (resp.statusCode !== 200) {
              return reject(new Error(resp.statusCode));
            }

            return resolve({
              total: body.hits.total,
              count: body.hits.hits.length,
              items: body.hits.hits.map(x => x._source),
            });
          });
        });
      });
  }
}

module.exports = {
  ESAPI,
};
