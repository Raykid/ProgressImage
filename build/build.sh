tsc ../src/utils/ProgressImage.ts --outFile ../dist/progress_image.js --sourceMap --target es5
uglifyjs ../dist/progress_image.js -o ../dist/progress_image.min.js
