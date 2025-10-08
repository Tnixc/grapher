// Simple Math Expression Parser and Evaluator
// Supports basic arithmetic, trigonometry, and common functions

class MathParser {
  constructor() {
    this.functions = {
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      asin: Math.asin,
      acos: Math.acos,
      atan: Math.atan,
      sinh: Math.sinh,
      cosh: Math.cosh,
      tanh: Math.tanh,
      abs: Math.abs,
      sqrt: Math.sqrt,
      exp: Math.exp,
      ln: Math.log,
      log: Math.log10,
      log10: Math.log10,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      sec: (x) => 1 / Math.cos(x),
      csc: (x) => 1 / Math.sin(x),
      cot: (x) => 1 / Math.tan(x),
      logb: (base, value) => Math.log(value) / Math.log(base),
    };

    this.constants = {
      pi: Math.PI,
      e: Math.E,
    };
  }

  parse(expression) {
    return new CompiledExpression(expression, this);
  }

  tokenize(expr) {
    const tokens = [];
    let i = 0;

    while (i < expr.length) {
      const char = expr[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers
      if (
        /\d/.test(char) ||
        (char === "." && i + 1 < expr.length && /\d/.test(expr[i + 1]))
      ) {
        let num = "";
        while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === ".")) {
          num += expr[i];
          i++;
        }
        tokens.push({ type: "NUMBER", value: parseFloat(num) });
        continue;
      }

      // Identifiers (functions, variables, constants)
      if (/[a-zA-Z]/.test(char)) {
        let name = "";
        while (i < expr.length && /[a-zA-Z]/.test(expr[i])) {
          name += expr[i];
          i++;
        }
        tokens.push({ type: "IDENTIFIER", value: name });
        continue;
      }

      // Operators and parentheses
      if ("+-*/^()".includes(char)) {
        tokens.push({ type: "OPERATOR", value: char });
        i++;
        continue;
      }

      // Comma for function arguments
      if (char === ",") {
        tokens.push({ type: "COMMA", value: char });
        i++;
        continue;
      }

      throw new Error(`Unexpected character: ${char}`);
    }

    return tokens;
  }

  evaluate(tokens, variables) {
    let pos = 0;

    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    const parseExpression = () => {
      return parseAddSub();
    };

    const parseAddSub = () => {
      let left = parseMulDiv();

      while (
        peek() &&
        peek().type === "OPERATOR" &&
        (peek().value === "+" || peek().value === "-")
      ) {
        const op = consume().value;
        const right = parseMulDiv();
        if (op === "+") {
          left = left + right;
        } else {
          left = left - right;
        }
      }

      return left;
    };

    const parseMulDiv = () => {
      let left = parsePower();

      while (
        peek() &&
        peek().type === "OPERATOR" &&
        (peek().value === "*" || peek().value === "/")
      ) {
        const op = consume().value;
        const right = parsePower();
        if (op === "*") {
          left = left * right;
        } else {
          left = left / right;
        }
      }

      return left;
    };

    const parsePower = () => {
      let left = parseUnary();

      while (peek() && peek().type === "OPERATOR" && peek().value === "^") {
        consume(); // consume '^'
        const right = parseUnary();
        left = Math.pow(left, right);
      }

      return left;
    };

    const parseUnary = () => {
      if (
        peek() &&
        peek().type === "OPERATOR" &&
        (peek().value === "+" || peek().value === "-")
      ) {
        const op = consume().value;
        const value = parseUnary();
        return op === "-" ? -value : value;
      }

      return parsePrimary();
    };

    const parsePrimary = () => {
      const token = peek();

      if (!token) {
        throw new Error("Unexpected end of expression");
      }

      // Number
      if (token.type === "NUMBER") {
        consume();
        return token.value;
      }

      // Parentheses
      if (token.type === "OPERATOR" && token.value === "(") {
        consume(); // consume '('
        const value = parseExpression();
        if (!peek() || peek().value !== ")") {
          throw new Error("Missing closing parenthesis");
        }
        consume(); // consume ')'
        return value;
      }

      // Identifier (variable, constant, or function)
      if (token.type === "IDENTIFIER") {
        const name = token.value;
        consume();

        // Check if it's a function call
        if (peek() && peek().type === "OPERATOR" && peek().value === "(") {
          consume(); // consume '('
          const args = [];

          // Parse arguments
          if (!peek() || peek().value !== ")") {
            args.push(parseExpression());

            while (peek() && peek().type === "COMMA") {
              consume(); // consume ','
              args.push(parseExpression());
            }
          }

          if (!peek() || peek().value !== ")") {
            throw new Error("Missing closing parenthesis");
          }
          consume(); // consume ')'

          if (this.functions[name]) {
            return this.functions[name](...args);
          }
          throw new Error(`Unknown function: ${name}`);
        }

        // Check if it's a constant
        if (this.constants[name] !== undefined) {
          return this.constants[name];
        }

        // Check if it's a variable
        if (variables[name] !== undefined) {
          return variables[name];
        }

        throw new Error(`Unknown identifier: ${name}`);
      }

      throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
    };

    return parseExpression();
  }
}

class CompiledExpression {
  constructor(expression, parser) {
    this.expression = expression;
    this.parser = parser;
    this.tokens = null;

    try {
      this.tokens = parser.tokenize(expression);
    } catch (error) {
      throw new Error(`Parse error: ${error.message}`);
    }
  }

  evaluate(variables) {
    try {
      return this.parser.evaluate([...this.tokens], variables);
    } catch (error) {
      throw new Error(`Evaluation error: ${error.message}`);
    }
  }
}

// Create a global instance
const math = {
  compile: (expression) => {
    const parser = new MathParser();
    return parser.parse(expression);
  },
};
