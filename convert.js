const Jimp = require("jimp");
const pngToIco = require("png-to-ico");
const fs = require("fs");

(async () => {
    try {
        console.log("Reading image...");
        const image = await Jimp.read("images/1679414162991.jpg");
        image.resize(256, 256);
        console.log("Writing temp png...");
        await image.writeAsync("images/temp.png");
        console.log("Converting to ico...");
        const pti = pngToIco.default || pngToIco;
        const buf = await pti("images/temp.png");
        fs.writeFileSync("images/icon.ico", buf);
        console.log("Cleanup...");
        fs.unlinkSync("images/temp.png");
        console.log("Done.");
    } catch (e) {
        console.error(e);
    }
})();
