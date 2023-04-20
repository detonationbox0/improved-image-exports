const express = require('express');
const app = express();
var path = require('path');
var fs = require('fs');
var client = require('https');
var {spawn} = require('child_process');
var im = require('imagemagick-composite');

app.use(express.static("public"));
app.use(express.urlencoded({limit:"100mb", extended: true}));

app.use(express.json());

let x = 0;

app.get("/hello", (req, res) => {
    x++
    res.json({
        message:`${x} (Server) Hello!`
    })
})
// Server code here...


/* ---------------------------------------------------------------------- *\
|  Download the shirt images                                              |
|  .../download-image                                                     |
\* ---------------------------------------------------------------------- */

app.post("/download-image", async(req, res) => {

    const objData = req.body.data;

    objData.forEach((obj, i) => {

        const fileName = path.basename(obj.imgFile)
        console.log("Downloading", fileName)

        const outputPath = path.join(__dirname, "process", fileName)

        client.get(obj.imgFile, (clientRes) => {
            clientRes.pipe(fs.createWriteStream(outputPath))
            // Only resolve if last iteration
            if (i === objData.length - 1) {
                res.send(true)
            }
        })
    })
})


/* ---------------------------------------------------------------------- *\
|  Make the Canvas Output PNG                                              |
|  .../canvas-file                                                         |
\* ---------------------------------------------------------------------- */

app.post("/canvas-file", async (req, res) => {

    const objData = req.body.data;
    console.log("Making the PNG file...")
    objData.forEach((obj, i) => {

        console.log(`Creating the ${i} Konva output PNG file...`)
        var imageBuffer = decodeBase64Image(obj.dataURL);

        // Write the image buffer to a file
        var canvasFile = path.join(__dirname, "process", `${i}.png`)
    
        fs.writeFile(canvasFile , imageBuffer.data, function(err) { 
    
            if (err) {
                console.log(err);
                reject(err)
            };
            
            // Only resolve if last iteration
            if (i === objData.length - 1) {
                res.send(true);
            }

    
        });
    })

});

/* ---------------------------------------------------------------------- *\
|  Execute Python File                                                     |
|  .../python                                                              |
\* ---------------------------------------------------------------------- */

app.post("/python", async (req, res) => {

    const objData = req.body.data;

    console.log("Executing Python....")

    objData.forEach((obj, i) => {

        // name of shirt file
        const shirtFileName = path.basename(obj.imgFile)

        // OS Friendly File Paths
        var canvasFile = path.join(__dirname, "process", `${i}.png`) 
        var shirtFile = path.join(__dirname, "process", shirtFileName)
        var outFile = path.join(__dirname, "public", "thumbs", `${i}-proof.png`) 

        // Path to Python file
        var pyFile = path.join(__dirname, "makeShirtProofs.py")

        // Arguments for Python
        var args = [
            pyFile,
            shirtFile,
            canvasFile,
            outFile,
            obj.x,
            obj.y,
            obj.s,
            obj.rgb 
        ]

        console.log(args)

        const python = spawn('python3', args);

        python.stderr.on('data', (data) => {
            // There was a problem with the Python script...
            console.log(data.toString());
            res.send(false);
        });

        python.on("close", () => {
            // All done. Return to sender
            console.log("Python is done. Returning to sender.")

            // Only resolve if last iteration
            if (i === objData.length - 1) {
                res.send(true);
            }
        })



    })

})


/* ---------------------------------------------------------------------- *\
|  Combine proof PNGs to PDF proof file                                    |
|  .../make-pdf                                                            |
\* ---------------------------------------------------------------------- */

app.post("/make-pdf", async (req, res) => {

    const objData = req.body.data;

    const pathToThumbs = path.join(__dirname, "public", "thumbs")

    const file1 = path.join(pathToThumbs, "0-proof.png");
    const file2 = objData.length > 1 ? path.join(pathToThumbs, "1-proof.png") : "";
    const outFile = path.join(pathToThumbs, "proof.pdf");

    const pyFile = path.join(__dirname, "pngToPDF.py") 

    const args = [
        pyFile, // Path to python file
        file1, // Path to first image 
        file2, // Path to second image, "" is ignored
        outFile // Path to output PDF
    ] 

    const python = spawn('python3', args)


    python.stderr.on('data', (data) => {
        // There was a problem with the Python script...
        console.log(data.toString());
        res.send(false);
    });

    python.on("close", () => {
        // All done. Return to sender
        console.log("Python is done. Returning to sender.")
        res.send(true);

    })

});


/* ---------------------------------------------------------------------- *\
|  Make print files                                                        |
|  .../make-prints                                                            |
\* ---------------------------------------------------------------------- */
app.post("/make-prints", async (req, res) => {

    console.log("Making the print files...")

    const objData = req.body.data;

    objData.forEach((obj, i) => {

        var canvasFile = path.join(__dirname, "process", `${i}.png`) 
        var trimFile = path.join(__dirname, "process", `${i}-trimmed.png`)
    
        var args = [
            canvasFile,
            "-trim",
            "-density", "300",
            "-units", "PixelsPerInch",
            "-define", "png:color-type=6",
            "-profile", `${path.join(__dirname, "sRGB2014.icc")}`,
            "+repage",
            trimFile
        ];

        im.convert(args, function(err, stdout) {
            if (err) throw err;
    
            console.log("Print file made.")
            // Only resolve if last iteration
            if (i === objData.length - 1) {
                res.send(true);
            }
    
            
        });

    })


    console.log("Making the Trimmed Print PNG file...")

    
})

/* ---------------------------------------------------------------------- *\
|  Helper Functions                                                        |
\* ---------------------------------------------------------------------- */

/**
 * Decode Base64 Image
 * https://stackoverflow.com/questions/20267939/nodejs-write-base64-image-file
 * @param {String} dataString Base64 Image Data
 * @returns 
 */
function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};
  
    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }
  
    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');
  
    return response;
  }


app.listen(3000);
