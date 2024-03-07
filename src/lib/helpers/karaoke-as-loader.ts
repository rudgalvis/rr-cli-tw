import chalkAnimation from "chalk-animation";
import {wait} from "./wait.js";

export const karaokeAsLoader = (text: string) => {
    const animation = chalkAnimation.karaoke(text)

    const stop = async () => {
        animation.f = animation.text[0].length + 10
        await wait(50)

        animation.stop()
    }

    return {animation, stop}
}