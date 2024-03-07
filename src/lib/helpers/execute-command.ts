import {exec} from "child_process";

export const executeCommand = async (command: string) => new Promise((res,rej) => {
    exec(command, (error, stdout) => {
        if (error) {
            const message = `error: ${error}`

            console.error(message);
            rej(message)
            return;
        }
        res(stdout)
    });
})