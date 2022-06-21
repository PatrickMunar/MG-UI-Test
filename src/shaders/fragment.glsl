uniform sampler2D uTexture;
uniform float uAlpha;
uniform vec2 uOffset;
uniform float uRedact;

varying vec2 vUv;

vec3 rgbShift(sampler2D textureimage, vec2 uv, vec2 offset){
    float r = texture2D(textureimage, uv + offset * 0.05).r;
    vec2 gb = texture2D(textureimage, uv - offset * 0.05).gb;
    return vec3(r, gb);
}

void main(){
   float strength = step(uRedact, mod(vUv.x, 1.1));
    vec2 newUOffset = vec2(
            uOffset.x,
            uOffset.y * 5.0
        );
    vec3 color = rgbShift(uTexture, vUv, newUOffset);
    gl_FragColor = vec4(color * strength, 1.0);
}