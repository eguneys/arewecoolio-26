#version 300 es
precision highp float;

in vec2 v_tex_coord;
uniform sampler2D u_texture;

out vec4 out_color;

void main() {
   vec4 out = vec3(1.0, 1.0, 0.0, 1.0);

   out_color = out;
}