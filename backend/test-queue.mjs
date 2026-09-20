const delay = (ms) => new Promise(r => setTimeout(r, ms));

class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.delayMs = 1000;
  }
  async enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try { resolve(await fn()); } catch (error) { reject(error); }
      });
      if (!this.processing) this.process();
    });
  }
  async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        const start = Date.now();
        await fn(); // if fn rejects internally, it doesn't throw because it's caught
        const elapsed = Date.now() - start;
        const remainingDelay = this.delayMs - elapsed;
        if (remainingDelay > 0) {
          await delay(remainingDelay);
        }
      }
    }
    this.processing = false;
  }
}
const q = new RequestQueue();
console.log('enqueuing');
q.enqueue(() => { throw new Error('Failed'); }).catch(console.error);
q.enqueue(() => { console.log('2'); return Promise.resolve(2); }).then(console.log);
