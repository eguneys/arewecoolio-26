#version 300 es
precision highp float;
precision highp sampler2DArray;

uniform sampler2DArray u_textures;

flat in int v_tex_idx;
in vec2 v_tex_coord;

out vec4 out_color;

void main() {
   vec4 o = texture(u_textures, vec3(v_tex_coord.xy, v_tex_idx));

   out_color = o;
}