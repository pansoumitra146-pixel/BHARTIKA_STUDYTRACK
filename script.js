
const STORAGE_KEY = "studyTrackRecords";
const GOAL_KEY = "studyTrackDailyGoal";

let records = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let dailyGoal = Number(localStorage.getItem(GOAL_KEY)) || 240;

const $ = id => document.getElementById(id);

function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function showMessage(message, success = true) {
  $("message").textContent = message;
  $("message").style.color = success ? "#86efac" : "#fca5a5";
}

function saveStudyRecord() {
  const date = $("studyDate").value;
  const hours = Number($("hours").value);
  const minutes = Number($("minutes").value);

  if (!date) {
    showMessage("Please select a date.", false);
    return;
  }

  if (
    $("hours").value === "" ||
    $("minutes").value === "" ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 || hours > 24 ||
    minutes < 0 || minutes > 59 ||
    (hours === 0 && minutes === 0) ||
    (hours === 24 && minutes > 0)
  ) {
    showMessage("Enter a valid study time.", false);
    return;
  }

  const totalMinutes = hours * 60 + minutes;

  const existing = records.find(record => record.date === date);

  if (existing) {
    existing.minutes = totalMinutes;
  } else {
    records.push({
      date,
      minutes: totalMinutes
    });
  }

  saveRecords();

  $("hours").value = "";
  $("minutes").value = "";

  showMessage("Study record saved successfully!");

  updateDashboard();
}

function deleteRecord(date) {
  if (!confirm("Delete this study record?")) return;

  records = records.filter(record => record.date !== date);

  saveRecords();
  updateDashboard();
}

function updateDashboard() {
  const total = records.reduce(
    (sum, record) => sum + record.minutes, 0
  );

  const average = records.length
    ? Math.round(total / records.length)
    : 0;

  const best = records.length
    ? Math.max(...records.map(record => record.minutes))
    : 0;

  $("totalHours").textContent = formatTime(total);
  $("averageHours").textContent = formatTime(average);
  $("bestDay").textContent = formatTime(best);

  updateGoal();
  updateHistory();
  updateChart();
}

function updateGoal() {
  const today = localDate();

  const todayRecord = records.find(
    record => record.date === today
  );

  const studied = todayRecord ? todayRecord.minutes : 0;

  const percent = dailyGoal > 0
    ? Math.round((studied / dailyGoal) * 100)
    : 0;

  $("goalPercent").textContent = percent + "%";

  $("progressFill").style.width =
    Math.min(percent, 100) + "%";

  if (studied >= dailyGoal) {
    $("goalStatus").textContent =
      "Excellent! You completed your daily goal!";
  } else {
    $("goalStatus").textContent =
      `${formatTime(Math.max(0, dailyGoal - studied))} remaining to reach your goal.`;
  }
}

function setGoal() {
  const value = Number($("goalInput").value);

  if (
    $("goalInput").value === "" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 1440
  ) {
    alert("Enter a goal between 1 and 1440 minutes.");
    return;
  }

  dailyGoal = value;

  localStorage.setItem(GOAL_KEY, dailyGoal);

  updateGoal();
  $("goalInput").value = "";
}

function updateHistory() {
  const body = $("historyBody");

  body.innerHTML = "";

  const sorted = [...records].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  if (sorted.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="3">No study records yet.</td>
      </tr>
    `;
    return;
  }

  sorted.forEach(record => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    const timeCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");

    dateCell.textContent = record.date;
    timeCell.textContent = formatTime(record.minutes);

    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";
    deleteButton.addEventListener("click", () => {
      deleteRecord(record.date);
    });

    actionCell.appendChild(deleteButton);

    row.append(dateCell, timeCell, actionCell);
    body.appendChild(row);
  });
}

// Chart.js

let studyChart;

function updateChart() {
  const labels = [];
  const values = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const dateString = localDate(date);

    labels.push(
      date.toLocaleDateString("en-IN", {
        weekday: "short"
      })
    );

    const record = records.find(
      item => item.date === dateString
    );

    values.push(
      record ? record.minutes / 60 : 0
    );
  }

  if (studyChart) {
    studyChart.data.labels = labels;
    studyChart.data.datasets[0].data = values;
    studyChart.update();
    return;
  }

  const ctx = $("studyChart").getContext("2d");

  studyChart = new Chart(ctx, {
    type: "line",

    data: {
      labels,

      datasets: [{
        label: "Study Hours",
        data: values,

        borderColor: "#60a5fa",
        backgroundColor: "rgba(96,165,250,0.18)",

        fill: true,
        tension: 0.4,

        pointBackgroundColor: "#ffffff",
        pointRadius: 4
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          labels: {
            color: "#ffffff"
          }
        }
      },

      scales: {
        x: {
          ticks: {
            color: "#cbd5e1"
          },
          grid: {
            color: "rgba(255,255,255,0.08)"
          }
        },

        y: {
          beginAtZero: true,

          title: {
            display: true,
            text: "Hours",
            color: "#cbd5e1"
          },

          ticks: {
            color: "#cbd5e1"
          },

          grid: {
            color: "rgba(255,255,255,0.08)"
          }
        }
      }
    }
  });
}

// Initialize application

$("saveBtn").addEventListener("click", saveStudyRecord);
$("goalBtn").addEventListener("click", setGoal);

$("studyDate").value = localDate();

$("todayDate").textContent =
  new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

$("goalInput").placeholder =
  `Current goal: ${dailyGoal} minutes`;

updateDashboard();
