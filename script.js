const data = {
  IT: [85, 92, 88, 110, 95, 102, 98, 125],
  HR: [45, 48, 52, 60, 55, 58, 62, 70],
  Finance: [30, 35, 32, 55, 38, 42, 40, 58],
  Operations: [120, 135, 128, 160, 142, 155, 148, 175]
};

let currentDept = 'all';
const canvas = document.getElementById('ticketChart');
const ctx = canvas.getContext('2d');

function getHistorical(dept) {
  if (dept === 'all') {
    return data.IT.map((_, i) => data.IT[i] + data.HR[i] + data.Finance[i] + data.Operations[i]);
  }
  return data[dept];
}

function predictNextWeek(arr) {
  const last4 = arr.slice(-4);
  const avg = last4.reduce((a,b)=>a+b,0)/4;
  const predicted = Math.round(avg * 1.15);
  return { avg: Math.round(avg), predicted };
}

function drawChart(arr, predicted) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  ctx.clearRect(0,0,W,H);

  const allValues = [...arr, predicted];
  const max = Math.max(...allValues) * 1.2;
  const barW = (W - 40) / (arr.length + 1) * 0.6;
  const gap = (W - 40) / (arr.length + 1);

  // grid
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  for(let i=0;i<4;i++){
    const y = 20 + (H-60)/4 * i;
    ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W-10, y); ctx.stroke();
  }

  // bars
  arr.forEach((val, i) => {
    const x = 30 + gap*i + (gap-barW)/2;
    const h = (val/max) * (H-60);
    const y = H-30 - h;
    ctx.fillStyle = i >= arr.length-4 ? '#2563EB' : '#93C5FD';
    ctx.beginPath();
    ctx.roundRect(x, y, barW, h, [6,6,0,0]);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.fillText(val, x+barW/2-10, y-6);
    ctx.fillText('W'+(i+1), x+barW/2-10, H-10);
  });

  // predicted bar (dashed style)
  const x = 30 + gap*arr.length + (gap-barW)/2;
  const h = (predicted/max)*(H-60);
  const y = H-30-h;
  ctx.fillStyle = '#F59E0B';
  ctx.setLineDash([6,4]);
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barW, h);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(245,158,11,0.3)';
  ctx.fillRect(x, y, barW, h);
  ctx.fillStyle = '#92400E';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(predicted, x+barW/2-12, y-6);
  ctx.fillText('Next', x+barW/2-12, H-10);
}

function updateDashboard() {
  const hist = getHistorical(currentDept);
  const { avg, predicted } = predictNextWeek(hist);
  const last = hist[hist.length-1];
  const growth = Math.round((predicted - avg)/avg*100);

  document.getElementById('chart-title').textContent = currentDept==='all' ? 'Total Ticket Volume - All Departments (Combined)' : `Total Ticket Volume - ${currentDept} Department`;
  document.getElementById('logic-code').textContent = `avg(last 4 weeks) = ${avg} → × 1.15 (month-end) = ${predicted} predicted`;
  document.getElementById('predicted-value').textContent = predicted;
  document.getElementById('trend-value').textContent = `+${growth}% vs average`;

  const badge = document.getElementById('workload-badge');
  badge.textContent = predicted > avg*1.2 ? 'HIGH' : predicted > avg*1.05 ? 'MEDIUM' : 'LOW';
  badge.className = 'workload-badge ' + (predicted > avg*1.2 ? 'high' : predicted > avg*1.05 ? 'medium' : 'low');

  if(currentDept==='all'){
    document.getElementById('recommendation-text').textContent = `Add 3 agents organization-wide. Total predicted ${predicted} tickets across all departments. Highest load in Operations.`;
    document.getElementById('insight-text').textContent = `Total volume across all departments shows consistent month-end increase. Average of last 4 weeks is ${avg}, with combined ${last} tickets last week. Predicted ${predicted} indicates organization-wide surge.`;
    document.getElementById('breakdown-card').style.display = 'block';
    // breakdown
    const tbody = document.getElementById('breakdown-body');
    let html = '';
    let totalLast = 0, totalPred = 0;
    ['IT','HR','Finance','Operations'].forEach(d => {
      const arr = data[d];
      const p = predictNextWeek(arr).predicted;
      const l = arr[arr.length-1];
      totalLast+=l; totalPred+=p;
      html += `<tr><td>${d}</td><td>${l}</td><td>${p}</td><td>${Math.round(p/totalPred*100)||0}%</td></tr>`;
    });
    // recalc % correctly
    const finalPred = predictNextWeek(hist).predicted;
    tbody.innerHTML = '';
    ['IT','HR','Finance','Operations'].forEach(d => {
      const arr = data[d];
      const p = predictNextWeek(arr).predicted;
      const l = arr[arr.length-1];
      tbody.innerHTML += `<tr><td>${d}</td><td>${l}</td><td>${p}</td><td>${Math.round(p/finalPred*100)}%</td></tr>`;
    });
    tbody.innerHTML += `<tr><td>TOTAL</td><td>${hist[hist.length-1]}</td><td>${finalPred}</td><td>100%</td></tr>`;
  } else {
    document.getElementById('recommendation-text').textContent = `Total tickets predicted ${predicted} for ${currentDept}. ${predicted>avg*1.2 ? 'Add 1-2 agents.' : 'Maintain current staffing.'}`;
    document.getElementById('insight-text').textContent = `Total volume in ${currentDept} is ${last} last week, avg ${avg} last 4 weeks. Predicted ${predicted} indicates ${growth>10 ? 'significant' : 'stable'} trend for all tickets that came in.`;
    document.getElementById('breakdown-card').style.display = 'none';
  }

  drawChart(hist, predicted);
}

// dept buttons
document.querySelectorAll('.dept-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.dept-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentDept = btn.dataset.dept;
    updateDashboard();
  });
});

document.getElementById('generate-btn').addEventListener('click', () => {
  const btn = document.getElementById('generate-btn');
  btn.textContent = 'Generating...';
  setTimeout(()=>{ updateDashboard(); btn.textContent='Generate Forecast'; }, 600);
});

// sign-off logic
const firstName = document.getElementById('firstName');
const lastName = document.getElementById('lastName');
const reviewCheck = document.getElementById('review-check');
const downloadBtn = document.getElementById('download-btn');
const errorDiv = document.getElementById('signoff-error');
const dateInput = document.getElementById('signoff-date');
dateInput.valueAsDate = new Date();

function validateSignoff(){
  const ok = firstName.value.trim() && lastName.value.trim() && reviewCheck.checked;
  downloadBtn.disabled = !ok;
  errorDiv.style.display = ok ? 'none' : 'block';
  return ok;
}
[firstName, lastName, reviewCheck].forEach(el => el.addEventListener('input', validateSignoff));
reviewCheck.addEventListener('change', validateSignoff);

// download Word doc
document.getElementById('download-btn').addEventListener('click', () => {
  if(!validateSignoff()) return;
  const hist = getHistorical(currentDept);
  const { avg, predicted } = predictNextWeek(hist);
  const deptLabel = currentDept==='all' ? 'All Departments - Combined' : currentDept;
  const name = firstName.value.trim();
  const surname = lastName.value.trim();
  const date = dateInput.value;

  let breakdownHtml = '';
  if(currentDept==='all'){
    breakdownHtml = '<h3>Department Breakdown</h3><table border="1" cellpadding="6"><tr><th>Department</th><th>Last Week</th><th>Predicted</th></tr>';
    ['IT','HR','Finance','Operations'].forEach(d=>{
      const p = predictNextWeek(data[d]).predicted;
      const l = data[d][data[d].length-1];
      breakdownHtml += `<tr><td>${d}</td><td>${l}</td><td>${p}</td></tr>`;
    });
    breakdownHtml += `<tr><td><b>TOTAL</b></td><td><b>${hist[hist.length-1]}</b></td><td><b>${predicted}</b></td></tr></table>`;
  }

  const htmlContent = `
  <html><head><meta charset="UTF-8"></head><body>
  <h1>SERVIQ Weekly Business Report - ${deptLabel}</h1>
  <p><b>Date:</b> ${date}</p>
  <h2>Executive Summary</h2>
  <p>Total tickets predicted: ${predicted}. Average last 4 weeks: ${avg}. This report covers all tickets that came in for ${deptLabel}.</p>
  <h2>Historical Data (Last 8 Weeks)</h2>
  <p>${hist.join(', ')}</p>
  <h2>Prediction Logic</h2>
  <p>Moving average of last 4 weeks (${avg}) × 1.15 month-end factor = ${predicted} predicted tickets.</p>
  <h2>Projected Workload</h2>
  <p><b>Predicted:</b> ${predicted} tickets<br><b>Workload:</b> ${predicted>avg*1.2?'HIGH':'MEDIUM'}<br><b>Recommendation:</b> ${currentDept==='all'?'Add 3 agents organization-wide':'Add 1-2 agents if HIGH'}</p>
  ${breakdownHtml}
  <hr>
  <h2>Human Review Sign-Off (Responsible AI)</h2>
  <p><b>Reviewed By:</b> ${name} ${surname}<br>
  <b>Date:</b> ${date}<br>
  <b>Validation Statement:</b> I have reviewed and validated this forecast for accuracy and business relevance.<br><br>
  Signature: ___________________</p>
  </body></html>`;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SERVIQ_Weekly_Report_${deptLabel.replace(/ /g,'_')}.doc`;
  a.click();
  URL.revokeObjectURL(url);
});

// summary toggle
document.getElementById('summary-toggle').addEventListener('change', (e)=>{
  document.getElementById('exec-summary').style.display = e.target.checked ? 'block' : 'none';
});

updateDashboard();
window.addEventListener('resize', updateDashboard);
