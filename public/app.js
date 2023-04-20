var stage;
var stage2;

var isFront = true;



$(() => {

    // Document is loaded.
    console.log("Loaded. Let's rock! 🤘");

/* ---------------------------------------------------------------------- *\
| Konva Canvas Properties                                                  |
\* ---------------------------------------------------------------------- */

    //#region ..................................................................

        // Get the width and height of current images
        const imgWidth = $("#img-front").width();

        // Scale the canvas down from image
        const cnvScale = .45;

        // Width is result of scale
        const width = imgWidth * cnvScale;

        // Height should be 4:5 of width
        const ratio = 4 / 5;
        const height = width / ratio;

        // We want the canvas to be so far from the
        // left and top of the shirt image
        const x = width * .6;
        const y = height * .4;

    //#endregion ...............................................................


    // Position the canvases initially
    $(".canvas").css({
        top:y,
        left:x
    })


    /* ---------------------------------------------------------------------- *\
    | Initialize Konva Canvas                                                  |
    \* ---------------------------------------------------------------------- */

    //#region ..................................................................

        // Initialize stages
        stage = new Konva.Stage({
            container: 'cnv-front',
            width: width,
            height: height
        });

        stage2 = new Konva.Stage({
            container: 'cnv-back',
            width: width,
            height: height
        });

        // Add both a normal, and transformer layer to both stages
        layer = new Konva.Layer();  trLayer = new Konva.Layer();
        layer2 = new Konva.Layer(); trLayer2 = new Konva.Layer();

        stage.add(layer);       stage.add(trLayer);
        stage2.add(layer2);     stage2.add(trLayer2);

    //#endregion ...............................................................


    /* ---------------------------------------------------------------------- *\
    | Konva Canvas Transformer Logic                                           |
    \* ---------------------------------------------------------------------- */

    //#region ..................................................................

        // Create a transformer layer for both stages
        tr = new Konva.Transformer({
            rotateAnchorOffset: 30,
            enabledAnchors: [
                'top-left', 'top-right', 'bottom-left', 'bottom-right'
            ]
        });

        tr2 = new Konva.Transformer({
            rotateAnchorOffset: 30,
            enabledAnchors: [
                'top-left', 'top-right', 'bottom-left', 'bottom-right'
            ]
        });

        // Add to the transformer layer of both stages
        trLayer.add(tr); trLayer2.add(tr2);

        // Create a transformer rectangle
        var selectionRectangle = new Konva.Rect({
            fill: 'rgba(121,185,201,0.5)',
            visible: false
        });

        // Clone, and add to both stage's layers
        var selectionRectangle2 = selectionRectangle.clone();
        layer.add(selectionRectangle);  layer2.add(selectionRectangle2);

        // Define handler for mousedown 
        const handleMouseDown = (selRect) => {

            return function(e) {
                // do nothing if we didn't start selection
                if (!selRect.visible()) {
                    return;
                }

                e.evt.preventDefault();
                x2 = stage.getPointerPosition().x;
                y2 = stage.getPointerPosition().y;

                selRect.setAttrs({
                    x: Math.min(x1, x2),
                    y: Math.min(y1, y2),
                    width: Math.abs(x2 - x1),
                    height: Math.abs(y2 - y1),
                });
            }
            
        }

        // Define handler for mouseup
        const handleMouseUp = (selRect, relStage, relTr) => {

            return function (e) {
                // do nothing if we didn't start selection
                if (!selRect.visible()) {
                    return;
                }
                e.evt.preventDefault();
                // update visibility in timeout, so we can check it in click event
                setTimeout(() => {
                    selRect.visible(false);
                });

                // console.log(stage);

                var shapes = relStage.find('.selectable');
                var box = selRect.getClientRect();
                var selected = shapes.filter((shape) =>
                    Konva.Util.haveIntersection(box, shape.getClientRect())
                );

                relTr.nodes(selected); 
            }
            
        }

        // Define handler for mouse click
        const handleMouseClick = (selRect, relStage, relTr) => {

            return function (e) {
                // if we are selecting with rect, do nothing
                if (selRect.visible()) {
                    return;
                }

                // if click on empty area - remove all selections
                if (e.target === relStage) {
                    relTr.nodes([]);
                    return;
                }

                // do nothing if clicked NOT on our rectangles
                if (!e.target.hasName('selectable')) {
                    console.log("Does not have .selectable")
                    return;
                }


                console.log("Event target:")
                console.log(e.target);

                // do we pressed shift or ctrl?
                const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
                const isSelected = relTr.nodes().indexOf(e.target) >= 0;

                if (!metaPressed && !isSelected) {
                // if no key pressed and the node is not selected
                // select just one
                relTr.nodes([e.target]);
                } else if (metaPressed && isSelected) {
                    // if we pressed keys and node was selected
                    // we need to remove it from selection:
                    const nodes = relTr.nodes().slice(); // use slice to have new copy of array
                    // remove node from array
                    nodes.splice(nodes.indexOf(e.target), 1);
                        relTr.nodes(nodes);
                    } else if (metaPressed && !isSelected) {
                    // add the node into selection
                    const nodes = relTr.nodes().concat([e.target]);
                    relTr.nodes(nodes);
                }
            }
            
            
        }

        // Attach handlers to both stages
        stage.on('mousedown touchstart', handleMouseDown(selectionRectangle));
        stage.on('mouseup touchend', handleMouseUp(selectionRectangle, stage, tr));
        stage.on('click tap', handleMouseClick(selectionRectangle, stage, tr));
        
        stage2.on('mousedown touchstart', handleMouseDown(selectionRectangle2));
        stage.on('mouseup touchend', handleMouseUp(selectionRectangle2, stage2, tr2)); 
        stage.on('click tap', handleMouseUp(selectionRectangle2, stage2, tr2)); 

    //#endregion ...............................................................

    // Respond to canvas
    


});



/* ---------------------------------------------------------------------- *\
| User clicks "Add Image" button                                           |
\* ---------------------------------------------------------------------- */

$("#add-image").on("click", () => {

    //#region ..............................................................

        console.log("Add the rooster!");

        // Path to image to add
        const pathToImage = "/img/rooster.jpg"

        Konva.Image.fromURL(pathToImage , (imgNode) => {

            console.log(isFront ? "Adding to Front" : "Adding to Back");

            // Get the currently visible canvas
            var thisStage = isFront ? stage : stage2;
            var thisLayer = isFront ? layer : layer2;
            var thisTr = isFront ? tr : tr2;

            var cnvWidth = thisStage.width();
            var scaleTo = cnvWidth / 2;
            var imgWidth = imgNode.width();
            var scaleFactor = scaleTo / imgWidth;

            imgNode.setAttrs({
                x: 0,
                y: 0,
                scaleX: scaleFactor,
                scaleY: scaleFactor,
                draggable: true,
                name:"selectable",
            });

            // Add the Image Node to the Layer
            thisLayer.add(imgNode);
            imgNode.moveToTop();

            // Add the image to the Transformer
            thisTr.nodes([imgNode])

            // Draw the layer
            thisLayer.draw();

        })

    //#endregion ...........................................................

});

/* ---------------------------------------------------------------------- *\
| User toggles "Show Back" / "Show Front"                                  |
\* ---------------------------------------------------------------------- */

$("#toggle-frontback").on("click", () => {

    //#region ..............................................................

    isFront ? $("#back").show() : $("#back").hide();
    isFront ? $("#front").hide() : $("#front").show();

    isFront ? $("#toggle-frontback")
                .text("Show Front") :
              $("#toggle-frontback")
                .text("Show Back");

    isFront = !isFront;

    //#endregion ...........................................................

})




/* ---------------------------------------------------------------------- *\
| User clicks "Make Artwork" button                                        |
\* ---------------------------------------------------------------------- */

$(document).on("click", "#files", () => {

    //#region ..............................................................

        // Show loading screen
        $("#wait").css("display", "flex"); 

        console.log("Let's make all of the files...")

        // Hide the guides first...
        hideGuides();

        // Gets sent to the server to be processed
        let sendToBack = [];

        /**
         * If images exist on canvas, build object and add to []sendToBack
         * @param {Stage} thisStage Stage to be processed
         * @param {Layer} thisLayer Konva Layer to be processed
         */
        function processStage(thisStage, thisLayer) {

            // Show both while this process takes place
            const displayFront = $("#front").css("display");
            const displayBack = $("#back").css("display");
            $("#front, #back").show();

            // Only returns objects of class "Image"
            const layerImages = thisLayer.getChildren((node) => {
                return node.getClassName() === "Image"
            })

            // Only process if stage contains at least 1 image
            if (layerImages.length > 0) {

                const containerElem = thisStage.container();
                const parentElem = thisStage.container().parentElement;
                const imgElem = $(parentElem).children('img')[0];


                //  Get the PNG file as dataURL
                const dataURL = thisStage.toDataURL({ pixelRatio: 15 });

                // Get what image is being used
                const imgFile = $(imgElem).attr("src");
                const imgWidth = $(imgElem).prop("width");
                const imgNatWidth = $(imgElem).prop("naturalWidth");

                console.log(
                    "Image Elem", imgElem, 
                    "Image Natural Width", imgNatWidth,
                    "Image Width", imgWidth
                )


                // Width of the canvas as it should appear on top of shirt
                finalCanvas = (300 * imgNatWidth) / imgWidth;
                // Scale of 4677px to equal final canvas width
                const s = finalCanvas / 4677

                // Get the scale of the shirt's visible width and natural width

                // console.log(imgNatWidth, imgWidth)
                const xScale =  imgNatWidth / imgWidth


                // x and y coordinate of canvas on shirt 
                let [x, y] = [
                        $(containerElem).css("left").replace("px", ""),
                        $(containerElem).css("top").replace("px", "")
                    ]

                // console.log(x, y, xScale)

                // Multiply by scale of original image to current image size 
                x = Number(x) * xScale
                y = Number(y) * xScale
                

                // Get the rgb of the shirt
                let rgb = $("#shirt-color option:selected").val();



                // Make object to send to back end
                const obj =  {
                    dataURL:dataURL,
                    imgFile: imgFile,
                    x: Math.round(x),
                    y: Math.round(y),
                    s: s,
                    rgb: rgb,
                }

                sendToBack.push(obj)
            }

            // Reset canvas visibility
            $("#front").css("display", displayFront);
            $("#back").css("display", displayBack);


            
        }


        processStage(stage, layer);
        processStage(stage2, layer2);

        console.log(sendToBack) 

        /* ---------------------------------------------------------------------- *\
        | Send Data to API                                                         |
        \* ---------------------------------------------------------------------- */

        if (sendToBack.length === 0) {
            alert("You must add something to one of the canvases to continue.");
            $("#wait").css("display", "none");
            showGuides();
            throw new Error("No objects found on canvases");
        }

        say("Downloading the shirt image...")
        $.post("/download-image", { data:sendToBack })
            .then(() => {
                console.log("Creating the Canvas file...")
                say("Creating the canvas file...") 
                return $.post("/canvas-file", { data:sendToBack })
            })
            .then(() => {
                console.log("Making the thumbnails...")
                say("Making the thumbnails...") 
                return $.post("/python", { data:sendToBack })
            })
            .then(() => {
                console.log("Making the PDF file...");
                say("Making the PDF file...")
                return $.post("/make-pdf", { data:sendToBack });
            })
            .then(() => {

                console.log("Triggering print file production.")

                // Release browser back to user.
                $("#wait").css("display", "none");
                showGuides();

                // Show the thumbnail, link to the PDF
                let d = new Date();

                // $("#thumb-area").empty();

                sendToBack.forEach((obj, i) => {
                    $("#thumbs").empty().append(`
                        <img class="thumbs" id="thumb" src="thumbs/${i}-proof.png?${d.getTime()}" /><br />
                    `)
                })

                $("#download").remove()
                $("#thumb-area").append(`
                    <a id="download" href="thumbs/proof.pdf" download>Download PDF</a>
                `)

                // !! Comment Me
                $("#print-file-text").text("Making the print file...")
                    .css("color", "crimson")

                return $.post("/make-prints", { data:sendToBack })

            })
            .then(() => {
                console.log("Print file has been made.")

                // !! Comment Me
                $("#print-file-text").text("Print file has been made.")
                    .css("color", "mediumseagreen")
                
            })
        
        // Show loading screen
        // $("#wait").css("display", "none");  
               
        showGuides();

    //#endregion ...........................................................

})



/* ---------------------------------------------------------------------- *\
| "Make Artwork" helper functions                                          |
\* ---------------------------------------------------------------------- */

//#region ..............................................................

    // Useful for logging to the loading screen
    function say(what) {
        $("#loading-message").text(what);
    }

    function hideGuides() {
        tr.hide();  tr2.hide(); // Hide transformers
    }

    function showGuides() {
        tr.show();  tr2.show(); // Show transformers 
    }

//#endregion ...........................................................


// User changes the shirt color
$("#shirt-color").change(function () {
    var col = this.value;
    $(".img").css("background-color", `rgb(${col})`);
});



/* ---------------------------------------------------------------------- *\
| User clicks "Talk to Server"                                             |
\* ---------------------------------------------------------------------- */
$("#talk").on("click", () => {
    fetch("/hello")
        .then( (response) => response.json() )
        .then( (responseJson) => $("#response")
                                        .slideDown("fast")
                                        .text(responseJson.message) )
})