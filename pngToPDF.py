import sys
from PIL import Image

file1 = sys.argv[1]
file2 = sys.argv[2]
outFile = sys.argv[3]

im1 = Image.open(file1)
imgs = []

if file2 != "":
    im2 = Image.open(file2)
    imgs.append(im2)

im1.save(outFile, save_all=True, append_images=imgs)
