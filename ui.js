const simulator = {
  getOptions() {
    return {
      lowPriority:+document.querySelector('#lowPriority').value,
      mediumPriority:+document.querySelector('#mediumPriority').value,
      highPriority:+document.querySelector('#highPriority').value,
      holdTime:+document.querySelector('#holdTime').value,
      highArrival:+document.querySelector('#highArrival').value,
      totalTicks:24
    };
  }
};

let results = [];
let frame = 24;
let playTimer = null;

const names = ['plain','inheritance','ceiling'];
const colors = {Low:'#43a8ff',Medium:'#f5c84c',High:'#ff6682',Blocked:'#ff8c9a',Idle:'#1a2940'};

function renderAll() {
  const engine = new InversionSimulator(simulator.getOptions());
  results = names.map(name => engine.run(name));
  frame = results[0].rows.length;
  names.forEach((name,i) => drawTimeline(name, results[i], frame));
  renderMetrics();
}

function drawTimeline(protocol, result, visibleTicks) {
  const canvas = document.querySelector(`#${protocol}Canvas`);
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  const w = rect.width, h = rect.height;
  ctx.clearRect(0,0,w,h);

  const left=34, top=18, rowH=44, chartW=w-left-10;
  ctx.font='11px Segoe UI';
  ctx.textAlign='left';
  const taskNames=['High','Medium','Low'];

  taskNames.forEach((name,index) => {
    const y=top+index*rowH;
    ctx.fillStyle='#91a2ba'; ctx.fillText(name,left-29,y+15);
    ctx.strokeStyle='#263650'; ctx.setLineDash([2,4]); ctx.beginPath(); ctx.moveTo(left,y+31);ctx.lineTo(w-8,y+31);ctx.stroke();ctx.setLineDash([]);
  });

  const tickW=chartW/24;
  ctx.strokeStyle='#263650';ctx.font='9px Segoe UI';ctx.textAlign='center';
  for(let t=0;t<=24;t+=4){const x=left+t*tickW;ctx.beginPath();ctx.moveTo(x,top-5);ctx.lineTo(x,h-8);ctx.stroke();ctx.fillStyle='#91a2ba';ctx.fillText(t,x, h-2);}

  for(let t=0;t<visibleTicks;t++){
    const event=result.rows[t];
    let taskRow=taskNames.indexOf(event.name);
    if(event.state==='blocked') taskRow=0;
    if(event.state==='idle'||taskRow<0) continue;
    const y=top+taskRow*rowH;
    ctx.fillStyle=event.state==='blocked'?colors.Blocked:colors[event.name];
    ctx.fillRect(left+t*tickW+1,y,tickW-2,26);
  }

  const status=document.querySelector(`#${protocol}Status`);
  status.textContent=result.missed?'Deadline missed':'Deadline met';
  status.className='status '+(result.missed?'failure':'success');
}

function renderMetrics() {
  const labels={plain:'Plain mutex',inheritance:'Priority inheritance',ceiling:'Priority ceiling'};
  document.querySelector('#metricsBody').innerHTML=results.map(r=>`<tr>
    <td><strong>${labels[r.protocol]}</strong></td>
    <td>${r.blockingTicks} ticks</td>
    <td>${r.inversionTicks} ticks</td>
    <td class="${r.missed?'miss':'meet'}">${r.missed?'1 missed':'0 missed'}</td>
    <td>${r.completion} ticks <span style="color:#91a2ba">/ deadline ${r.deadline}</span></td>
  </tr>`).join('');

  // Populate dashboard summary values
  const totalResults = results.reduce((acc, r) => {
    acc.blockingTicks += r.blockingTicks;
    acc.inversionTicks += r.inversionTicks;
    acc.missed += r.missed ? 1 : 0;
    acc.completion += r.completion;
    return acc;
  }, {blockingTicks: 0, inversionTicks: 0, missed: 0, completion: 0});

  document.querySelector('#totalBlockingTicks').textContent = totalResults.blockingTicks + ' ticks';
  document.querySelector('#totalInversionTicks').textContent = totalResults.inversionTicks + ' ticks';
  document.querySelector('#totalMissed').textContent = totalResults.missed;
  document.querySelector('#totalCompletion').textContent = totalResults.completion + ' ticks';
}

function syncLabels(){
  document.querySelector('#lowValue').textContent=document.querySelector('#lowPriority').value;
  document.querySelector('#mediumValue').textContent=document.querySelector('#mediumPriority').value;
  document.querySelector('#highValue').textContent=document.querySelector('#highPriority').value;
  document.querySelector('#holdValue').textContent=document.querySelector('#holdTime').value+' ticks';
  document.querySelector('#arrivalValue').textContent='tick '+document.querySelector('#highArrival').value;
}

['lowPriority','mediumPriority','highPriority','holdTime','highArrival'].forEach(id=>document.querySelector('#'+id).addEventListener('input',()=>{syncLabels();stopPlay();renderAll();}));
document.querySelector('#restart').addEventListener('click',()=>{stopPlay();frame=24;renderAll();});
document.querySelector('#step').addEventListener('click',()=>{stopPlay();frame=frame>=24?1:frame+1; names.forEach((name,i)=>drawTimeline(name,results[i],frame));});

document.querySelector('#play').addEventListener('click',()=>{
  if(playTimer){stopPlay();return;}
  frame=0;
  const step=()=>{frame++; if(frame>24){frame=24;stopPlay();return;} names.forEach((name,i)=>drawTimeline(name,results[i],frame));};
  playTimer=setInterval(step,+document.querySelector('#speed').value);
  document.querySelector('#play').textContent='❚❚ Pause';
});

function stopPlay(){if(playTimer)clearInterval(playTimer);playTimer=null;document.querySelector('#play').textContent='▶ Play';}
window.addEventListener('resize',()=>renderAll());
syncLabels();renderAll();

// Update the current tick display during play and step
function updateCurrentTickDisplay() {
  document.querySelectorAll('.currentTick').forEach(el => el.textContent = frame);
}

// Call updateCurrentTickDisplay in the step and play event listeners
document.querySelector('#step').addEventListener('click',()=>{stopPlay();frame=frame>=24?1:frame+1; names.forEach((name,i)=>drawTimeline(name,results[i],frame)); updateCurrentTickDisplay();});
document.querySelector('#play').addEventListener('click',()=>{
  if(playTimer){stopPlay();return;}
  frame=0;
  const step=()=>{frame++; if(frame>24){frame=24;stopPlay();return;} names.forEach((name,i)=>drawTimeline(name,results[i],frame)); updateCurrentTickDisplay();};
  playTimer=setInterval(step,+document.querySelector('#speed').value);
  document.querySelector('#play').textContent='❚❚ Pause';
});

// Update the tick indicator on the dashboard during play
function updateTickIndicator() {
  const tickIndicator = document.querySelector('#currentTick');
  tickIndicator.textContent = `Current Tick: ${frame}`;
}

// Call updateTickIndicator in the play and step event listeners
document.querySelector('#step').addEventListener('click',()=>{stopPlay();frame=frame>=24?1:frame+1; names.forEach((name,i)=>drawTimeline(name,results[i],frame)); updateCurrentTickDisplay(); updateTickIndicator();});
document.querySelector('#play').addEventListener('click',()=>{
  if(playTimer){stopPlay();return;}
  frame=0;
  const step=()=>{frame++; if(frame>24){frame=24;stopPlay();return;} names.forEach((name,i)=>drawTimeline(name,results[i],frame)); updateCurrentTickDisplay(); updateTickIndicator();};
  playTimer=setInterval(step,+document.querySelector('#speed').value);
  document.querySelector('#play').textContent='❚❚ Pause';
});

document.querySelector('.menu-button')?.addEventListener('click', () => {
  document.querySelector('.dashboard-sidebar')?.classList.toggle('mobile-open');
});

document.querySelectorAll('.nav-item').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    link.classList.add('active');
    document.querySelector('.dashboard-sidebar')?.classList.remove('mobile-open');
  });
});
