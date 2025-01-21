import default_vert from './default.vert'
import default_frag from './default.frag'
import layer_frag from './layer.frag'

export type GL = {
    canvas: HTMLCanvasElement,
    render_to_layer: () => void,
    render_to_screen: () => void,
}

export function GL(w: number, h: number): GL {
    let canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    let gl =canvas.getContext('webgl2')!


    gl.clearColor(255, 255, 255, 255)
    gl.clear(gl.COLOR_BUFFER_BIT)

    let screen_program = gl_program(default_vert, default_frag)
    let layer_program = gl_program(default_vert, layer_frag)


    const layerCount = 16

    const textureArray = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, textureArray)

    gl.texImage3D(
        gl.TEXTURE_2D_ARRAY,
        0,
        gl.RGBA8,
        w, h,
        layerCount,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null)

    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)


    const screenVao = gl.createVertexArray()
    gl.bindVertexArray(screenVao)

    const quad_vertices = [
        -1, -1, 0.0, 0.0,
        1, -1, 1.0, 0.0,
        -1, 1, 0.0, 1.0,
        1, 1, 1.0, 1.0
    ];

    const vertex_buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad_vertices), gl.STATIC_DRAW);

    const position_attr_loc = gl.getAttribLocation(screen_program, 'a_position')
    const tex_coord_attr_loc = gl.getAttribLocation(screen_program, 'a_tex_coord')

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

    gl.bindVertexArray(null)


    //const layerVao = gl.createVertexArray()
    //gl.bindVertexArray(layerVao)
    //gl.bindVertexArray(null)
    let layerVao = screenVao

    const u_textures_loc = gl.getUniformLocation(screen_program, 'u_textures')

    gl.useProgram(screen_program)
    gl.uniform1i(u_textures_loc, 0)

    let framebuffer = gl.createFramebuffer()


    function render_to_layer() {

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
        for (let i = 0; i < layerCount; i++) {

            gl.framebufferTextureLayer(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                textureArray,
                0,
                i
            )

            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                console.error('Framebuffer not complete for layer:' + i)
            }


            gl.clearColor(0.0, 0.0, 0.0, 1.0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            gl.useProgram(layer_program)
            gl.bindVertexArray(layerVao)

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    }

    function render_to_screen() {

        gl.useProgram(screen_program)

        gl.bindVertexArray(screenVao)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, textureArray)


        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, layerCount);
    }

    render_to_layer()
    render_to_screen()

    return {
        canvas,
        render_to_layer,
        render_to_screen
    }


    function gl_program(v_source: string, f_source: string) {
        let program = gl.createProgram()


        let vertexShader = gl.createShader(gl.VERTEX_SHADER)!
        gl.shaderSource(vertexShader, v_source)
        gl.compileShader(vertexShader)

        let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!
        gl.shaderSource(fragmentShader, f_source)
        gl.compileShader(fragmentShader)

        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            logProgramError(gl, program, vertexShader, fragmentShader);
        }

        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)

        return program
    }

}


/**
 * will log a shader error highlighting the lines with the error
 * also will add numbers along the side.
 * @param gl - the WebGLContext
 * @param shader - the shader to log errors for
 */
function logPrettyShaderError(gl: WebGLRenderingContext, shader: WebGLShader): void
{
    const shaderSrc = gl.getShaderSource(shader)!
        .split('\n')
        .map((line, index) => `${index}: ${line}`);

    const shaderLog = gl.getShaderInfoLog(shader)!;
    const splitShader = shaderLog.split('\n');

    const dedupe: Record<number, boolean> = {};

    const lineNumbers = splitShader.map((line) => parseFloat(line.replace(/^ERROR\: 0\:([\d]+)\:.*$/, '$1')))
        .filter((n) =>
        {
            if (n && !dedupe[n])
            {
                dedupe[n] = true;

                return true;
            }

            return false;
        });

    const logArgs = [''];

    lineNumbers.forEach((number) =>
    {
        shaderSrc[number - 1] = `%c${shaderSrc[number - 1]}%c`;
        logArgs.push('background: #FF0000; color:#FFFFFF; font-size: 10px', 'font-size: 10px');
    });

    const fragmentSourceToLog = shaderSrc
        .join('\n');

    logArgs[0] = fragmentSourceToLog;

    console.error(shaderLog);

    // eslint-disable-next-line no-console
    console.groupCollapsed('click to view full shader code');
    console.warn(...logArgs);
    // eslint-disable-next-line no-console
    console.groupEnd();
}

/**
 *
 * logs out any program errors
 * @param gl - The current WebGL context
 * @param program - the WebGL program to display errors for
 * @param vertexShader  - the fragment WebGL shader program
 * @param fragmentShader - the vertex WebGL shader program
 * @private
 */
export function logProgramError(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
): void
{
    // if linking fails, then log and cleanup
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        {
            logPrettyShaderError(gl, vertexShader);
        }

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        {
            logPrettyShaderError(gl, fragmentShader);
        }

        console.error('PixiJS Error: Could not initialize shader.');

        // if there is a program info log, log it
        if (gl.getProgramInfoLog(program) !== '')
        {
            console.warn('PixiJS Warning: gl.getProgramInfoLog()', gl.getProgramInfoLog(program));
        }
    }
}