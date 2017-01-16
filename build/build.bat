@echo off
call tsc ../src/utils/ProgressImage.ts --outFile ../dist/progress_image.js --sourceMap --target es5
call uglifyjs ../dist/progress_image.js -o ../dist/progress_image.min.js