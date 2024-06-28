// serve with `python -m SimpleHTTPServer 8000`
// http://localhost:8000

function getFormValues() {
    console.log(`getting form values`);
    return {
        birthDay: new Date(document.getElementById("birthday").value),
        sex: document.querySelector('input[name="sex"]:checked').value,
        optimism: document.querySelector('input[name="optimism"]:checked').value,
    }
}

function calculate() {
    console.log(`calculating`);
    document.getElementById("calculate").setAttribute("disabled", "disabled");

    const formValues = getFormValues();
    console.log("formValues", formValues);
    const birthDay = formValues.birthDay;
    var sheetIndex = 5;
    if (formValues.sex == "w") sheetIndex += 1;
    if (formValues.optimism == "optimistic") sheetIndex += 2;

    const currentDate = new Date();
    const currentAgeInYears = new Date(currentDate - formValues.birthDay).getFullYear() - 1970;
    const birthYear = birthDay.getFullYear();

    if(birthYear < 1923 || birthYear > 2023) {
        throw new Error(`Birth year must be in range [1923, 2023], was ${birthYear}`);
    }

    const sheetName = `12621-0${sheetIndex}`;
    console.log(`using sheet ${sheetName}`);
    const sheet = window.workbook.Sheets[sheetName];

    const columnIndexForBirthYear1923 = 1
    const rowIndexForCompletedYears0 = 8

    // debug start
    const topLeftContentCell = XLSX.utils.encode_cell({c: columnIndexForBirthYear1923, r: rowIndexForCompletedYears0});
    const cell = sheet[topLeftContentCell];
    const content = cell.v;
    console.log("topLeftContentCell content", content, typeof content);
    // debug end

    const columnIndexForMyBirthYear = birthYear - 1923 + columnIndexForBirthYear1923;
    console.log("columnIndexForMyBirthYear", columnIndexForMyBirthYear)
    const startRowIndex = currentAgeInYears + rowIndexForCompletedYears0;
    console.log("startRowIndex", startRowIndex)

    const startingCell = XLSX.utils.encode_cell({c: columnIndexForMyBirthYear, r: startRowIndex});
    console.log("startingCell address", startingCell);
    const startingCellContent = sheet[startingCell].v;
    console.log("startingCell content", startingCellContent, typeof startingCellContent);

    const maxRowIndex = rowIndexForCompletedYears0 + 99;

    // odds to be alive
    var survivalChance = [];
    survivalChance[currentAgeInYears] = 1;

    // odds to die this year
    var deathChance = [];
    deathChance[currentAgeInYears] = startingCellContent;

    var lifeExpectancy = 0;

    console.log(survivalChance);
    for(var thisRowIndex = startRowIndex + 1; thisRowIndex <= maxRowIndex; thisRowIndex++) {
//        console.log("thisRowIndex", thisRowIndex);

        const thisYearsAge = thisRowIndex - rowIndexForCompletedYears0;
//        console.log("thisYearsAge", thisYearsAge);

        const lastYearsAge = thisYearsAge - 1;
//        console.log("lastYearsAge", lastYearsAge);
        const lastYearsOdds = survivalChance[lastYearsAge];
//        console.log("lastYearsOdds", lastYearsOdds);

        const thisCellAddress = XLSX.utils.encode_cell({c: columnIndexForMyBirthYear, r: thisRowIndex});
//        console.log("thisCellAddress", thisCellAddress);
        const thisYearsMortality = sheet[thisCellAddress].v;
//        console.log("thisYearsMortality", thisYearsMortality);
        const thisYearsSurvivalOdds = lastYearsOdds * (1 - thisYearsMortality);
//        console.log("thisYearsSurvivalOdds", thisYearsSurvivalOdds);
        const thisYearsDeathOdds = thisYearsSurvivalOdds * thisYearsMortality;
//        console.log("thisYearsDeathOdds", thisYearsDeathOdds);

        survivalChance[thisYearsAge] = thisYearsSurvivalOdds;
        deathChance[thisYearsAge] = thisYearsDeathOdds;
        lifeExpectancy += thisYearsDeathOdds * thisYearsAge;
    }

    // all years above 100 are "compressed" into 100
    // so real life expectancy is higher
    lifeExpectancy += survivalChance[99] * 100;

    createSurvivalGraph(survivalChance, deathChance, lifeExpectancy);
    document.getElementById("calculate").removeAttribute("disabled");
}

function onSpreadsheetDownloaded(response) {
    console.log(`loading spreadsheet data`);
    window.workbook = XLSX.read(response);

    document.getElementById("calculate").removeAttribute("disabled");
}

function createSurvivalGraph(survivalChance, deathChance, lifeExpectancy) {
    console.log(`creating survival graph`);
    const ctx = document.getElementById('survivalGraph');

    const labels = [];
    const survivalData = [];
    const deathData = [];

    survivalChance.forEach(function(e, i) {
        labels.push(i);
        survivalData.push(e * 100);
        deathData.push(deathChance[i] * 100);
    });

    console.log("survivalChance", survivalChance);
    console.log("labels", labels);
    console.log("survivalData", survivalData);
    console.log("deathData", deathData);
    console.log("lifeExpectancy", lifeExpectancy);

    if(window.chart) window.chart.destroy();
    window.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
            label: 'Wahrscheinlichkeit in %, in diesem Alter noch zu leben',
            data: survivalData,
            borderColor: 'blue',
            backgroundColor: 'blue',
            borderWidth: 1,
            yAxisID: "ySurvival",
          }, {
            label: 'Wahrscheinlichkeit in %, in diesem Alter zu sterben',
            data: deathData,
            borderColor: 'red',
            backgroundColor: 'red',
            borderWidth: 1,
            yAxisID: "yDeath",
        }]
      },
      options: {
        scales: {
          ySurvival: {
            beginAtZero: true,
            ticks: {color: 'blue'},
            id: "ySurvival",
          },
          yDeath: {
            beginAtZero: true,
            id: "yDeath",
            position: "right",
            ticks: {color: 'red'},
            grid: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
          }
        },
        plugins: {
          annotation: {
            annotations: {
              line1: {
                type: 'line',
                scaleId: 'ySurvival',
                xMin: lifeExpectancy - labels[0],
                xMax: lifeExpectancy - labels[0],
                yMin: 0,
                yMax: 100,
                borderWidth: 2,
                label: {
                  display: true,
                  content: `Lebenserwartung: ${lifeExpectancy.toFixed(1)} Jahre`,
                }
              }
            }
          }
        }
      }
    });
}

function downloadSpreadsheet() {
    const url = "statistischer-bericht-kohortensterbetafeln-5126101239005.xlsx";
    console.log(`loading ${url}`)

    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = "arraybuffer";

    req.onload = function(e) {
        onSpreadsheetDownloaded(req.response)
    };

    req.send();
}

document.getElementById("calculate").setAttribute("disabled", "disabled");
document.getElementById("calculate").addEventListener("click", function() {calculate()});
downloadSpreadsheet();
