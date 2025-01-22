export type Canvas2D = {
    canvas: HTMLCanvasElement,
    lines(lines: XY[], width: number): void
}

export type XY = { x: number, y: number }

export function Canvas2D(w: number, h: number) {

    let canvas = document.createElement('canvas')
    canvas.width = w;
    canvas.height = h
    let cx = canvas.getContext('2d')!



    return {
        canvas,
        lines(l: XY[], width: number) {
            cx.lineWidth = width
            let l0 = l[0]

            if (!l0) {
                return
            }
            cx.beginPath()
            
            cx.moveTo(l0.x, l0.y)

            for (let lx of l.slice(1)) {
                cx.lineTo(lx.x, lx.y)
            }
            cx.stroke()
        }
    }
}