function fibonacci(pos) {
    let [prev, curr] = [0n, 1n];
    for (let i = 2; i <= pos; i++) {
      [prev, curr] = [curr, prev + curr];
    }
    return pos <= 0 ? prev : curr;
  }
  
  module.exports = fibonacci;