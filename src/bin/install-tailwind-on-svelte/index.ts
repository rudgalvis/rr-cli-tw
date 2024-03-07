#!/usr/bin/env node

import chalkAnimation from 'chalk-animation';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {wait} from "../../lib/helpers/wait.js";
import {karaokeAsLoader} from "../../lib/helpers/karaoke-as-loader.js";
import path from "path";
import {executeCommand} from "../../lib/helpers/execute-command.js";
import * as fs from "fs";
import {br} from "../../lib/helpers/br.js";

const DIR_THIS = path.dirname(new URL(import.meta.url).pathname)
const DIR_USER = process.cwd()
let cssFile: string

const sameDirExit = async (stop?: () => Promise<void>) => {
    if (DIR_THIS.includes(DIR_USER)) {
        if (stop) await stop()

        console.log(chalk.bgYellow(
            `You are probably debugging lib, because you running this command in lib\'s directory. 
This command is intended to be run in SvelteKit project root directory.`
        ))

        return true
    }

    return false
}

const welcome = async () => {
    console.clear()
    const animation = chalkAnimation.karaoke(`Hello, this is Tailwind to SvelteKit installer!`)
    await wait(3000)
    animation.stop()
}

const askToProceed = async () => {
    console.log(
        `You have to be in the root of your SvelteKit project to proceed.`
    )

    const answer = await inquirer.prompt({
        type: 'confirm',
        name: 'proceed',
        message: 'Do you want to proceed?',
        default: 'Y'
    })

    return answer.proceed
}

const installTailwind = async () => {
    const process = async () => {
        await executeCommand('npm install -D tailwindcss postcss autoprefixer')
        await executeCommand('npx tailwindcss init -p')
    }
    const {stop} = karaokeAsLoader(`Installing Tailwind...`)

    if (await sameDirExit(stop)) return

    await process()
    await stop()

    console.log(chalk.bgGreen('Tailwind installed!'))
}

const configureTemplatePaths = async () => {
    const {stop} = karaokeAsLoader(`Configure your template path...`)

    if (await sameDirExit()) return

    fs.copyFileSync(`${DIR_THIS}/tailwind.config.example.js`, `${DIR_USER}/tailwind.config.js`)
    await stop()

    console.log(chalk.bgGreen('Path configured'))
}

const addDirectives = async () => {
    const {stop} = karaokeAsLoader(`Adding css directives...`)

    if (await sameDirExit(stop)) return

    const files = ['app.css', 'app.scss']
    let prependStatus: 'added' | 'ignored' | undefined = undefined

    const prependContent =
        `@tailwind base;
@tailwind components; 
@tailwind utilities;
`

    await stop()

    files.forEach(file => {
        if (prependStatus) return

        if (fs.existsSync(`${DIR_USER}/src/${file}`)) {
            cssFile = file
            const contents = fs.readFileSync(`${DIR_USER}/src/${file}`, 'utf8')

            if (contents.includes(prependContent)) {
                console.log(chalk.bgYellow('Directives already written'))

                prependStatus = 'ignored'

                return
            }

            fs.appendFileSync(`${DIR_USER}/src/${file}`, prependContent)
            prependStatus = 'added'
        }
    })

    if (!prependStatus) {
        fs.writeFileSync(`${DIR_USER}/src/app.css`, prependContent)
        console.log(chalk.bgGreen('Directives written'))
    }

}

const importCss = async () => {
    const {stop} = karaokeAsLoader(`Importing css to layout...`)

    if (await sameDirExit(stop)) return

    const layoutPath = `${DIR_USER}/src/routes/+layout.svelte`
    const includeContent = `import "../${cssFile}";`
    const fullFile = `<script>
  import "../${cssFile}";
</script>

<slot />
`

    if (fs.existsSync(layoutPath)) {
        const contents = fs.readFileSync(layoutPath, 'utf8')

        await stop()

        if (contents.includes(includeContent)) {
            console.log(chalk.bgYellow('Css import already there'))
        } else {
            console.log(chalk.bgRed(`Do css import manually as layout already exists. Add this line to ${includeContent}:`))
        }
    } else {
        fs.writeFileSync(layoutPath, fullFile)
        await stop()
        console.log(chalk.bgGreen('Css imported'))
    }
}

/* Compile chain of commands */
await welcome()
if(await askToProceed()) {
    await installTailwind()
    br()
    await configureTemplatePaths()
    br()
    await addDirectives()
    br()
    await importCss()
    br()
}