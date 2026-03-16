const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const source = 'c:/Users/SriHaran/Documents/Projects/finalcar/logo1.png';
const androidResDir = path.join(__dirname, 'android/app/src/main/res');

const iconConfigs = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
];

async function generateIcons() {
    console.log(`Reading source image from: ${source}`);

    try {
        const image = await Jimp.read(source);
        console.log(`Image loaded successfully! Size: ${image.width}x${image.height}`);

        for (const config of iconConfigs) {
            const destDir = path.join(androidResDir, config.dir);
            if (!fs.existsSync(destDir)) {
                console.log(`Creating directory ${destDir}`);
                fs.mkdirSync(destDir, { recursive: true });
            }

            const files = ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'];

            for (const file of files) {
                const destPath = path.join(destDir, file);

                // Read fresh image for each resize to avoid clone issues
                const img = await Jimp.read(source);
                await img.resize(config.size, config.size)
                    .write(destPath);

                console.log(`Generated ${config.size}x${config.size} icon at ${destPath}`);
            }
        }
        console.log('All Android icons generated successfully!');
    } catch (err) {
        console.error('CRITICAL ERROR:', err.message);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    }
}

generateIcons();
