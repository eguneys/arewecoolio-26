import default_vert from './default.vert'
import default_frag from './default.frag'

export type GL = {
    canvas: HTMLCanvasElement
}

export function GL(w: number, h: number): GL {
    let c = document.createElement('canvas')
    c.width = w
    c.height = h
    let gl =c.getContext('webgl2')!


    gl.clearColor(255, 255, 0, 255)
    gl.clear(gl.COLOR_BUFFER_BIT)

    let ll = with_layer(gl)

    ll.render_screen()

    return {
        canvas: c
    }
}

type WithLayer = {
    create_layer(): void,
    render_screen(): void
}

function with_layer(gl: WebGL2RenderingContext): WithLayer {

    let program = gl.createProgram()


    let vertexShader = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vertexShader, default_vert)
    gl.compileShader(vertexShader)

    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fragmentShader, default_frag)
    gl.compileShader(fragmentShader)

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    let layerTextures: WebGLTexture[] = []

    create_layer()

    function create_layer() {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set texture parameters (e.g., wrapping, filtering)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Create a framebuffer to render to the texture
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        // Render to the texture (using your drawing logic)
        // ... (Your drawing code here, e.g., using gl.drawArrays() or gl.drawElements())

        // Unbind framebuffer and texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        layerTextures.push(texture);

    }

    const quad_vertices = [
        -1, -1, 0.0, 0.0,
        1, -1, 1.0, 0.0,
        -1, 1, 0.0, 1.0,
        1, 1, 1.0, 1.0
    ];

    const vertex_buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad_vertices), gl.STATIC_DRAW);

    const position_attr_loc = gl.getAttribLocation(program, 'a_position')
    const tex_coord_attr_loc = gl.getAttribLocation(program, 'a_tex_coord')

    gl.enableVertexAttribArray(position_attr_loc)
    gl.enableVertexAttribArray(tex_coord_attr_loc)

    gl.vertexAttribPointer(
        tex_coord_attr_loc,
        2,
        gl.FLOAT,
        false,
        4 * 4,
        2 * 4
    )


    gl.vertexAttribPointer(
        position_attr_loc,
        2,
        gl.FLOAT,
        false,
        4 * 4,
        0
    )



    function render_screen() {

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        for (let i = 0; i < layerTextures.length; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, layerTextures[i]);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
    }

    return {
        create_layer,
        render_screen
    }
}