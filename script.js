// Helper para parsear arrays de entrada (ej. "1,2,3" o "[1 2 3]")
function parseArrayInput(inputString) {
    // Elimina corchetes y divide por comas o espacios
    const cleanedString = inputString.replace(/[\[\]]/g, '');
    const numbers = cleanedString.split(/[\s,]+/).filter(s => s.trim() !== '').map(Number);

    if (numbers.some(isNaN)) {
        throw new Error("Asegúrate de que todos los valores ingresados sean números válidos.");
    }
    return numbers;
}

// Helper para parsear funciones matemáticas usando math.js
function parseFunction(expr) {
  try {
    return math.compile(expr);
  } catch (e) {
    throw new Error("La función ingresada no es válida. Por favor, revisa la sintaxis (ej: x^2 + 3*x - 1).");
  }
}

// Función para mostrar un spinner de carga
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    element.className = 'result-display'; // Resetear clases
    element.innerHTML = '<div class="spinner"></div> Calculando...';
}

// --- MÉTODOS NUMÉRICOS ---

/**
 * Calcula la raíz de una función usando el Método de la Secante.
 * @param {string} expr - Expresión de la función f(x).
 * @param {number} x0 - Primer valor inicial.
 * @param {number} x1 - Segundo valor inicial.
 * @param {number} TOL - Tolerancia de error.
 * @param {number} MAX_ITER - Número máximo de iteraciones.
 * @returns {object} Objeto con la raíz aproximada y el número de iteraciones, o un mensaje de error.
 */
function metodoSecante() {
  const TOL = 0.0001;
  const MAX_ITER = 1000;
  const resultadoElement = document.getElementById("resultadoSecante");
  showLoading("resultadoSecante"); // Mostrar spinner de carga

  setTimeout(() => { // Usar setTimeout para simular un cálculo y permitir que el spinner se muestre
    try {
      const expr = document.getElementById("funcionSecante").value;
      if (!expr) throw new Error("Por favor, ingrese una función.");
      let f = parseFunction(expr);

      let x0 = parseFloat(document.getElementById("x0").value);
      let x1 = parseFloat(document.getElementById("x1").value);

      if (isNaN(x0) || isNaN(x1)) throw new Error("Los valores iniciales deben ser números válidos.");

      let cont = 1;
      let x2;

      while (cont <= MAX_ITER) {
        let f0 = f.evaluate({x: x0});
        let f1 = f.evaluate({x: x1});

        // Evitar división por cero o muy cercana
        if (Math.abs(f1 - f0) < 1e-9) {
          resultadoElement.className = 'result-display error';
          resultadoElement.innerText = "Error: División por cero o f(x1) ~ f(x0). Intente otros valores iniciales.";
          return;
        }

        x2 = x1 - (x1 - x0) * (f1 / (f1 - f0));

        // Criterio de parada
        if (Math.abs(x2 - x1) <= TOL) {
          resultadoElement.innerText = `Raíz aproximada: ${x2.toFixed(6)} en ${cont} iteraciones.`;
          return;
        }

        x0 = x1;
        x1 = x2;
        cont++;
      }

      // Si se alcanza el límite de iteraciones sin converger
      resultadoElement.className = 'result-display error';
      resultadoElement.innerText = `No se encontró una raíz en ${MAX_ITER} iteraciones con la tolerancia dada. Última aproximación: ${x2 ? x2.toFixed(6) : 'N/A'}.`;

    } catch (error) {
      resultadoElement.className = 'result-display error';
      resultadoElement.innerText = `Error: ${error.message}`;
    }
  }, 100); // Pequeño retardo para que el spinner sea visible
}

/**
 * Calcula la raíz de una función usando el Método de Bisección.
 * @param {string} expr - Expresión de la función f(x).
 * @param {number} a - Extremo inferior del intervalo.
 * @param {number} b - Extremo superior del intervalo.
 * @param {number} TOL - Tolerancia de error.
 * @param {number} MAX_ITER - Número máximo de iteraciones.
 * @returns {object} Objeto con el raíz aproximada y el número de iteraciones, o un mensaje de error.
 */
function metodoBiseccion() {
  const TOL = 0.0001;
  const MAX_ITER = 1000;
  const resultadoElement = document.getElementById("resultadoBiseccion");
  showLoading("resultadoBiseccion"); // Mostrar spinner de carga

  setTimeout(() => {
    try {
      const expr = document.getElementById("funcionBiseccion").value;
      if (!expr) throw new Error("Por favor, ingrese una función.");
      let f = parseFunction(expr);

      let a = parseFloat(document.getElementById("a").value);
      let b = parseFloat(document.getElementById("b").value);

      if (isNaN(a) || isNaN(b)) throw new Error("Los extremos del intervalo deben ser números válidos.");
      if (a >= b) throw new Error("El extremo inferior 'a' debe ser menor que el extremo superior 'b'.");

      let fa = f.evaluate({x: a});
      let fb = f.evaluate({x: b});

      // Validar que f(a) y f(b) tengan signos opuestos
      if (fa * fb > 0) {
        resultadoElement.className = 'result-display error';
        resultadoElement.innerText = "No se puede aplicar el método. f(a) y f(b) deben tener signos opuestos.";
        return;
      }

      let iteraciones = 0;
      let c;

      while ((b - a) / 2 > TOL && iteraciones <= MAX_ITER) {
        c = (a + b) / 2;
        let fc = f.evaluate({x: c});

        if (Math.abs(fc) < 1e-9) break; // Si fc es muy cercano a cero, es la raíz

        if (fa * fc < 0) {
          b = c;
          fb = fc;
        } else {
          a = c;
          fa = fc;
        }
        iteraciones++;
      }

      const raizAproximada = (a + b) / 2;
      resultadoElement.innerText = `Raíz aproximada: ${raizAproximada.toFixed(6)} en ${iteraciones} iteraciones.`;

      if (iteraciones > MAX_ITER) {
        resultadoElement.className = 'result-display error';
        resultadoElement.innerText += ` (Límite de iteraciones alcanzado, la precisión podría ser insuficiente.)`;
      }

    } catch (error) {
      resultadoElement.className = 'result-display error';
      resultadoElement.innerText = `Error: ${error.message}`;
    }
  }, 100);
}

/**
 * Calcula el valor interpolado usando el Polinomio de Lagrange.
 * @param {number} xVal - Valor de x a interpolar.
 * @param {number[]} X - Array de puntos x conocidos.
 * @param {number[]} Y - Array de puntos y conocidos.
 * @returns {object} Objeto con el valor interpolado, o un mensaje de error.
 */
function metodoPolilagrange() {
  const resultadoElement = document.getElementById("resultadoPolilagrange");
  showLoading("resultadoPolilagrange"); // Mostrar spinner de carga

  setTimeout(() => {
    try {
      const xVal = parseFloat(document.getElementById("xValLagrange").value);
      const Xstr = document.getElementById("X_pointsLagrange").value;
      const Ystr = document.getElementById("Y_pointsLagrange").value;

      if (isNaN(xVal)) throw new Error("El valor 'x' para evaluar debe ser un número válido.");

      const X = parseArrayInput(Xstr);
      const Y = parseArrayInput(Ystr);

      if (X.length === 0 || Y.length === 0) throw new Error("Las listas de puntos X e Y no pueden estar vacías.");
      if (X.length !== Y.length) throw new Error("Las listas de puntos X e Y deben tener la misma cantidad de elementos.");

      let y_interp = 0;
      for (let i = 0; i < X.length; i++) {
        let L = 1;
        for (let j = 0; j < X.length; j++) {
          if (j !== i) {
            if (X[i] - X[j] === 0) throw new Error("Puntos X duplicados detectados. El polinomio de Lagrange no puede ser calculado.");
            L = L * (xVal - X[j]) / (X[i] - X[j]);
          }
        }
        y_interp = y_interp + L * Y[i];
      }

      resultadoElement.innerText = `f(${xVal}) ≈ ${y_interp.toFixed(6)}`;

    } catch (error) {
      resultadoElement.className = 'result-display error';
      resultadoElement.innerText = `Error: ${error.message}`;
    }
  }, 100);
}

/**
 * Calcula el punto fijo de una función usando el Método de Punto Fijo.
 * @param {string} gExpr - Expresión de la función de iteración g(x).
 * @param {number} x0 - Valor inicial.
 * @param {number} TOL - Tolerancia de error.
 * @param {number} MAX_ITER - Número máximo de iteraciones.
 * @returns {object} Objeto con el punto fijo aproximado y el número de iteraciones, o un mensaje de error.
 */
function metodoPuntoFijo() {
  const TOL = 0.0001;
  const MAX_ITER = 1000;
  const resultadoElement = document.getElementById("resultadoPuntoFijo");
  showLoading("resultadoPuntoFijo"); // Mostrar spinner de carga

  setTimeout(() => {
    try {
      const gExpr = document.getElementById("funcionG").value;
      const x0 = parseFloat(document.getElementById("x0PuntoFijo").value);

      if (!gExpr) throw new Error("Por favor, ingrese la función g(x).");
      if (isNaN(x0)) throw new Error("El valor inicial x₀ debe ser un número válido.");

      let g = parseFunction(gExpr); // g(x)

      let a1 = x0;
      let cont = 1;
      let a2;

      while (cont <= MAX_ITER) {
        a2 = g.evaluate({x: a1});

        if (Math.abs(a2 - a1) <= TOL) {
          resultadoElement.innerText = `Raíz aproximada: ${a2.toFixed(6)} en ${cont} iteraciones.`;
          return; // Salir de la función al encontrar la raíz
        }

        a1 = a2;
        cont++;
      }

      // Si se alcanza el límite de iteraciones sin converger
      resultadoElement.className = 'result-display error';
      resultadoElement.innerText = `No se encontró una raíz en ${MAX_ITER} iteraciones con la tolerancia dada. Última aproximación: ${a1.toFixed(6)}.`;

    } catch (error) {
      resultadoElement.className = 'result-display error';
      resultadoElement.innerText = `Error: ${error.message}`;
    }
  }, 100);
}

/**
 * Calcula la raíz de una función usando el Método de Newton-Raphson.
 * @param {string} fExpr - Expresión de la función f(x).
 * @param {number} x0 - Valor inicial.
 * @param {number} TOL - Tolerancia de error.
 * @param {number} MAX_ITER - Número máximo de iteraciones.
 * @returns {object} Objeto con el raíz aproximada y el número de iteraciones, o un mensaje de error.
 */
function metodoNewtonRaphson() {
  const TOL = 0.0001;
  const MAX_ITER = 1000;
  const resultadoElement = document.getElementById("resultadoNewtonRaphson");
  showLoading("resultadoNewtonRaphson"); // Mostrar spinner de carga

  setTimeout(() => {
    try {
      const fExpr = document.getElementById("funcionFNewton").value;
      const x0 = parseFloat(document.getElementById("x0Newton").value);

      if (!fExpr) throw new Error("Por favor, ingrese la función f(x).");
      if (isNaN(x0)) throw new Error("El valor inicial x₀ debe ser un número válido.");

      let f = parseFunction(fExpr);
      let x1 = x0;
      let cont = 1;
      let x2;

      while (cont <= MAX_ITER) {
        let f_val = f.evaluate({x: x1});
        // Usamos la librería math.js para calcular la derivada simbólica
        let df_expr = math.derivative(fExpr, 'x');
        let Df_val = df_expr.evaluate({x: x1});

        if (Math.abs(Df_val) < 1e-9) { // Evitar división por cero
          resultadoElement.className = 'result-display error';
          resultadoElement.innerText = "Error: Derivada muy cercana a cero. Posiblemente un mínimo/máximo local o punto de inflexión. Intente otro x₀.";
          return;
        }

        x2 = x1 - (f_val / Df_val);

        if (Math.abs(x2 - x1) <= TOL) {
          resultadoElement.innerText = `Raíz aproximada: ${x2.toFixed(6)} en ${cont} iteraciones.`;
          return;
        }

        x1 = x2;
        cont++;
      }

      resultadoElement.className = 'result-display error';
      resultadoElement.innerText = `No se encontró una raíz en ${MAX_ITER} iteraciones con la tolerancia dada. Última aproximación: ${x1.toFixed(6)}.`;

    } catch (error) {
      resultadoElement.className = 'result-display error';
      resultadoElement.innerText = `Error: ${error.message}`;
    }
  }, 100);
}


// --- LÓGICA DE INTERFAZ (MENÚ DE SELECCIÓN DE MÉTODOS Y MODAL) ---

/**
 * Muestra el contenido del método seleccionado y activa el botón correspondiente en el menú.
 * @param {string} methodId - El ID del div de contenido del método a mostrar.
 */
function showMethodContent(methodId) {
  // Ocultar todos los contenidos de métodos
  const contents = document.querySelectorAll('.method-content');
  contents.forEach(content => {
    content.classList.remove('active');
  });

  // Desactivar todos los botones del menú de métodos
  const buttons = document.querySelectorAll('#method-selection .method-button');
  buttons.forEach(button => {
    button.classList.remove('active');
  });

  // Mostrar el contenido del método seleccionado
  const selectedContent = document.getElementById(methodId);
  if (selectedContent) {
    selectedContent.classList.add('active');
  }

  // Activar el botón del menú correspondiente
  const selectedButton = document.querySelector(`.method-button[data-method="${methodId}"]`);
  if (selectedButton) {
    selectedButton.classList.add('active');
  }
}

// Funcionalidad para el modal "Acerca de"
function openModal() {
  document.getElementById('aboutModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('aboutModal').style.display = 'none';
}

// Cerrar modal al hacer clic fuera del contenido
window.onclick = function(event) {
  const modal = document.getElementById('aboutModal');
  if (event.target == modal) {
    closeModal();
  }
}

// Mostrar el primer método (Lagrange) al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  showMethodContent('lagrange-content');
});