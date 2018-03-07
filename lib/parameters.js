"use strict";

const os          = require('os');
const fs          = require('fs');
const Path        = require('path');
const _           = require('lodash');
const Promise     = require('bluebird');
const request     = require('request');
const AWS         = require('aws-sdk');

const DEFAULT_MAX_SEARCH_DEPTH = 5;

/**
 * @param String[] requiredParameters
 * @param Object   [options]
 * @param String   [options.region='us-west-2']
 * @param String   [options.environment='development']
 * @param Boolean  [options.runInVpc=true]
 */
module.exports = function (requiredParameters, options) {
  const opts = _.defaults(_.cloneDeep(options || {}), { 
    maxSearchDepth: DEFAULT_MAX_SEARCH_DEPTH, 
    region        : 'ap-northeast-1',
    environment   : 'dev',
    runInVpc      : true,
  });

  return Promise.resolve()
    .then(_.partial(getMetadata, opts))
    .then(_.partial(getSystemParameters, requiredParameters));
};

/**
 * Collecting environment and service metadata include
 *   - instance-id
 *   - environment
 *   - [service]
 *     - [name]
 *     - [version]
 *
 * @param Object  [options]
 * @param Number  options.maxSearchDepth The maximum iteration for searching package.json upward from current working directory
 * @param String  options.region Region if we are running inside VPC
 * @param String  options.environment Environment if we are not running inside VPC
 * @param Boolean options.runInVpc Whether we are running inside VPC environment
 */
function getMetadata(options) {
  return new Promise(function _getMetadata(resolve, reject) {
    if (!options.runInVpc) {
      return resolve({ 
        instanceId      : os.hostname(),
        region          : options.region,
        availabilityZone: `${options.region}a`, ///< The first AZ of the target regsion
      });
    }

    const url = 'http://169.254.169.254/latest/dynamic/instance-identity/document';
    return request.get(url, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode !== 200) {
        return reject(resp.statusCode);
      }

      return resolve(JSON.parse(body));
    });
  })
  .then(function _parseMetadata(metadata) {
    if (!options.runInVpc) {
      return Promise.resolve({
        region      : metadata.region,
        environment : options.environment,
        _initiator  : {
          instance_id       : metadata.instanceId,
          region            : metadata.region,
          availability_zone : metadata.availabilityZone,
        }
      });
    }

    return new Promise(function (resolve, reject) {
      const EC2 = new AWS.EC2({ region : metadata.region });
      const queryParams = {
        Filters: [
          {
            Name: 'resource-id',
            Values: [ metadata.instanceId ],
          },
          {
            Name: 'key',
            Values: [ 'env' ],
          }
        ],
      };

      return EC2.describeTags(queryParams, function (err, data) {
        if (err) {
          return reject(err);
        }
        
        const envTag = _.find(data.Tags, { Key: 'env' });
        if (!envTag) {
          return reject('Cannot not find \'env\' tag for this ec2 instance');
        }

        const result = {
          region      : metadata.region,
          environment : envTag.Value.toLowerCase(),
          _initiator  : {
            instance_id       : metadata.instanceId,
            region            : metadata.region,
            availability_zone : metadata.availabilityZone,
          }
        };

        if (_.has(metadata, 'privateIp')) {
          result._initiator.instance_private_ip = metadata.privateIp;
        }

        return resolve(result);
      });
    });
  })
  .then(function _search(config) {
    var remainSearchDepth   = options.maxSearchDepth;
    const rootDir           = process.cwd();
    var target              = 'package.json';

    while(--remainSearchDepth >= 0) {
      // Read service name and version
      try {
        const targetPath    = Path.resolve(rootDir, target);
        if (fs.existsSync(targetPath)) {
          const serviceConfig = require(targetPath);
          config._initiator.service = _.get(serviceConfig, 'name', 'unknown');
          config._initiator.version = _.get(serviceConfig, 'version', 'unknown');

          return config;
        }
      }
      catch (err) {
        //console.error(err.toString());
      }

      target = '../' + target;
    }
    
    console.error('Cannot load package.json');

    return config;
  });
}

function getSystemParameters(requiredParameters, config) {
  const ssm = new AWS.SSM({region: config.region});
  return new Promise(function (resolve, reject) {
    if (_.isEmpty(requiredParameters)) {
      return resolve(config);
    }

    const PREFIX        = '/' + config.environment + '/';
    const PREFIX_LENGTH = PREFIX.length;
    const getParams     = {
      Names: _.map(requiredParameters, function (name) { return PREFIX + name; }),
      WithDecryption: true,
    };

    return ssm.getParameters(getParams, function (err, data) {
      if (err) {
        return reject(err);
      }

      // Remove prefix
      const parameters = _(data)
        .get('Parameters', [])
        .reduce(function (r, param) { 
          r[param.Name.substr(PREFIX_LENGTH)] = param.Value;
          return r;
        }, config);

      if (!_.isEmpty(data.InvalidParameters)) {
        const errMsg = _.reduce(requiredParameters, function (r, name) {
          if (!_.has(parameters, name)) {
            r.push('Missing parameter ' + PREFIX + name);
          }

          return r;
        }, []);

        return reject(errMsg.join('\n'));
      }

      // Conver to nested structure
      const nestedParameters = _.reduce(parameters, function (result, value, key) {
        const parts = key.split('/'); 
        
        // Build parent structure
        var root = result;
        for (var i = 0 ; i < parts.length - 1 ; ++i) {
          if (root[parts[i]] === undefined) {
            root[parts[i]] = {};
          } 

          root = root[parts[i]];
        }

        root[_.last(parts)] = value;

        return result;
      }, {});

      return resolve(nestedParameters);
    });
  })
}
