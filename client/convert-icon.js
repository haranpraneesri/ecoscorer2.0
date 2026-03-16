const sharp = require('sharp');
const path = require('path');

const source = 'c:/Users/SriHaran/Documents/Projects/finalcar/logo.avif';
const dest = path.join(__dirname, 'assets/icon.png');

sharp(source)
    .resize(1024, 1024)
    .png()
    .toFile(dest)
    .then(() => {
        console.log('Successfully converted AVIF to PNG at:', dest);
    })
    .catch(err => {
        console.error('Error during conversion:', err);
        process.exit(1);
    });
