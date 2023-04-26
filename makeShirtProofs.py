# https://www.geeksforgeeks.org/overlay-an-image-on-another-image-in-python/

from PIL import Image  # For image processing
import sys  # For accepting arguments


# Arguments
shirtFile = sys.argv[1]  # Path to the thumbnail of the shirt from editor
artFile = sys.argv[2]  # Path to the full-size output from the canvas
outFile = sys.argv[3]  # Path to the final proof PNG thumbnail
x = int(sys.argv[4])  # Number of pixels from the left of the shirt to position the art
y = int(sys.argv[5])  # Number of pixels from the top of the shirt to position the art
s = float(sys.argv[6])  # Scale of the image in relation to the shirt
bgColor = sys.argv[7].split(",")  # RGB of shirt's color (ex: 255,255,255)

# Load in the images
bufShirtFile = Image.open(shirtFile)
bufArtFile = Image.open(artFile)

# RGB Color
r = int(bgColor[0])
g = int(bgColor[1])
b = int(bgColor[2])

# Background color image
bgImage = Image.new("RGB", bufShirtFile.size, (r, g, b))

# Scale the art file from the canvas to match the size of the shirt thumbnail
scaleX = int(bufArtFile.width * s)
scaleY = int(bufArtFile.height * s)
bufArtFile = bufArtFile.resize((scaleX, scaleY))

# Put the shirt image on top of the color image
bgImage.paste(bufShirtFile, (0, 0), mask=bufShirtFile)
# Put the art image on top of the shirt image
bgImage.paste(bufArtFile, (x, y), mask=bufArtFile)

bgImage.save(outFile)  # Save the PNG
# bgImage.save(pdfFile)  # Save the PDF



