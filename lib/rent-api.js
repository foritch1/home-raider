const debug         = require('debug')('rent-api');
const request       = require('request');
const qs            = require('querystring');
const { RentInfo }  = require('./rent-info');

class RentAPI {
  constructor() {
    this.baseUrl = 'https://rent.591.com.tw/home/search/rsList';
  }

  search(offset = 0) {
    return new Promise((resolve, reject) => {
      const queryParams = {
        is_new_list : 1, // ?
        type        : 1, // ?
        kind        : 0, // ?
        searchtype  : 1, // ?
        region      : 1, // ?
        firstRow    : offset,

        // Get newest posts first
        order       : 'posttime',
        orderType   : 'desc',
      };

      const url = `${this.baseUrl}?${qs.stringify(queryParams)}`;
      debug(`Fetch url : ${url}`);

      return request.get(url, (err, resp, body) => {
        if (err) {
          return reject(err);
        } else if (resp.statusCode !== 200) {
          return reject(new Error(resp.statusCode));
        }

        body = JSON.parse(body);

        //const rentInfos = body.data.data.map(x => new RentInfo(x));
        const rentInfos = body.data.data;

        return resolve(rentInfos);
      });
    });
  }

}

module.exports = {
  RentAPI,
};
