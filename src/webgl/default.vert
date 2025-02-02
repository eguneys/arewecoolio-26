#version 300 es

in vec2 a_position;
in vec2 a_tex_coord;

out vec2 v_tex_coord;
flat out int v_tex_idx;

void main() {
    v_tex_idx = gl_InstanceID;
    v_tex_coord = a_tex_coord;

    gl_Position = vec4(a_position, 0.0, 1.0);
}