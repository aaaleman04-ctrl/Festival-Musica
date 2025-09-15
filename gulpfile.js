import path from 'path'
import fs from 'fs'
import {glob} from 'glob'
//extraer donde compilarlo
//series 
import { src, dest, watch, series } from "gulp";
//importar sass
import * as dartSass from "sass";
//importar la dependencia
import gulpSass from "gulp-sass";

const sass = gulpSass(dartSass);

import terser from 'gulp-terser'
import sharp from 'sharp'

export function js( done ){

  src('src/js/app.js')
  .pipe(terser())
  .pipe(dest('build/js'))

  done()
}

//tarea
export function css(done) {
    //esto lo puede hacer en vez de poner en scripts en el package.json
  src('src/scss/app.scss', {sourcemaps: true}) //ubicar el archivo
    .pipe( sass({
      outputStyle: 'compressed'
    }).on('erorr', sass.logError) ) //no es necesario que tengan, pero en este caso queremos buscarlo y luego compilarlos y guardarlo
    .pipe( dest('build/css', {sourcemaps: true}) ) //donde ponemos sourcemaps es para cuando inspeccionas en el navegador te aparezca el archico sccs que se encuentra dicho elemento y no en el app.css

  done(); //para que finalice la funcion
}

//codigo de node.js
//crear imagenes mas pequenas
export async function crop(done) {
    const inputFolder = 'src/img/gallery/full'
    const outputFolder = 'src/img/gallery/thumb';
    const width = 250;
    const height = 180;
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true })
    }
    const images = fs.readdirSync(inputFolder).filter(file => {
        return /\.(jpg)$/i.test(path.extname(file));
    });
    try {
        images.forEach(file => {
            const inputFile = path.join(inputFolder, file)
            const outputFile = path.join(outputFolder, file)
            sharp(inputFile) 
                .resize(width, height, {
                    position: 'centre'
                })
                .toFile(outputFile)
        });

        done()
    } catch (error) {
        console.log(error)
    }
}

//crear imagenes webp
export async function imagenes(done) {
    const srcDir = './src/img';
    const buildDir = './build/img';
    const images =  await glob('./src/img/**/*{jpg,png}')

    images.forEach(file => {
        const relativePath = path.relative(srcDir, path.dirname(file));
        const outputSubDir = path.join(buildDir, relativePath);
        procesarImagenes(file, outputSubDir);
    });
    done();
}

function procesarImagenes(file, outputSubDir) {
    if (!fs.existsSync(outputSubDir)) {
        fs.mkdirSync(outputSubDir, { recursive: true })
    }
    const baseName = path.basename(file, path.extname(file))
    const extName = path.extname(file)
    const outputFile = path.join(outputSubDir, `${baseName}${extName}`)
    const outputFileWebp = path.join(outputSubDir, `${baseName}.webp`)
    const outputFileAvif = path.join(outputSubDir, `${baseName}.avif`)

    const options = { quality: 80 }
    sharp(file).jpeg(options).toFile(outputFile)
    sharp(file).webp(options).toFile(outputFileWebp)
    sharp(file).avif().toFile(outputFileAvif)
}

//para ir viendo los cambios en vivo
export function dev() {
watch('src/scss/**/*.scss', css) //para buscar todos los archivos que tengan el scss y sean mostrados en el css
watch('src/js/**/*.js', js)
watch('src/img/**/*.{png,jpg', imagenes)
}

//Gulp soporta busqueda por un patron

//diferentes tareas que tienes en el gulpfile con series
export default series(crop, js, css, imagenes, dev)
//y con parallels es lo mismo solo que arrancan todas las tareas al mismo tiempo