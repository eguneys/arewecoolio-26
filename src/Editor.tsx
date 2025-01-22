import { For, onMount } from "solid-js"
import './Editor.scss'
import { Canvas2D } from "./canvas2d/canvas2d"

export default () => {

    const colors = [
        '#1a1c2c',
        '#5d275d',
        '#b13e53',
        '#ef7d57',
        '#ffcd75',
        '#a7f070',
        '#38b764',
        '#257179',
        '#29366f',
        '#3b5dc9',
        '#41a6f6',
        '#73eff7',
        '#f4f4f4',
        '#94b0c2',
        '#566c86',
        '#333c57',
    ]


    return (<>
    <div class='editor'>
        <div class='tools'>
            <span class='tool'>Pen (q)</span>
            <span class='tool'>Eraser (e)</span>
        </div>
        <div class='colors'>
            <For each={colors}>{color =>
                    <span class='color' style={`background: ${color}`}></span>
                }</For>
        </div>
        <div class='canvas-wrap'>
            <Canvas/>
        </div>
        <div class='timeline'>

        </div>
    </div>
    </>)
}


const Canvas = () => {

    let $el_canvas: HTMLElement

    let ground: PaintGround

    onMount(() => {
        ground = PaintGround()

        $el_canvas.appendChild(ground.canvas)
        ground.set_bounds()

    })

    return (<>
    <div ref={_ => $el_canvas = _} class='canvas'>

    </div>
    </>)
}

export type PaintGround = {
    canvas: HTMLCanvasElement,
    set_bounds: () => void
}

type XY = { x: number, y: number }


export const PaintGround = (): PaintGround => {

    let gl = Canvas2D(1920, 1080)
    let canvas = gl.canvas

    let bounds: DOMRect

    function set_bounds() {
        bounds = canvas.getBoundingClientRect()
    }
    set_bounds()

    canvas.addEventListener('resize', set_bounds)
    document.addEventListener('scroll', set_bounds)

    canvas.addEventListener('mousedown', on_mouse_down)
    canvas.addEventListener('mousemove', on_mouse_move)
    canvas.addEventListener('wheel', on_wheel)

    document.addEventListener('mouseup', on_mouse_up)

    canvas.addEventListener('contextmenu', on_context_menu)


    let e_contextmenu: XY
    let e_mousemove: XY
    let e_mouseup: XY
    let e_mousedown: XY

    function e_position(e: MouseEvent): XY {
        let res = [e.clientX, e.clientY]
        return { x: (res[0] - bounds.left) / bounds.width, y: (res[1] - bounds.top) / bounds.height }
    }

    function on_context_menu(e: MouseEvent) {
        e.preventDefault()
        e_contextmenu = e_position(e)
    }

    function on_wheel(e: WheelEvent) {
        e.preventDefault()
        //console.log(e.deltaY)
    }

    function on_mouse_down(e: MouseEvent) {
        e.preventDefault()
        e_mousedown = e_position(e)
    }

    function on_mouse_up(e: MouseEvent) {
        e.preventDefault()
        e_mouseup = e_position(e)
    }

    function on_mouse_move(e: MouseEvent) {
        e.preventDefault()
        e_mousemove = e_position(e)
    }

    let cursor: XY[] = []

    function step() {

        if (e_mousemove) {
            let x = e_mousemove.x * 1920
            let y = e_mousemove.y * 1080
            cursor.push({x, y})
        }


        let cc: XY[] = []
        if (cursor.length > 4) {
            cc = fit_spline(cursor, 8)

        }

        gl.lines(cc, 8)
        requestAnimationFrame(step)
    }
    requestAnimationFrame(step)


    return {
        canvas,
        set_bounds
    }
}

function fit_spline(points: XY[], spacing: number) {
    let res = []
    for (let i = 1; i < points.length - 2; i++) {
        const p0 = points[i - 1]
        const p1 = points[i]
        const p2 = points[i + 1]
        const p3 = points[i + 2]

        for (let t = 0; t < 1; t += spacing / distance(p1, p2)) {
            const x = catmullRom(t, p0.x, p1.x, p2.x, p3.x)
            const y = catmullRom(t, p0.y, p1.y, p2.y, p3.y)
            res.push({x, y})
        }
    }
    return res
}


function catmullRom(t: number, p0: number, p1: number, p2: number, p3: number) {
    return (
        0.5 *
        ((2 * p1) +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
    );
}

function distance(p1: XY, p2: XY) {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}
