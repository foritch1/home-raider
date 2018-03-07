const { ESAPI }     = require('./lib/es-api');
const es            = new ESAPI();
const { RentInfo }  = require('./lib/rent-info');

const { readdir, readFile } = require('fs');

(async function cleanse() {

  try {
    const posts = await readPosts();

    if (posts.length === 0) {
      return;
    }

    console.log(posts.length);

    posts.forEach(async postId => {
      let doc = await readPost(postId);
      await es.put({ id: postId, doc: new RentInfo(JSON.parse(doc)) });
    });

  } catch (err) {
    console.log(err);
  }

})();

function readPost(fileName) {
  return new Promise((resolve, reject) => {
    return readFile('./posts/591/' + fileName, 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function readPosts() {
  return new Promise((resolve, reject) => {
    return readdir('./posts/591', (err, files) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(files);
      }
    });
  });
}

