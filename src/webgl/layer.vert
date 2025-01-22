#version 300 es

in vec2 a_position;
in vec2 a_offset;

in float a_size;

uniform vec2 u_resolution;

out vec2 v_circle_coord;

void main() {

    vec2 aspect_x = vec2(u_resolution.x / u_resolution.y, 1.0);
    
    vec2 position = a_position / u_resolution * 2.0 - 1.0;
    
    
    vec2 adjusted_offset = a_offset / aspect_x;

    vec2 quad_corner = adjusted_offset * a_size * aspect_x / u_resolution;

    vec2 final_position = position + quad_corner;

    gl_Position = vec4(final_position, 0.0, 1.0);

    v_circle_coord = a_offset;
}