let walls = [];
let ray;
let particle;

let wallCount = 25;  // Aumentar el número de paredes
let rayCount = 0.25;    // Cantidad de rayos, puede ser 0-1 para ver el efecto más claro

let notes = []; // Array to hold notes of the selected scale
let oscillators = []; // Array to hold p5.js oscillators

let scales = ["C major", "D minor", "E minor", "F major", "G major", "A minor", "B diminished"]; // Array de tonalidades posibles
let selectedScale = ''; // Variable para la tonalidad seleccionada

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Elegir una tonalidad aleatoria de la lista
  selectedScale = random(scales);

  // Obtener las notas de la tonalidad seleccionada usando Tonal.js
  notes = Tonal.Scale.get(selectedScale).notes;

  // Crear un oscilador para cada nota en la escala
  for (let i = 0; i < notes.length; i++) {
    let osc = new p5.Oscillator('sine');
    osc.freq(Tonal.Note.freq(notes[i])); // Establecer la frecuencia basada en la nota
    osc.amp(0); // Comenzar con la amplitud en 0 (sin sonido)
    osc.start();
    oscillators.push(osc);
  }

  // Crear paredes
  for (let i = 0; i < wallCount; i++) {
    let angle = random(TWO_PI); // Ángulo inicial aleatorio
    let radius = random(100, min(width, height) / 2); // Radio inicial aleatorio
    walls[i] = new Boundary(angle, radius);
  }

  particle = new Particle();
  noCursor();
}

function draw() {
  background(245, 245, 235); // Fondo beige muy claro

  // Mostrar el nombre de la tonalidad seleccionada en la parte superior del lienzo
  fill(38, 38, 38); // Color negro para el texto
  textSize(32);
  textAlign(CENTER, TOP);
  textFont('Georgia'); // Usar la fuente predeterminada 'Georgia' con serifa
  text(selectedScale, width / 2, 20);

  // Mostrar las paredes y moverlas
  for (let wall of walls) {
    wall.show();
    wall.update();  // Actualizar el ángulo y el radio para movimiento circular
  }

  // Mantener la partícula en el centro del lienzo
  particle.update(width / 2, height / 2); // Establecer la posición de la partícula en el centro
  particle.show();
  particle.look(walls); // Ver interacciones de los rayos con las paredes

  // Reproducir las notas de la escala seleccionada
  playScaleNotes();
}

// Clase para representar una pared
class Boundary {
  constructor(angle, radius) {
    this.angle = angle;
    this.radius = radius;
    this.speed = random(0.005, 0.015); // Reducir velocidad de rotación
    this.radiusSpeed = random(0.2, 0.5); // Reducir velocidad de cambio del radio
  }

  // Función para mostrar la pared
  show() {
    let x1 = width / 2 + cos(this.angle) * this.radius;
    let y1 = height / 2 + sin(this.angle) * this.radius;
    let x2 = width / 2 + cos(this.angle + 0.1) * this.radius;
    let y2 = height / 2 + sin(this.angle + 0.1) * this.radius;

    stroke(38, 38, 38); // Paredes de color negro
    line(x1, y1, x2, y2);
  }

  // Función para actualizar el ángulo y el radio
  update() {
    this.angle += this.speed;
    this.radius += this.radiusSpeed;

    // Restringir el radio dentro del rango visible
    if (this.radius > min(width, height) / 2 || this.radius < 50) {
      this.radiusSpeed *= -1; // Invertir la dirección del cambio de radio
    }
  }
}

// Clase para los rayos
class Ray {
  constructor(pos, angle) {
    this.pos = pos;
    this.dir = p5.Vector.fromAngle(angle);
  }

  lookAt(x, y) {
    this.dir.x = x - this.pos.x;
    this.dir.y = y - this.pos.y;
    this.dir.normalize();
  }

  show() {
    stroke(38, 38, 38); // Rayos de color negro
    push();
    translate(this.pos.x, this.pos.y);
    line(0, 0, this.dir.x * 2, this.dir.y * 2);
    pop();
  }

  cast(wall) {
    let x1 = width / 2 + cos(wall.angle) * wall.radius;
    let y1 = height / 2 + sin(wall.angle) * wall.radius;
    let x2 = width / 2 + cos(wall.angle + 0.1) * wall.radius;
    let y2 = height / 2 + sin(wall.angle + 0.1) * wall.radius;

    const x3 = this.pos.x;
    const y3 = this.pos.y;
    const x4 = this.pos.x + this.dir.x;
    const y4 = this.pos.y + this.dir.y;

    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den == 0) {
      return;
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t > 0 && t < 1 && u > 0) {
      const pt = createVector();
      pt.x = x1 + t * (x2 - x1);
      pt.y = y1 + t * (y2 - y1);
      return pt;
    } else {
      return;
    }
  }
}

// Clase para la partícula (fuente de luz)
class Particle {
  constructor() {
    this.pos = createVector(width / 2, height / 2);  // Inicialmente en el centro
    this.rays = [];
    for (let a = 0; a < 360; a += rayCount) {
      this.rays.push(new Ray(this.pos, radians(a)));
    }
  }

  update(x, y) {
    this.pos.set(x, y); // Establecer la posición de la partícula en el centro
  }

  look(walls) {
    for (let i = 0; i < this.rays.length; i++) {
      const ray = this.rays[i];
      let closest = null;
      let record = Infinity;
      for (let wall of walls) {
        const pt = ray.cast(wall);
        if (pt) {
          const d = p5.Vector.dist(this.pos, pt);
          if (d < record) {
            record = d;
            closest = pt;
          }
        }
      }
      if (closest) {
        stroke(38, 38, 38, 100); // Rayos de color negro con opacidad
        line(this.pos.x, this.pos.y, closest.x, closest.y);
      }
    }
  }

  show() {
    fill(38, 38, 38); // Partícula de color negro
    noStroke();
    ellipse(this.pos.x, this.pos.y, 1);  // Fuente de luz en el centro
    for (let ray of this.rays) {
      ray.show();
    }
  }
}

// Function to play notes of the selected scale using p5.Oscillator
function playScaleNotes() {
  let timeInterval = 1000; // Interval between notes in milliseconds

  // Loop through each note in the selected scale
  for (let i = 0; i < notes.length; i++) {
    let osc = oscillators[i];
    osc.amp(0.5, 0.1); // Set amplitude to play sound
    setTimeout(() => {
      osc.amp(0, 0.5); // Fade out the sound after some time
    }, timeInterval);

    // Increment the time interval for the next note
    timeInterval += 1000;
  }
}
