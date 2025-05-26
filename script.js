// Helper para parsear arrays de entrada (ej. "1,2,3" o "[1 2 3]")
function parseArrayInput(inputString) {
    // Elimina corchetes y divide por comas o espacios
    const cleanedString = inputString.replace(/[\[\]]/g, '');
    const numbers = cleanedString.split(/[\s,]+/).filter(s => s.trim() !== '').map(Number);

    if (numbers.some(isNaN)) {
        throw new Error("Asegúrate de que todos los valores ingresados sean números válidos en las listas X e Y.");
    }
    return numbers;
}

// Helper para parsear funciones matemáticas usando math.js
function parseFunction(expr) {
    try {
        // Habilitar funciones comunes para Math.js
        const scope = {
            sin: Math.sin,
            cos: Math.cos,
            tan: Math.tan,
            log: Math.log, // logaritmo natural
            exp: Math.exp,
            abs: Math.abs,
            sqrt: Math.sqrt,
            pow: (base, exp) => Math.pow(base, exp), // para x^n
            pi: Math.PI,
            e: Math.E
        };
        return math.compile(expr);
    } catch (e) {
        throw new Error("La función ingresada no es válida. Por favor, revisa la sintaxis (ej: x^2 + 3*x - 1, sin(x), exp(x)).");
    }
}

// Función para mostrar un spinner de carga
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    element.className = 'result-display'; // Resetear clases
    element.innerHTML = '<div class="spinner"></div> Calculando...';
}

/**
 * Muestra los resultados de un cálculo numérico, incluyendo una tabla para métodos iterativos.
 * @param {string} elementId - ID del elemento HTML donde se mostrará el resultado.
 * @param {string} finalMessage - Mensaje final del resultado (ej. "Raíz aproximada: X").
 * @param {Array<Object>} [iterationsData=null] - Array de objetos con los datos de cada iteración (solo para métodos iterativos).
 * @param {boolean} [isError=false] - Indica si el resultado es un error.
 * @param {string[]} [tableHeaders=null] - Array de strings para los encabezados de la tabla (ej. ['Iteración', 'x_k', 'f(x_k)', 'Error']).
 */
function displayResult(elementId, finalMessage, iterationsData = null, isError = false, tableHeaders = null) {
    const element = document.getElementById(elementId);
    element.className = 'result-display' + (isError ? ' error' : '');

    let htmlContent = '';

    if (isError) {
        htmlContent = `<strong>Error:</strong> ${finalMessage}`;
    } else {
        if (iterationsData && iterationsData.length > 0 && tableHeaders) {
            htmlContent += `<h4>Tabla de Iteraciones:</h4>`;
            htmlContent += `<div class="table-container">`;
            htmlContent += `<table class="results-table">`;
            htmlContent += `<thead><tr>`;
            tableHeaders.forEach(header => {
                htmlContent += `<th>${header}</th>`;
            });
            htmlContent += `</tr></thead>`;
            htmlContent += `<tbody>`;
            iterationsData.forEach(row => {
                htmlContent += `<tr>`;
                Object.values(row).forEach(value => {
                    // Formatear números a 6 decimales, los demás tipos tal cual
                    htmlContent += `<td>${typeof value === 'number' ? value.toFixed(6) : value}</td>`;
                });
                htmlContent += `</tr>`;
            });
            htmlContent += `</tbody></table></div>`;
        }
        htmlContent += `<p><strong>${finalMessage}</strong></p>`;
    }
    element.innerHTML = htmlContent;
}


// --- MÉTODOS NUMÉRICOS ---

/**
 * Calcula la raíz de una función usando el Método de la Secante.
 */
function metodoSecante() {
    const resultadoElementId = "resultadoSecante";
    showLoading(resultadoElementId);

    setTimeout(() => {
        try {
            const expr = document.getElementById("funcionSecante").value;
            let x0 = parseFloat(document.getElementById("x0").value);
            let x1 = parseFloat(document.getElementById("x1").value);
            const TOL = parseFloat(document.getElementById("tolSecante").value);
            const MAX_ITER = parseInt(document.getElementById("maxIterSecante").value);

            if (!expr) throw new Error("Por favor, ingrese una función.");
            if (isNaN(x0) || isNaN(x1)) throw new Error("Los valores iniciales deben ser números válidos.");
            if (isNaN(TOL) || TOL <= 0) throw new Error("La tolerancia debe ser un número positivo.");
            if (isNaN(MAX_ITER) || MAX_ITER <= 0) throw new Error("El máximo de iteraciones debe ser un entero positivo.");

            let f = parseFunction(expr);
            let cont = 1;
            let x2;
            let iterations = [];
            let error = Infinity;

            while (cont <= MAX_ITER) {
                let f0 = f.evaluate({x: x0});
                let f1 = f.evaluate({x: x1});

                if (Math.abs(f1 - f0) < 1e-12) { // Usar una tolerancia muy pequeña para la división por cero
                    displayResult(resultadoElementId, "División por cero o f(x1) ~ f(x0). Intente otros valores iniciales.", null, true);
                    return;
                }

                x2 = x1 - (x1 - x0) * (f1 / (f1 - f0));
                error = Math.abs(x2 - x1);

                iterations.push({ k: cont, x_k: x2, f_x_k: f.evaluate({x: x2}), error: error });

                if (error <= TOL) {
                    displayResult(resultadoElementId, `Raíz aproximada: ${x2.toFixed(6)} en ${cont} iteraciones.`, iterations, false, ['Iteración', 'x_k', 'f(x_k)', 'Error']);
                    return;
                }

                x0 = x1;
                x1 = x2;
                cont++;
            }

            displayResult(resultadoElementId, `No se encontró una raíz en ${MAX_ITER} iteraciones con la tolerancia dada. Última aproximación: ${x2 ? x2.toFixed(6) : 'N/A'}.`, iterations, true, ['Iteración', 'x_k', 'f(x_k)', 'Error']);

        } catch (error) {
            displayResult(resultadoElementId, error.message, null, true);
        }
    }, 100);
}

/**
 * Calcula la raíz de una función usando el Método de Bisección.
 */
function metodoBiseccion() {
    const resultadoElementId = "resultadoBiseccion";
    showLoading(resultadoElementId);

    setTimeout(() => {
        try {
            const expr = document.getElementById("funcionBiseccion").value;
            let a = parseFloat(document.getElementById("a").value);
            let b = parseFloat(document.getElementById("b").value);
            const TOL = parseFloat(document.getElementById("tolBiseccion").value);
            const MAX_ITER = parseInt(document.getElementById("maxIterBiseccion").value);

            if (!expr) throw new Error("Por favor, ingrese una función.");
            if (isNaN(a) || isNaN(b)) throw new Error("Los extremos del intervalo deben ser números válidos.");
            if (a >= b) throw new Error("El extremo inferior 'a' debe ser menor que el extremo superior 'b'.");
            if (isNaN(TOL) || TOL <= 0) throw new Error("La tolerancia debe ser un número positivo.");
            if (isNaN(MAX_ITER) || MAX_ITER <= 0) throw new Error("El máximo de iteraciones debe ser un entero positivo.");

            let f = parseFunction(expr);
            let fa = f.evaluate({x: a});
            let fb = f.evaluate({x: b});

            if (fa * fb > 0) {
                displayResult(resultadoElementId, "No se puede aplicar el método. f(a) y f(b) deben tener signos opuestos.", null, true);
                return;
            }

            let iteraciones = 0;
            let c;
            let iterations = [];
            let error = (b - a) / 2;

            while (error > TOL && iteraciones <= MAX_ITER) {
                c = (a + b) / 2;
                let fc = f.evaluate({x: c});

                iterations.push({ k: iteraciones + 1, a: a, b: b, c: c, f_c: fc, error: error });

                if (Math.abs(fc) < 1e-12) { // Si fc es muy cercano a cero, es la raíz
                    displayResult(resultadoElementId, `Raíz aproximada: ${c.toFixed(6)} en ${iteraciones + 1} iteraciones (f(c) muy cercano a cero).`, iterations, false, ['Iteración', 'a', 'b', 'c', 'f(c)', 'Error (b-a)/2']);
                    return;
                }

                if (fa * fc < 0) {
                    b = c;
                    fb = fc;
                } else {
                    a = c;
                    fa = fc;
                }
                iteraciones++;
                error = (b - a) / 2;
            }

            const raizAproximada = (a + b) / 2;
            let finalMessage = `Raíz aproximada: ${raizAproximada.toFixed(6)} en ${iteraciones} iteraciones.`;
            if (iteraciones > MAX_ITER) {
                 finalMessage += ` (Límite de iteraciones alcanzado, la precisión podría ser insuficiente.)`;
                 displayResult(resultadoElementId, finalMessage, iterations, true, ['Iteración', 'a', 'b', 'c', 'f(c)', 'Error (b-a)/2']);
            } else {
                displayResult(resultadoElementId, finalMessage, iterations, false, ['Iteración', 'a', 'b', 'c', 'f(c)', 'Error (b-a)/2']);
            }

        } catch (error) {
            displayResult(resultadoElementId, error.message, null, true);
        }
    }, 100);
}

/**
 * Calcula el valor interpolado usando el Polinomio de Lagrange.
 */
function metodoPolilagrange() {
    const resultadoElementId = "resultadoPolilagrange";
    showLoading(resultadoElementId);

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
                        const denominator = X[i] - X[j];
                        if (Math.abs(denominator) < 1e-12) { // Evitar división por cero o muy cercana
                            throw new Error(`Puntos X duplicados o muy cercanos detectados (X[${i}] = ${X[i]}, X[${j}] = ${X[j]}). El polinomio de Lagrange no puede ser calculado.`);
                        }
                        L = L * (xVal - X[j]) / denominator;
                    }
                }
                y_interp = y_interp + L * Y[i];
            }

            displayResult(resultadoElementId, `f(${xVal}) ≈ ${y_interp.toFixed(6)}`);

        } catch (error) {
            displayResult(resultadoElementId, error.message, null, true);
        }
    }, 100);
}

/**
 * Calcula el punto fijo de una función usando el Método de Punto Fijo.
 */
function metodoPuntoFijo() {
    const resultadoElementId = "resultadoPuntoFijo";
    showLoading(resultadoElementId);

    setTimeout(() => {
        try {
            const gExpr = document.getElementById("funcionG").value;
            let x0 = parseFloat(document.getElementById("x0PuntoFijo").value);
            const TOL = parseFloat(document.getElementById("tolPuntoFijo").value);
            const MAX_ITER = parseInt(document.getElementById("maxIterPuntoFijo").value);

            if (!gExpr) throw new Error("Por favor, ingrese la función g(x).");
            if (isNaN(x0)) throw new Error("El valor inicial x₀ debe ser un número válido.");
            if (isNaN(TOL) || TOL <= 0) throw new Error("La tolerancia debe ser un número positivo.");
            if (isNaN(MAX_ITER) || MAX_ITER <= 0) throw new Error("El máximo de iteraciones debe ser un entero positivo.");

            let g = parseFunction(gExpr); // g(x)

            let a1 = x0;
            let cont = 1;
            let a2;
            let iterations = [];
            let error = Infinity;

            while (cont <= MAX_ITER) {
                a2 = g.evaluate({x: a1});
                error = Math.abs(a2 - a1);

                iterations.push({ k: cont, x_k: a2, g_x_k: g.evaluate({x: a2}), error: error });

                if (error <= TOL) {
                    displayResult(resultadoElementId, `Punto Fijo aproximado: ${a2.toFixed(6)} en ${cont} iteraciones.`, iterations, false, ['Iteración', 'x_k', 'g(x_k)', 'Error']);
                    return;
                }

                a1 = a2;
                cont++;
            }

            displayResult(resultadoElementId, `No se encontró un punto fijo en ${MAX_ITER} iteraciones con la tolerancia dada. Última aproximación: ${a1.toFixed(6)}.`, iterations, true, ['Iteración', 'x_k', 'g(x_k)', 'Error']);

        } catch (error) {
            displayResult(resultadoElementId, error.message, null, true);
        }
    }, 100);
}

/**
 * Calcula la raíz de una función usando el Método de Newton-Raphson.
 */
function metodoNewtonRaphson() {
    const resultadoElementId = "resultadoNewtonRaphson";
    showLoading(resultadoElementId);

    setTimeout(() => {
        try {
            const fExpr = document.getElementById("funcionFNewton").value;
            let x0 = parseFloat(document.getElementById("x0Newton").value);
            const TOL = parseFloat(document.getElementById("tolNewton").value);
            const MAX_ITER = parseInt(document.getElementById("maxIterNewton").value);

            if (!fExpr) throw new Error("Por favor, ingrese la función f(x).");
            if (isNaN(x0)) throw new Error("El valor inicial x₀ debe ser un número válido.");
            if (isNaN(TOL) || TOL <= 0) throw new Error("La tolerancia debe ser un número positivo.");
            if (isNaN(MAX_ITER) || MAX_ITER <= 0) throw new Error("El máximo de iteraciones debe ser un entero positivo.");

            let f = parseFunction(fExpr);
            let x1 = x0;
            let cont = 1;
            let x2;
            let iterations = [];
            let error = Infinity;

            while (cont <= MAX_ITER) {
                let f_val = f.evaluate({x: x1});
                // Usamos la librería math.js para calcular la derivada simbólica
                let df_expr = math.derivative(fExpr, 'x');
                let Df_val = df_expr.evaluate({x: x1});

                if (Math.abs(Df_val) < 1e-12) { // Evitar división por cero o muy cercana
                    displayResult(resultadoElementId, "Derivada muy cercana a cero. Posiblemente un mínimo/máximo local o punto de inflexión. Intente otro x₀.", null, true);
                    return;
                }

                x2 = x1 - (f_val / Df_val);
                error = Math.abs(x2 - x1);

                iterations.push({ k: cont, x_k: x2, f_x_k: f.evaluate({x: x2}), df_x_k: Df_val, error: error });

                if (error <= TOL) {
                    displayResult(resultadoElementId, `Raíz aproximada: ${x2.toFixed(6)} en ${cont} iteraciones.`, iterations, false, ['Iteración', 'x_k', 'f(x_k)', 'f\'(x_k)', 'Error']);
                    return;
                }

                x1 = x2;
                cont++;
            }

            displayResult(resultadoElementId, `No se encontró una raíz en ${MAX_ITER} iteraciones con la tolerancia dada. Última aproximación: ${x1.toFixed(6)}.`, iterations, true, ['Iteración', 'x_k', 'f(x_k)', 'f\'(x_k)', 'Error']);

        } catch (error) {
            displayResult(resultadoElementId, error.message, null, true);
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
    const buttons = document.querySelectorAll('.method-button'); // Usar la clase para seleccionar todos
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