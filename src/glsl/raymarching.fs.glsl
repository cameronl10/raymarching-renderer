uniform vec3 resolution;
uniform float time;
uniform vec3 camPos;
uniform mat3 camMat;     
uniform float sceneIndex; 
#define MAX_STEPS 500
#define MAX_DIST 50.
#define HIT_DIST .001



float sdSphere(vec3 p, float r){
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b){
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// see iquilezles.org/articles/mandelbulb
float sdMandelbulb(vec3 p){
    vec3 w = p;
    float m = dot(w,w);
    float dz = 1.0;
    float power = 8.0;

    for(int i = 0; i < 16; i++){
        dz = power * pow(m, (power - 1.0) * 0.5) * dz + 1.0;

        float r = length(w);
        float b = power * acos(clamp(w.y / r, -1.0, 1.0));
        float a = power * atan(w.x, w.z);
        w = p + pow(r, power) * vec3(sin(b) * sin(a), cos(b), sin(b) * cos(a));

        m = dot(w, w);
        if (m > 256.0) break;
    }

    return 0.25 * log(m) * sqrt(m) / dz;
}

float sdMengerSponge(vec3 p){
    float d = sdBox(p, vec3(1.0));

    float s = 1.0;
    for(int m = 0; m < 12; m++){
        vec3 a = mod(p*s, 2.0) - 1.0;
        s *= 3.0;
        vec3 r = abs(1.0 - 3.0*abs(a));

        float da = max(r.x,r.y);
        float db = max(r.y,r.z);
        float dc = max(r.z,r.x);
        float c = (min(da,min(db,dc)) - 1.0) / s;

        d = max(d, c);
    }
    return d;
}

float GetDist(vec3 p){
    float planeDist = p.y + 1.3;
    float shapeDist;

    if (sceneIndex < 0.5) {
        shapeDist = sdSphere(p - vec3(0,-0.3,0), 1.0);
    } else if (sceneIndex < 1.5) {
        shapeDist = sdMandelbulb(p);
    } else if (sceneIndex < 2.5) {
        shapeDist = sdBox(p - vec3(0,-0.3,0), vec3(0.8));
    } else {
        shapeDist = sdMengerSponge(p - vec3(0,-0.3,0));
    }

    return min(shapeDist, planeDist);
}
/*
take the dot(light,normal) 
to get normal take the tangent approx of a curve
*/
vec3 GetNormal(vec3 p){
    float d = GetDist(p);
    vec2 e = vec2(.001,0);

    vec3 n = vec3(
        GetDist(p + e.xyy) - GetDist(p - e.xyy),
        GetDist(p + e.yxy) - GetDist(p - e.yxy),
        GetDist(p + e.yyx) - GetDist(p - e.yyx)
    );
    return normalize(n);
}
float GetLight(vec3 p){
    vec3 lightPos = vec3(2,3,2);
    vec3 l = normalize(lightPos - p);
    vec3 n = GetNormal(p);

    return dot(n,l);
}
/*
ray marching algorithim:
keep stepping through the space, when we hit some function we can keep marching.
*/
float rayMarch(vec3 rayOrigin, vec3 directionVector){
    float dO = 0.0;
    for(int i = 0; i < MAX_STEPS; i++){
        vec3 p = rayOrigin + dO*directionVector;
        float sceneDist = GetDist(p);
        if(sceneDist < HIT_DIST){
            break;
        }
        dO += sceneDist * 0.9; 
        if(dO > MAX_DIST){
            break;
        }
    }
    return dO;
}
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y;

    vec3 rayOrigin = camPos;
    
    vec3 directionVector = camMat * normalize(vec3(uv, 1.3));

    float d = rayMarch(rayOrigin, directionVector);

    vec3 col = vec3(0.02,0.02,0.03);
    if (d < MAX_DIST) {
        vec3 p = rayOrigin + d * directionVector;
        vec3 n = GetNormal(p);
        vec3 lightDir = normalize(vec3(1.0, 2.0, 3.0));
        float diff = max(dot(n, lightDir), 0.0);
        vec3 base = 0.5 + 0.5*cos(6.2831*(vec3(0.6,0.5,0.4) + p.x*0.15 + p.y*0.1));
        col = base * (diff*0.9 + 0.15);
    }

    col = pow(col, vec3(0.3)); // gamma correct
    gl_FragColor = vec4(col, 1.0);
}
