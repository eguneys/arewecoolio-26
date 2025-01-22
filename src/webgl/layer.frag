#version 300 es
precision highp float;

uniform vec2 u_resolution;
in vec2 v_circle_coord;

out vec4 out_color;


void main() {
   vec2 aspect = vec2(u_resolution.y / u_resolution.x, 1.0);
   float dist = length(v_circle_coord * aspect);

   if (dist > 0.25) {
      //discard;
   }

   out_color = vec4(1.0, 0.0, 0.0, 1.0);
}