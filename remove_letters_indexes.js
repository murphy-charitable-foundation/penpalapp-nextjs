const fs = require('fs');

const data = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8'));

data.indexes = data.indexes.filter(index => index.collectionGroup !== 'letters');

fs.writeFileSync('firestore.indexes.json', JSON.stringify(data, null, 2));