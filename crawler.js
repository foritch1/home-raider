const { RentAPI } = require('./lib/rent-api');
//const { ESAPI }   = require('./lib/es-api');
const api         = new RentAPI();
//const es          = new ESAPI();

const { writeFile } = require('fs');

(async function crawlFrom591() {
  let offset = 0;

  try {
    while (true) {
      const newRents = await api.search(offset);

      if (newRents.length === 0) {
        break;
      }

      console.log(newRents.length, offset);

      newRents.forEach(async doc => {
        await writeToFile(doc.id, doc);
        //await es.put({ id: doc.id, doc });
      });

      offset += newRents.length;

      // TODO: Save 300 first
      if (offset >= 300) {
        break;
      }
    }
  } catch (err) {
    console.log(err);
  }
})();

function writeToFile(fileName, data) {
  return new Promise((resolve, reject) => {
    return writeFile('./posts/591/' + fileName, JSON.stringify(data, null, 4), {flag: 'w'}, (err) => {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    });
  });
}

