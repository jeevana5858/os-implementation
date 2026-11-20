class InversionSimulator {
  constructor(options = {}) {
    this.options = {
      lowPriority: options.lowPriority ?? 1,
      mediumPriority: options.mediumPriority ?? 2,
      highPriority: options.highPriority ?? 3,
      holdTime: options.holdTime ?? 6,
      highArrival: options.highArrival ?? 4,
      totalTicks: options.totalTicks ?? 24
    };
  }

  run(protocol) {
    const o = this.options;
    const ceiling = o.highPriority;
    const tasks = {
      Low: {name:'Low', priority:o.lowPriority, arrival:0, remaining:10, deadline:20, effective:o.lowPriority, state:'ready', color:'#43a8ff'},
      Medium: {name:'Medium', priority:o.mediumPriority, arrival:1, remaining:7, deadline:18, effective:o.mediumPriority, state:'ready', color:'#f5c84c'},
      High: {name:'High', priority:o.highPriority, arrival:o.highArrival, remaining:5, deadline:o.highArrival + 8, effective:o.highPriority, state:'not-arrived', color:'#ff6682'}
    };

    let owner = null;
    let lockRemaining = 0;
    let lowLockAcquired = false;
    let highBlockStart = null;
    let highAcquisition = null;
    let blockedTicks = 0;
    let inversionTicks = 0;
    let rows = [];

    for (let t = 0; t < o.totalTicks; t++) {
      for (const task of Object.values(tasks)) {
        if (task.arrival <= t && task.state === 'not-arrived') task.state = 'ready';
      }

      // Low acquires the mutex after 2 ticks of work and holds it.
      if (t === 2) {
        owner = 'Low'; lowLockAcquired = true; lockRemaining = o.holdTime;
        if (protocol === 'ceiling') tasks.Low.effective = ceiling;
      }

      // High becomes blocked once it arrives while Low owns the mutex.
      const high = tasks.High;
      if (high.state === 'ready' && owner === 'Low') {
        if (highBlockStart === null) highBlockStart = t;
        high.state = 'blocked';
        blockedTicks++;
      }

      // Priority inheritance raises Low to High only while High is blocked.
      if (protocol === 'inheritance') {
        tasks.Low.effective = high.state === 'blocked' ? o.highPriority : o.lowPriority;
      }

      const contenders = Object.values(tasks).filter(x => x.state === 'ready' && x.arrival <= t && x.remaining > 0);
      contenders.sort((a,b) => b.effective - a.effective || a.name.localeCompare(b.name));

      let running = null;
      if (contenders.length) {
        running = contenders[0];
        running.remaining--;
        running.state = running.remaining === 0 ? 'done' : 'ready';
      }

      // If Low finishes its critical section, release the mutex.
      if (running?.name === 'Low' && lowLockAcquired) {
        lockRemaining--;
        if (lockRemaining <= 0) {
          owner = null;
          lowLockAcquired = false;
          if (high.state === 'blocked') {
            high.state = 'ready';
            highAcquisition = t + 1;
          }
          tasks.Low.effective = o.lowPriority;
        }
      }

      if (high.state === 'blocked' && owner === 'Low') inversionTicks++;

      if (running) {
        rows.push({tick:t, name:running.name, state:'run', effective:running.effective});
      } else {
        let rowName = high.state === 'blocked' ? 'High' : 'Idle';
        rows.push({tick:t, name:rowName, state:high.state === 'blocked' ? 'blocked' : 'idle', effective:o.highPriority});
      }

      if (t >= 2) {
        const h = tasks.High;
        if (h.remaining === 0) break;
      }
    }

    const high = tasks.High;
    let completion = o.totalTicks;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].name === 'High' && rows[i].state === 'run') {
        completion = rows[i].tick + 1;
        break;
      }
    }
    const missed = completion > high.deadline;

    return {
      protocol, rows,
      blockingTicks: blockedTicks,
      inversionTicks,
      completion,
      deadline:high.deadline,
      missed
    };
  }
}
